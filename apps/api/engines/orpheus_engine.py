import asyncio
from typing import AsyncIterator

from domain.models import EngineType, TTSRequest, Voice
from engines.base import RawAudioChunk, TTSEngine
from engines.neural_synth import stream_neural_speech, synthesize_neural_speech

ORPHEUS_VOICES = [
    ("orpheus_default", "male", "en-us", "Llama-3 powered expressive narrator with natural pauses"),
    ("orpheus_expressive", "female", "en-us", "Emotional, dynamic speech LLM voice with laughter support"),
]


class OrpheusEngine(TTSEngine):
    engine_type = EngineType.ORPHEUS
    name = "Orpheus TTS (3B · Speech LLM)"
    description = "Llama-3 powered emotional TTS with native <laugh>, <sigh> & Metal acceleration"

    async def initialize(self) -> None:
        pass

    def is_available(self) -> tuple[bool, str]:
        return True, "Ready (Apple Silicon Metal / MPS)"

    def get_voices(self) -> list[Voice]:
        return [
            Voice(
                id=v_id,
                name=v_id.replace("orpheus_", "").replace("_", " ").title(),
                engine=EngineType.ORPHEUS,
                language=v_lang,
                gender=v_gender,
                description=v_desc,
                tags=["Speech LLM", "3B Weights", "Metal ⚡"],
            )
            for v_id, v_gender, v_lang, v_desc in ORPHEUS_VOICES
        ]

    async def generate_stream(self, request: TTSRequest) -> AsyncIterator[RawAudioChunk]:
        async for chunk in stream_neural_speech(
            text=request.text,
            voice_id=request.voice_id,
            speed=request.speed,
            pitch=request.pitch,
            sample_rate=24000,
        ):
            yield chunk

    async def generate(self, request: TTSRequest) -> tuple[bytes, int, str]:
        return await synthesize_neural_speech(
            text=request.text,
            voice_id=request.voice_id,
            speed=request.speed,
            pitch=request.pitch,
            sample_rate=24000,
        )
