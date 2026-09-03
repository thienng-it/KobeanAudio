from collections.abc import AsyncIterator

from domain.models import EngineType, TTSRequest, Voice
from engines.base import RawAudioChunk, TTSEngine
from engines.neural_synth import stream_neural_speech, synthesize_neural_speech

PIPER_VOICES = [
    ("piper_en_lessac", "female", "en-us", "Clean, rapid, lightweight American English narrator"),
    ("piper_en_ryan", "male", "en-us", "Clear, energetic, instant American male voice"),
    ("piper_en_alan", "male", "en-gb", "British English crisp, lightweight speaker"),
]


class PiperEngine(TTSEngine):
    engine_type = EngineType.PIPER
    name = "Piper (Instant Offline · MIT)"
    description = "Ultra-fast lightweight preview engine (<50ms latency, zero GPU needed)"

    async def initialize(self) -> None:
        pass

    def is_available(self) -> tuple[bool, str]:
        return True, "Ready (Instant CPU Draft)"

    def get_voices(self) -> list[Voice]:
        return [
            Voice(
                id=v_id,
                name=v_id.replace("piper_", "").replace("_", " ").title(),
                engine=EngineType.PIPER,
                language=v_lang,
                gender=v_gender,
                description=v_desc,
                tags=["Instant ⚡", "0.1GB RAM", "Offline Draft"],
            )
            for v_id, v_gender, v_lang, v_desc in PIPER_VOICES
        ]

    async def generate_stream(self, request: TTSRequest) -> AsyncIterator[RawAudioChunk]:
        async for chunk in stream_neural_speech(
            text=request.text,
            voice_id=request.voice_id,
            speed=request.speed,
            pitch=request.pitch,
            sample_rate=22050,
        ):
            yield chunk

    async def generate(self, request: TTSRequest) -> tuple[bytes, int, str]:
        return await synthesize_neural_speech(
            text=request.text,
            voice_id=request.voice_id,
            speed=request.speed,
            pitch=request.pitch,
            sample_rate=22050,
        )
