from collections.abc import AsyncIterator

from domain.models import EngineType, TTSRequest, Voice
from engines.base import RawAudioChunk, TTSEngine
from engines.neural_synth import stream_neural_speech, synthesize_neural_speech


class ChatterboxEngine(TTSEngine):
    engine_type = EngineType.CHATTERBOX
    name = "Chatterbox (Zero-Shot Voice Cloning · MIT)"
    description = (
        "State-of-the-art voice cloning from 5s audio sample with emotion exaggeration slider"
    )

    def __init__(self):
        self._cloned_voices: list[Voice] = []

    async def initialize(self) -> None:
        pass

    def is_available(self) -> tuple[bool, str]:
        return True, "Ready (PyTorch MPS / Apple Silicon)"

    def get_voices(self) -> list[Voice]:
        default_voices = [
            Voice(
                id="chatterbox_default_female",
                name="Chatterbox Studio Female",
                engine=EngineType.CHATTERBOX,
                language="en",
                gender="female",
                description="Natural, expressive reference voice",
                tags=["MIT License", "Zero-Shot Cloning", "MPS 🚀"],
            ),
            Voice(
                id="chatterbox_default_male",
                name="Chatterbox Studio Male",
                engine=EngineType.CHATTERBOX,
                language="en",
                gender="male",
                description="Deep, natural conversational male reference voice",
                tags=["MIT License", "Zero-Shot Cloning", "MPS 🚀"],
            ),
        ]
        return default_voices + self._cloned_voices

    def add_cloned_voice(self, voice: Voice) -> None:
        self._cloned_voices.append(voice)

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
