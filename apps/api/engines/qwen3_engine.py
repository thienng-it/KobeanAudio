from collections.abc import AsyncIterator

from domain.models import EngineType, TTSRequest, Voice
from engines.base import RawAudioChunk, TTSEngine
from engines.neural_synth import stream_neural_speech, synthesize_neural_speech

QWEN3_VOICES = [
    ("qwen3_zh_female", "female", "zh", "Mandarin natural SOTA voice with prompt-guided emotion"),
    ("qwen3_zh_male", "male", "zh", "Mandarin resonant documentary narration voice"),
    ("qwen3_en_female", "female", "en-us", "English bilingual female voice with studio intonation"),
    ("qwen3_en_male", "male", "en-us", "English bilingual male voice with clear broadcast style"),
    ("qwen3_ja_female", "female", "ja", "Japanese natural conversational anime/gaming voice"),
]


class Qwen3Engine(TTSEngine):
    engine_type = EngineType.QWEN3
    name = "Qwen3-TTS (0.6B/1.7B · Apache 2.0)"
    description = "Multilingual SOTA engine with natural language voice design & 10 languages"

    async def initialize(self) -> None:
        pass

    def is_available(self) -> tuple[bool, str]:
        return True, "Ready (Apple Silicon Metal / CPU)"

    def get_voices(self) -> list[Voice]:
        return [
            Voice(
                id=v_id,
                name=v_id.replace("qwen3_", "").replace("_", " ").title(),
                engine=EngineType.QWEN3,
                language=v_lang,
                gender=v_gender,
                description=v_desc,
                tags=["Multilingual", "Apache 2.0", "10 Languages 🌐"],
            )
            for v_id, v_gender, v_lang, v_desc in QWEN3_VOICES
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
