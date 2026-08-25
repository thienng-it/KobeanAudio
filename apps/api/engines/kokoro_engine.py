import asyncio
import io
import os
import re
from pathlib import Path
from typing import AsyncIterator
import soundfile as sf

from config import settings
from domain.models import EngineType, TTSRequest, Voice
from engines.base import RawAudioChunk, TTSEngine
from engines.neural_synth import clean_script_for_tts, stream_neural_speech, synthesize_neural_speech

KOKORO_VOICES = [
    ("af_heart", "female", "en-us", "Warm, natural, soothing female voice (Top rated)"),
    ("af_sarah", "female", "en-us", "Clear, professional, modern podcast host"),
    ("af_bella", "female", "en-us", "Expressive, bright, conversational storyteller"),
    ("af_nicole", "female", "en-us", "Calm, articulate, audiobook narration"),
    ("af_sky", "female", "en-us", "Youthful, energetic, friendly explainer"),
    ("af_alloy", "female", "en-us", "Smooth, balanced, modern digital assistant"),
    ("af_jessica", "female", "en-us", "Warm, emotional, dramatic narrative"),
    ("af_river", "female", "en-us", "Soft, meditative, gentle cadence"),
    ("am_adam", "male", "en-us", "Deep, resonant, authoritative baritone"),
    ("am_michael", "male", "en-us", "Dynamic, clear, commercial voiceover"),
    ("am_echo", "male", "en-us", "Crisp, technical, modern podcast style"),
    ("am_eric", "male", "en-us", "Friendly, relatable, casual storyteller"),
    ("am_liam", "male", "en-us", "Young, enthusiastic, audiobook protagonist"),
    ("am_onyx", "male", "en-us", "Dark, cinematic, powerful narrator"),
    ("bf_emma", "female", "en-gb", "Refined British RP, elegant and articulate"),
    ("bf_isabella", "female", "en-gb", "Warm British accent, literary narration"),
    ("bf_alice", "female", "en-gb", "Polished, classical British storyteller"),
    ("bf_lily", "female", "en-gb", "Soft, expressive British English"),
    ("bm_george", "male", "en-gb", "Distinguished British gentleman, documentary"),
    ("bm_lewis", "male", "en-gb", "Modern British male, engaging and sharp"),
    ("bm_daniel", "male", "en-gb", "Rich British baritone, classical drama"),
    ("bm_fable", "male", "en-gb", "Theatrical British narrator, whimsical"),
    ("jf_alpha", "female", "ja", "Japanese natural female voice, gentle tone"),
    ("jf_gongitsune", "female", "ja", "Japanese storytelling narrative"),
    ("jm_kumo", "male", "ja", "Japanese clear male speaker"),
    ("zf_xiaobei", "female", "zh", "Mandarin natural female voice, clear"),
    ("zm_yunjian", "male", "zh", "Mandarin resonant male voice, documentary"),
    ("ff_siwis", "female", "fr", "French natural female voice, elegant"),
]


class KokoroEngine(TTSEngine):
    engine_type = EngineType.KOKORO
    name = "Kokoro (82M · Apache 2.0)"
    description = "Ultra-fast local TTS with 14x real-time speed on Apple Silicon CPU/MLX"

    def __init__(self):
        self._model = None
        self._model_path = settings.BASE_DIR / "models" / "kokoro" / "kokoro-v1.0.onnx"
        self._voices_path = settings.BASE_DIR / "models" / "kokoro" / "voices-v1.0.bin"

    async def initialize(self) -> None:
        if self._model is None and self._model_path.exists() and self._voices_path.exists():
            try:
                from kokoro_onnx import Kokoro
                self._model = Kokoro(str(self._model_path), str(self._voices_path))
                print("✅ Kokoro-82M native ONNX model loaded successfully on Apple Silicon!")
            except Exception as e:
                print(f"[WARN] Failed to load native Kokoro model: {e}")

    def is_available(self) -> tuple[bool, str]:
        if self._model_path.exists() and self._voices_path.exists():
            return True, "Ready (Native Kokoro-82M ONNX · 14x Speed)"
        return True, "Ready (Neural Fallback Active)"

    def get_voices(self) -> list[Voice]:
        return [
            Voice(
                id=v_id,
                name=v_id.replace("_", " ").title(),
                engine=EngineType.KOKORO,
                language=v_lang,
                gender=v_gender,
                description=v_desc,
                tags=["Local ⚡", "14x Realtime", "Apache 2.0"],
            )
            for v_id, v_gender, v_lang, v_desc in KOKORO_VOICES
        ]

    def _determine_language(self, voice_id: str) -> str:
        if voice_id.startswith("bf_") or voice_id.startswith("bm_"):
            return "en-gb"
        if voice_id.startswith("jf_") or voice_id.startswith("jm_"):
            return "ja"
        if voice_id.startswith("zf_") or voice_id.startswith("zm_"):
            return "zh"
        if voice_id.startswith("ff_"):
            return "fr"
        return "en-us"

    async def _generate_native_kokoro(
        self, text: str, voice_id: str, speed: float = 1.0
    ) -> tuple[bytes, int, str]:
        clean_text = clean_script_for_tts(text)
        lang = self._determine_language(voice_id)

        def _sync_create():
            if self._model is None:
                from kokoro_onnx import Kokoro
                self._model = Kokoro(str(self._model_path), str(self._voices_path))
            samples, sr = self._model.create(
                clean_text,
                voice=voice_id,
                speed=speed,
                lang=lang,
            )
            out_io = io.BytesIO()
            sf.write(out_io, samples, sr, format="WAV")
            return out_io.getvalue(), sr, "audio/wav"

        return await asyncio.to_thread(_sync_create)

    async def generate_stream(self, request: TTSRequest) -> AsyncIterator[RawAudioChunk]:
        if self._model_path.exists() and self._voices_path.exists():
            clean_text = clean_script_for_tts(request.text)
            sentences = [s.strip() for s in re.split(r"[.!?]+", clean_text) if s.strip()]
            if not sentences:
                sentences = [clean_text]

            for idx, sentence in enumerate(sentences):
                wav_bytes, sr, mime = await self._generate_native_kokoro(
                    sentence, request.voice_id, request.speed
                )
                yield RawAudioChunk(
                    data=wav_bytes,
                    index=idx,
                    is_final=False,
                    sample_rate=sr,
                    mime_type=mime,
                )
                await asyncio.sleep(0.01)

            yield RawAudioChunk(
                data=b"",
                index=len(sentences),
                is_final=True,
                sample_rate=24000,
                mime_type="audio/wav",
            )
        else:
            async for chunk in stream_neural_speech(
                text=request.text,
                voice_id=request.voice_id,
                speed=request.speed,
                pitch=request.pitch,
                sample_rate=24000,
            ):
                yield chunk

    async def generate(self, request: TTSRequest) -> tuple[bytes, int, str]:
        if self._model_path.exists() and self._voices_path.exists():
            try:
                return await self._generate_native_kokoro(
                    request.text, request.voice_id, request.speed
                )
            except Exception as e:
                print(f"[WARN] Native Kokoro error: {e}, using neural synthesizer.")

        return await synthesize_neural_speech(
            text=request.text,
            voice_id=request.voice_id,
            speed=request.speed,
            pitch=request.pitch,
            sample_rate=24000,
        )
