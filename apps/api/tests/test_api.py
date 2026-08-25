import pytest
from httpx import ASGITransport, AsyncClient
import struct

from main import app
from db.database import init_db
from engines.wav_utils import convert_pcm_to_wav, parse_audio_mime_type
from domain.services.audio_processor import AudioProcessor


@pytest.fixture(autouse=True)
async def setup_database():
    await init_db()



def test_parse_audio_mime_type():
    res1 = parse_audio_mime_type("audio/L16;rate=24000")
    assert res1["bits_per_sample"] == 16
    assert res1["rate"] == 24000

    res2 = parse_audio_mime_type("audio/L24;rate=48000")
    assert res2["bits_per_sample"] == 24
    assert res2["rate"] == 48000


def test_convert_pcm_to_wav_riff_header():
    raw_pcm = b"\x00\x00" * 2400  # 0.1s of silence at 24kHz 16-bit
    wav = convert_pcm_to_wav(raw_pcm, "audio/L16;rate=24000")

    assert wav.startswith(b"RIFF")
    assert wav[8:12] == b"WAVE"
    assert wav[12:16] == b"fmt "
    assert len(wav) == 44 + len(raw_pcm)

    # Verify duration
    duration = AudioProcessor.calculate_duration_ms(wav)
    assert 50 <= duration <= 150


@pytest.mark.asyncio
async def test_health_check_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["enginesCount"] == 6
        assert "environment" in data
        assert "database" in data
        assert data["database"]["status"] == "connected"
        assert "X-Request-ID" in response.headers
        assert "X-Process-Time-Ms" in response.headers


@pytest.mark.asyncio
async def test_liveness_probe_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/health/liveness")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_validation_error_handler_structure():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Send empty payload to trigger 422
        response = await ac.post("/api/v1/projects", json={})
        assert response.status_code == 422
        data = response.json()
        assert data["status"] == "error"
        assert data["error_code"] == "VALIDATION_ERROR"
        assert "request_id" in data



@pytest.mark.asyncio
async def test_list_engines_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/engines")
        assert response.status_code == 200
        engines = response.json()
        assert len(engines) == 6
        engine_ids = [e["id"] for e in engines]
        assert "kokoro" in engine_ids
        assert "orpheus" in engine_ids
        assert "chatterbox" in engine_ids
        assert "gemini" in engine_ids
        assert "qwen3" in engine_ids
        assert "piper" in engine_ids


@pytest.mark.asyncio
async def test_list_voices_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # All voices
        response = await ac.get("/api/v1/voices")
        assert response.status_code == 200
        voices = response.json()
        assert len(voices) >= 60

        # Filter by Gemini
        res_gemini = await ac.get("/api/v1/voices?engine=gemini")
        assert res_gemini.status_code == 200
        gemini_voices = res_gemini.json()
        assert len(gemini_voices) == 30


@pytest.mark.asyncio
async def test_projects_crud_workflow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Create
        create_res = await ac.post(
            "/api/v1/projects",
            json={
                "name": "Audiobook Chapter 1",
                "description": "Epic fantasy intro",
                "text_content": "In a distant realm shrouded in mist...",
                "engine": "kokoro",
                "voice_id": "af_heart",
            },
        )
        assert create_res.status_code == 200
        proj = create_res.json()
        proj_id = proj["id"]
        assert proj["name"] == "Audiobook Chapter 1"

        # Read
        get_res = await ac.get(f"/api/v1/projects/{proj_id}")
        assert get_res.status_code == 200
        assert get_res.json()["name"] == "Audiobook Chapter 1"

        # Update
        up_res = await ac.put(
            f"/api/v1/projects/{proj_id}",
            json={"name": "Audiobook Chapter 1 (Final Cut)"},
        )
        assert up_res.status_code == 200
        assert up_res.json()["name"] == "Audiobook Chapter 1 (Final Cut)"

        # Delete
        del_res = await ac.delete(f"/api/v1/projects/{proj_id}")
        assert del_res.status_code == 200


@pytest.mark.asyncio
async def test_local_generation_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/generate",
            json={
                "text": "Hello world! Testing KobeanAudio multi-engine synthesizer.",
                "engine": "kokoro",
                "voice_id": "af_heart",
                "output_format": "wav",
            },
        )
        assert res.status_code == 200
        gen = res.json()
        assert gen["engine"] == "kokoro"
        assert gen["audio_url"].startswith("/audio/")
        assert gen["file_size"] > 0

        # Test Trimming the generated take
        trim_res = await ac.post(
            "/api/v1/export/trim",
            json={
                "generation_id": gen["id"],
                "start_time_sec": 0.1,
                "end_time_sec": 0.8,
                "fade_in_ms": 20,
                "fade_out_ms": 20,
                "save_as_new": True,
            },
        )
        assert trim_res.status_code == 200
        trim_data = trim_res.json()
        assert trim_data["status"] == "success"
        assert trim_data["audioUrl"].startswith("/audio/")
        assert trim_data["durationMs"] > 0

