import asyncio
import base64
import json
import uuid
from pathlib import Path
from typing import AsyncIterator

from config import settings
from db.database import get_db
from domain.models import (
    AudioChunk,
    EngineInfo,
    EngineType,
    GenerationResponse,
    TTSRequest,
    Voice,
)
from domain.services.audio_processor import AudioProcessor
from engines.base import RawAudioChunk, TTSEngine
from engines.chatterbox_engine import ChatterboxEngine
from engines.gemini_engine import GeminiEngine
from engines.kokoro_engine import KokoroEngine
from engines.orpheus_engine import OrpheusEngine
from engines.piper_engine import PiperEngine
from engines.qwen3_engine import Qwen3Engine


class TTSService:
    def __init__(self):
        self.engines: dict[EngineType, TTSEngine] = {
            EngineType.KOKORO: KokoroEngine(),
            EngineType.ORPHEUS: OrpheusEngine(),
            EngineType.CHATTERBOX: ChatterboxEngine(),
            EngineType.GEMINI: GeminiEngine(),
            EngineType.QWEN3: Qwen3Engine(),
            EngineType.PIPER: PiperEngine(),
        }

    async def initialize(self):
        for engine in self.engines.values():
            try:
                await engine.initialize()
            except Exception as e:
                print(f"[WARN] Failed initializing engine {engine.name}: {e}")

    def get_engine(self, engine_type: EngineType) -> TTSEngine:
        engine = self.engines.get(engine_type)
        if not engine:
            raise ValueError(f"Engine '{engine_type}' is not supported.")
        return engine

    def get_all_engines_info(self) -> list[EngineInfo]:
        engine_configs = {
            EngineType.KOKORO: {
                "name": "Kokoro (82M · Apache 2.0)",
                "description": "Ultra-fast local TTS with 14x real-time speed on Apple Silicon CPU/MLX",
                "speed_factor": "14x Realtime",
                "ram_usage": "0.5 GB",
                "is_cloud": False,
                "requires_gpu": False,
                "requires_api_key": False,
                "badge": "Default · Fast ⚡",
            },
            EngineType.ORPHEUS: {
                "name": "Orpheus TTS (3B · Speech LLM)",
                "description": "Llama-3 powered emotional TTS with native <laugh>, <sigh> & Metal acceleration",
                "speed_factor": "2-4x Realtime",
                "ram_usage": "3.5 GB",
                "is_cloud": False,
                "requires_gpu": True,
                "requires_api_key": False,
                "badge": "Expressive 🎭",
            },
            EngineType.CHATTERBOX: {
                "name": "Chatterbox (Zero-Shot Clone · MIT)",
                "description": "Voice cloning from 5s sample with emotion exaggeration control",
                "speed_factor": "3-5x Realtime",
                "ram_usage": "2.5 GB",
                "is_cloud": False,
                "requires_gpu": True,
                "requires_api_key": False,
                "badge": "Voice Clone 🎤",
            },
            EngineType.GEMINI: {
                "name": "Google AI Studio (Gemini Pro Plan)",
                "description": "Cloud SOTA Speech-LLM with director's notes & 200+ audio tags (4 models)",
                "speed_factor": "Cloud Stream",
                "ram_usage": "0 GB (Cloud)",
                "is_cloud": True,
                "requires_gpu": False,
                "requires_api_key": True,
                "badge": "Google AI Pro ☁️",
            },
            EngineType.QWEN3: {
                "name": "Qwen3-TTS (0.6B/1.7B · Apache 2.0)",
                "description": "Multilingual SOTA engine with natural language voice design & 10 languages",
                "speed_factor": "5-8x Realtime",
                "ram_usage": "2.0 GB",
                "is_cloud": False,
                "requires_gpu": True,
                "requires_api_key": False,
                "badge": "10 Languages 🌐",
            },
            EngineType.PIPER: {
                "name": "Piper (Instant Offline · MIT)",
                "description": "Lightweight CPU preview engine (<50ms latency, zero GPU needed)",
                "speed_factor": "50x Realtime",
                "ram_usage": "0.1 GB",
                "is_cloud": False,
                "requires_gpu": False,
                "requires_api_key": False,
                "badge": "Instant Draft ⚡",
            },
        }

        result = []
        for eng_type, eng_instance in self.engines.items():
            conf = engine_configs.get(eng_type, {})
            is_ready, status_msg = eng_instance.is_available()
            voices = eng_instance.get_voices()

            result.append(
                EngineInfo(
                    id=eng_type,
                    name=conf.get("name", eng_instance.name),
                    description=conf.get("description", eng_instance.description),
                    status="ready" if is_ready else "needs_config",
                    speed_factor=conf.get("speed_factor", "1x"),
                    ram_usage=conf.get("ram_usage", "1GB"),
                    is_cloud=conf.get("is_cloud", False),
                    requires_gpu=conf.get("requires_gpu", False),
                    requires_api_key=conf.get("requires_api_key", False),
                    badge=conf.get("badge"),
                    voices_count=len(voices),
                )
            )
        return result

    def get_all_voices(self, engine_type: EngineType | None = None) -> list[Voice]:
        if engine_type:
            engine = self.get_engine(engine_type)
            return engine.get_voices()
        
        all_voices = []
        for engine in self.engines.values():
            all_voices.extend(engine.get_voices())
        return all_voices

    async def generate_and_save(self, request: TTSRequest, db) -> GenerationResponse:
        engine = self.get_engine(request.engine)
        
        model_used = None
        was_cascaded = False
        cascade_reason = None

        if hasattr(engine, "generate_with_telemetry"):
            raw_wav, sample_rate, _, model_used, was_cascaded, cascade_reason = (
                await engine.generate_with_telemetry(request)
            )
        else:
            raw_wav, sample_rate, _ = await engine.generate(request)
            model_used = engine.name

        # Non-blocking DSP post-processing
        processed_bytes, mime_type = await AudioProcessor.process_audio_async(
            wav_bytes=raw_wav,
            target_format=request.output_format,
            sample_rate=request.sample_rate,
            normalize_lufs=request.normalize_lufs,
            trim_silence=request.trim_silence,
            fade_in_ms=request.fade_in_ms,
            fade_out_ms=request.fade_out_ms,
        )

        gen_id = str(uuid.uuid4())
        ext = request.output_format if request.output_format else "wav"
        file_name = f"gen_{gen_id[:8]}_{request.engine.value}.{ext}"
        file_path = settings.AUDIO_STORAGE_PATH / file_name

        # Non-blocking async disk write
        def _write_file(path: Path, data: bytes):
            with open(path, "wb") as f:
                f.write(data)

        await asyncio.to_thread(_write_file, file_path, processed_bytes)

        duration_ms = AudioProcessor.calculate_duration_ms(raw_wav)
        file_size = len(processed_bytes)
        audio_url = f"/audio/{file_name}"

        # Save to DB
        settings_json = json.dumps(
            {
                "temperature": request.temperature,
                "speed": request.speed,
                "pitch": request.pitch,
                "output_format": request.output_format,
                "sample_rate": request.sample_rate,
                "gemini_model": request.gemini_model.value if request.gemini_model else None,
                "model_used": model_used,
                "was_cascaded": was_cascaded,
                "cascade_reason": cascade_reason,
            }
        )

        await db.execute(
            """
            INSERT INTO generations (id, project_id, text_input, engine, voice_id, gemini_model, settings, audio_url, audio_path, duration_ms, file_size, rating)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
            """,
            (
                gen_id,
                request.project_id,
                request.text,
                request.engine.value,
                request.voice_id,
                request.gemini_model.value if request.gemini_model else None,
                settings_json,
                audio_url,
                str(file_path),
                duration_ms,
                file_size,
            ),
        )
        await db.commit()

        cursor = await db.execute("SELECT created_at FROM generations WHERE id = ?", (gen_id,))
        row = await cursor.fetchone()
        created_at = row[0] if row else ""

        return GenerationResponse(
            id=gen_id,
            project_id=request.project_id,
            text_input=request.text,
            engine=request.engine,
            voice_id=request.voice_id,
            gemini_model=request.gemini_model.value if request.gemini_model else None,
            settings=json.loads(settings_json),
            audio_url=audio_url,
            duration_ms=duration_ms,
            file_size=file_size,
            rating=0,
            created_at=created_at,
            model_used=model_used,
            was_cascaded=was_cascaded,
            cascade_reason=cascade_reason,
        )


tts_service = TTSService()
