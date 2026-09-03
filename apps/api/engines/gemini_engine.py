import asyncio
import os
import re
from collections.abc import AsyncIterator
from datetime import datetime

from config import settings
from domain.models import EngineType, GeminiModelVariant, TTSRequest, Voice
from engines.base import RawAudioChunk, TTSEngine
from engines.neural_synth import stream_neural_speech, synthesize_neural_speech
from engines.wav_utils import convert_pcm_to_wav

GEMINI_VOICES = [
    ("Achernar", "female", "Clear, poised, standard English narration"),
    ("Achird", "male", "Authoritative, resonant, deep documentary voice"),
    ("Algenib", "male", "Warm, celebratory storytelling voice, versatile"),
    ("Algieba", "female", "Bright, articulate, modern educational speaker"),
    ("Alnilam", "male", "Confident, energetic, commercial and podcast tone"),
    ("Aoede", "female", "Melodic, gentle, bedtime story and soothing voice"),
    ("Autonoe", "female", "Crisp, corporate, informative presentation tone"),
    ("Callirrhoe", "female", "Youthful, friendly, conversational and warm"),
    ("Charon", "male", "Deep, dramatic, cinematic trailer style voice"),
    ("Despina", "female", "Empathetic, calm, meditation and guidance tone"),
    ("Enceladus", "male", "Youthful, enthusiastic, gaming and tech style"),
    ("Erinome", "female", "Sophisticated, refined British RP aesthetic"),
    ("Fenrir", "male", "Gravelly, bold, intense dramatic narration"),
    ("Gacrux", "male", "Reassuring, elderly, wise mentor figure"),
    ("Iapetus", "male", "Neutral, clear, audio news anchor style"),
    ("Kore", "female", "Cheerful, upbeat, children content and explainer"),
    ("Laomedeia", "female", "Soft, reflective, poetic and literary"),
    ("Leda", "female", "Dynamic, sharp, fast-paced storytelling"),
    ("Orus", "male", "Friendly neighbor, approachable casual tone"),
    ("Puck", "neutral", "Playful, whimsical, animated character voice"),
    ("Pulcherrima", "female", "Elegant, dramatic, classic theater delivery"),
    ("Rasalgethi", "male", "Rich, baritone, audio documentary host"),
    ("Sadachbia", "male", "Thoughtful, academic, philosophical pacing"),
    ("Sadaltager", "female", "Warm maternal, encouraging, instructional"),
    ("Schedar", "female", "Decisive, executive, business briefing voice"),
    ("Sulafat", "male", "Casual storytelling, relaxed natural cadence"),
    ("Umbriel", "male", "Mysterious, whispered, suspenseful atmospheric"),
    ("Vindemiatrix", "female", "Vibrant, expressive, theatrical narrative"),
    ("Zephyr", "neutral", "Smooth, modern AI assistant, balanced and clear"),
    ("Zubenelgenubi", "male", "Classic radio DJ, warm broadcast resonance"),
]

# Prioritized cascade pool for maximum stability & quota resilience
GEMINI_FALLBACK_CHAIN = [
    GeminiModelVariant.FLASH_2_5.value,  # Most stable, high throughput
    GeminiModelVariant.FLASH_3_1.value,  # Flagship 3.1 Preview
    GeminiModelVariant.PRO_2_5.value,  # Studio HD Pro
]


