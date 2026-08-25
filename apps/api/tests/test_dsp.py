import pytest
import struct
from domain.services.audio_processor import AudioProcessor
from engines.wav_utils import convert_pcm_to_wav


def generate_sine_pcm(duration_sec: float = 0.5, sample_rate: int = 24000) -> bytes:
    """Generates synthetic 16-bit PCM mono audio data."""
    import math
    num_samples = int(duration_sec * sample_rate)
    samples = []
    for i in range(num_samples):
        # 440 Hz tone
        val = int(32767.0 * 0.5 * math.sin(2.0 * math.pi * 440.0 * (i / sample_rate)))
        samples.append(struct.pack("<h", val))
    return b"".join(samples)


@pytest.mark.asyncio
async def test_audio_processor_process_async_wav():
    raw_pcm = generate_sine_pcm(duration_sec=0.5, sample_rate=24000)
    wav_bytes = convert_pcm_to_wav(raw_pcm, "audio/L16;rate=24000")

    processed, mime_type = await AudioProcessor.process_audio_async(
        wav_bytes=wav_bytes,
        target_format="wav",
        normalize_lufs=-16.0,
        trim_silence=False,
    )

    assert mime_type == "audio/wav"
    assert processed.startswith(b"RIFF")
    duration = AudioProcessor.calculate_duration_ms(processed)
    assert 450 <= duration <= 550


@pytest.mark.asyncio
async def test_audio_processor_process_async_mp3():
    raw_pcm = generate_sine_pcm(duration_sec=0.5, sample_rate=24000)
    wav_bytes = convert_pcm_to_wav(raw_pcm, "audio/L16;rate=24000")

    processed, mime_type = await AudioProcessor.process_audio_async(
        wav_bytes=wav_bytes,
        target_format="mp3",
        bitrate=320,
    )

    assert mime_type == "audio/mpeg"
    assert len(processed) > 0


@pytest.mark.asyncio
async def test_audio_processor_trim_async():
    raw_pcm = generate_sine_pcm(duration_sec=2.0, sample_rate=24000)
    wav_bytes = convert_pcm_to_wav(raw_pcm, "audio/L16;rate=24000")

    trimmed_bytes, new_duration_ms = await AudioProcessor.trim_audio_segment_async(
        wav_bytes=wav_bytes,
        start_ms=500,
        end_ms=1500,
        fade_in_ms=50,
        fade_out_ms=50,
    )

    assert trimmed_bytes.startswith(b"RIFF")
    assert 900 <= new_duration_ms <= 1100
