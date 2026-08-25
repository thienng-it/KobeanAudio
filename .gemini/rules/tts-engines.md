# 🎤 TTS Engines & Audio Core Standards

KobeanAudio supports 7 distinct TTS engines and 10 model variants. Follow these architectural standards when touching audio engines.

---

## 1. Unified TTSEngine Contract

Every engine in `apps/api/engines/` must inherit from `TTSEngine` (`apps/api/engines/base.py`) and implement:
- `initialize() -> None`
- `generate_stream(request: TTSRequest) -> AsyncIterator[RawAudioChunk]`
- `generate(request: TTSRequest) -> tuple[bytes, int, str]`
- `get_voices() -> list[Voice]`
- `is_available() -> tuple[bool, str]`

---

## 2. Engine Specifications

| Engine | ID | Primary Strength | Audio Format |
|---|---|---|---|
| **Kokoro** | `kokoro` | Default local engine, 14x real-time on Apple Silicon, 50+ voices | PCM L16 24kHz |
| **Orpheus** | `orpheus` | Emotional Speech-LLM (3B), emotion tags (`<laugh>`, `<sigh>`, `<gasp>`) | PCM L16 24kHz |
| **Chatterbox** | `chatterbox` | Zero-shot voice cloning from 5s sample with emotion exaggeration | PCM L16 24kHz |
| **Google AI Studio** | `gemini` | Cloud SOTA (Pro Plan): 3.1 Flash, 2.5 Flash, 2.5 Pro, 2.5 Flash-Lite, 30 voices | PCM L16 24kHz |
| **Qwen3-TTS** | `qwen3` | Multilingual (10 languages) & natural language voice design | PCM L16 24kHz |
| **Piper** | `piper` | Instant offline preview (<50ms latency, zero GPU needed) | PCM L16 22.05kHz |

---

## 3. Google AI Studio (Gemini TTS) Rules

- **Client**: Use `google-genai` SDK (`from google import genai`).
- **Response Modality**: Set `response_modalities=["audio"]`.
- **Speech Config**: Set `types.SpeechConfig(voice_config=types.VoiceConfig(prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice_id)))`.
- **Chunk Handling**: Handle `chunk.parts is None` gracefully and extract `part.inline_data.data`.
- **WAV Packaging**: Always pass raw PCM through `convert_pcm_to_wav()` to ensure compatibility with standard media players.