class GeminiEngine(TTSEngine):
    engine_type = EngineType.GEMINI
    name = "Google AI Studio (Gemini TTS)"
    description = "Cloud-powered SOTA Speech LLM with director's notes & 200+ expressive tags"

    def __init__(self):
        self._client = None
        self._quota_status: dict[str, dict] = {
            GeminiModelVariant.FLASH_2_5.value: {
                "model_id": GeminiModelVariant.FLASH_2_5.value,
                "name": "Gemini 2.5 Flash TTS",
                "status": "ready",
                "badge": "🟢 High Quota Active",
                "message": "Standard high-throughput endpoint (1,500 req/day). Sub-second latency.",
                "last_checked": datetime.now().isoformat(),
                "retry_after": None,
            },
            GeminiModelVariant.FLASH_3_1.value: {
                "model_id": GeminiModelVariant.FLASH_3_1.value,
                "name": "Gemini 3.1 Flash TTS (Preview)",
                "status": "limited",
                "badge": "🟡 Free-Tier Cap (10/day)",
                "message": "Experimental preview model. Auto-cascades to 2.5 Flash if 429 occurs.",
                "last_checked": datetime.now().isoformat(),
                "retry_after": None,
            },
            GeminiModelVariant.PRO_2_5.value: {
                "model_id": GeminiModelVariant.PRO_2_5.value,
                "name": "Gemini 2.5 Pro TTS",
                "status": "limited",
                "badge": "🟡 Studio HD Tier",
                "message": "Pro mastering endpoint. Fails over to 2.5 Flash if limited.",
                "last_checked": datetime.now().isoformat(),
                "retry_after": None,
            },
        }

    def _get_client(self):
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return None
        if self._client is None:
            from google import genai

            self._client = genai.Client(api_key=api_key)
        return self._client

    async def initialize(self) -> None:
        pass

    def is_available(self) -> tuple[bool, str]:
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return True, "Ready (Studio Neural & Local Fallback Active)"
        return True, "Ready (Google AI Pro Plan)"

    def get_voices(self) -> list[Voice]:
        return [
            Voice(
                id=v_name,
                name=v_name,
                engine=EngineType.GEMINI,
                language="en",
                gender=v_gender,
                description=v_desc,
                tags=["Google AI Pro", "Director's Notes", "Emotion Tags"],
            )
            for v_name, v_gender, v_desc in GEMINI_VOICES
        ]

    def get_quota_status(self) -> dict[str, dict]:
        return self._quota_status

    async def check_live_health(self) -> dict[str, dict]:
        """
        Runs quick live probe across models to determine exact current quota health.
        """
        client = self._get_client()
        if not client:
            return self._quota_status

        from google.genai import types

        for model_id in GEMINI_FALLBACK_CHAIN:
            try:

                def _probe(target_model=model_id):
                    return client.models.generate_content(
                        model=target_model,
                        contents="Kobean",
                        config=types.GenerateContentConfig(
                            response_modalities=["audio"],
                            speech_config=types.SpeechConfig(
                                voice_config=types.VoiceConfig(
                                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                        voice_name="Puck"
                                    )
                                )
                            ),
                        ),
                    )

                await asyncio.to_thread(_probe)
                self._quota_status[model_id] = {
                    "model_id": model_id,
                    "name": model_id.split("-")[1].title() if "-" in model_id else model_id,
                    "status": "ready",
                    "badge": "🟢 Online & Ready",
                    "message": "Quota healthy and responsive.",
                    "last_checked": datetime.now().isoformat(),
                    "retry_after": None,
                }
            except Exception as e:
                err_msg = str(e)
                if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg:
                    self._quota_status[model_id] = {
                        "model_id": model_id,
                        "name": model_id.split("-")[1].title() if "-" in model_id else model_id,
                        "status": "exhausted",
                        "badge": "🔴 429 Quota Exceeded",
                        "message": "Daily request quota reached for this preview model. Auto-cascades to 2.5 Flash.",
                        "last_checked": datetime.now().isoformat(),
                        "retry_after": 60,
                    }
                else:
                    self._quota_status[model_id] = {
                        "model_id": model_id,
                        "name": model_id.split("-")[1].title() if "-" in model_id else model_id,
                        "status": "limited",
                        "badge": "🟡 Rate Limited",
                        "message": f"Endpoint response: {err_msg[:80]}",
                        "last_checked": datetime.now().isoformat(),
                        "retry_after": None,
                    }
        return self._quota_status

    def _format_prompt_for_voice(self, text: str, voice_name: str) -> str:
        text = re.sub(
            r"Speaker\s*1\s*[-—]\s*[^:\n]+:",
            f"Speaker 1 — {voice_name}:",
            text,
            flags=re.IGNORECASE,
        )
        return text

    async def _call_gemini_api(
        self, text: str, voice_name: str, model_name: str, temperature: float
    ) -> tuple[bytes, int, str]:
        client = self._get_client()
        if not client:
            raise ValueError("No Gemini API Key available")

        from google.genai import types

        formatted_text = self._format_prompt_for_voice(text, voice_name)
        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=formatted_text)],
            )
        ]

        generate_content_config = types.GenerateContentConfig(
            temperature=temperature,
            response_modalities=["audio"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice_name)
                )
            ),
        )

        def _sync_call():
            return client.models.generate_content(
                model=model_name,
                contents=contents,
                config=generate_content_config,
            )

        resp = await asyncio.to_thread(_sync_call)
        accumulated_pcm = bytearray()
        last_mime = "audio/L16;rate=24000"

        if resp.candidates and resp.candidates[0].content and resp.candidates[0].content.parts:
            for part in resp.candidates[0].content.parts:
                if part.inline_data and part.inline_data.data:
                    accumulated_pcm.extend(part.inline_data.data)
                    if part.inline_data.mime_type:
                        last_mime = part.inline_data.mime_type

        if len(accumulated_pcm) == 0:
            raise ValueError("Empty audio received from Gemini API")

        final_wav = convert_pcm_to_wav(bytes(accumulated_pcm), last_mime)
        return final_wav, 24000, "audio/wav"

    async def generate_stream(self, request: TTSRequest) -> AsyncIterator[RawAudioChunk]:
        client = self._get_client()
        if not client:
            async for chunk in stream_neural_speech(
                text=request.text,
                voice_id=request.voice_id,
                speed=request.speed,
                pitch=request.pitch,
                sample_rate=24000,
            ):
                yield chunk
            return

        try:
            gen_res = await self.generate_with_telemetry(request)
            wav_bytes = gen_res[0]
            sr = gen_res[1]
            mime = gen_res[2]

            chunk_size = 48000
            total_chunks = (len(wav_bytes) + chunk_size - 1) // chunk_size

            for idx in range(total_chunks):
                start = idx * chunk_size
                end = min(start + chunk_size, len(wav_bytes))
                chunk_data = wav_bytes[start:end]
                yield RawAudioChunk(
                    data=chunk_data,
                    index=idx,
                    is_final=False,
                    sample_rate=sr,
                    mime_type=mime,
                )
                await asyncio.sleep(0.01)

            yield RawAudioChunk(
                data=b"",
                index=total_chunks,
                is_final=True,
                sample_rate=sr,
                mime_type=mime,
            )
        except Exception as e:
            print(f"[WARN] Gemini stream error: {e}, falling back to neural speech.")
            async for chunk in stream_neural_speech(
                text=request.text,
                voice_id=request.voice_id,
                speed=request.speed,
                pitch=request.pitch,
                sample_rate=24000,
            ):
                yield chunk

    async def generate(self, request: TTSRequest) -> tuple[bytes, int, str]:
        wav_bytes, sr, mime, _, _, _ = await self.generate_with_telemetry(request)
        return wav_bytes, sr, mime

    async def generate_with_telemetry(
        self, request: TTSRequest
    ) -> tuple[bytes, int, str, str, bool, str | None]:
        client = self._get_client()
        if not client:
            wav_bytes, sr, mime = await synthesize_neural_speech(
                text=request.text,
                voice_id=request.voice_id,
                speed=request.speed,
                pitch=request.pitch,
                sample_rate=24000,
            )
            return wav_bytes, sr, mime, "Studio Neural Local", True, "No Gemini API Key provided"

        # Build prioritized fallback cascade: requested model first, then remaining stable pool
        user_choice = (
            request.gemini_model.value if request.gemini_model else GEMINI_FALLBACK_CHAIN[0]
        )
        models_to_try = [user_choice]
        for candidate in GEMINI_FALLBACK_CHAIN:
            if candidate not in models_to_try:
                models_to_try.append(candidate)

        last_error = None
        for _idx, model_name in enumerate(models_to_try):
            try:
                wav_bytes, sr, mime = await self._call_gemini_api(
                    text=request.text,
                    voice_name=request.voice_id,
                    model_name=model_name,
                    temperature=request.temperature,
                )

                # Mark model as healthy
                self._quota_status[model_name] = {
                    "model_id": model_name,
                    "name": model_name,
                    "status": "ready",
                    "badge": "🟢 Quota Active & Ready",
                    "message": "Last generation succeeded smoothly.",
                    "last_checked": datetime.now().isoformat(),
                    "retry_after": None,
                }

                was_cascaded = model_name != user_choice
                cascade_reason = (
                    f"Requested {user_choice} was rate/quota limited; smoothly generated via {model_name}"
                    if was_cascaded
                    else None
                )
                return wav_bytes, sr, mime, model_name, was_cascaded, cascade_reason

            except Exception as e:
                last_error = e
                err_str = str(e)
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    print(
                        f"[WARN] Gemini model {model_name} quota exceeded (429), recording status and cascading..."
                    )
                    self._quota_status[model_name] = {
                        "model_id": model_name,
                        "name": model_name,
                        "status": "exhausted",
                        "badge": "🔴 429 Quota Exceeded",
                        "message": "Daily free-tier quota reached. Auto-failover to Gemini 2.5 Flash active.",
                        "last_checked": datetime.now().isoformat(),
                        "retry_after": 60,
                    }
                else:
                    print(f"[WARN] Gemini model {model_name} failed: {e}, cascading...")

        print(
            f"[WARN] All Google Gemini models unavailable ({last_error}), routing to Studio Neural..."
        )
        wav_bytes, sr, mime = await synthesize_neural_speech(
            text=request.text,
            voice_id=request.voice_id,
            speed=request.speed,
            pitch=request.pitch,
            sample_rate=24000,
        )
        return (
            wav_bytes,
            sr,
            mime,
            "Studio Neural Local",
            True,
            f"All cloud models exhausted: {last_error}",
        )
