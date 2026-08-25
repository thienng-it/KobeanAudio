# ⚙️ Backend Architecture & Audio DSP Conventions

KobeanAudio's backend is built with **FastAPI**, **Python 3.12+**, **Pydantic v2**, and **SQLite async** (`aiosqlite`).

---

## 1. Clean Hexagonal Architecture

- `apps/api/domain/models.py`: Pydantic request/response schemas and enums (`TTSRequest`, `ExportRequest`, `TrimRequest`).
- `apps/api/domain/services/`: Pure business logic (`tts_service.py`, `audio_processor.py`).
- `apps/api/engines/`: Specific TTS engine implementations adhering to `TTSEngine`.
- `apps/api/api/routes/`: Thin HTTP/SSE route handlers (`generate.py`, `export.py`, `projects.py`, `engines.py`).
- `apps/api/db/`: Async database operations (`database.py`).

---

## 2. Audio Processing Standards

- **Normalization**: Broadcast standard is `-16.0 LUFS` (Podcasts/Web) or `-14.0 LUFS` (Streaming).
- **Silence Trimming**: Trim leading and trailing audio frames below `-40 dBFS`.
- **Crossfading & Anti-Click Fades**: Multi-chunk audio outputs should apply smooth 100-250ms crossfades; sliced takes must apply 20-50ms micro-fades to eliminate zero-crossing clicks.
- **Format Codecs**:
  - `wav`: Uncompressed PCM 16-bit with canonical 44-byte RIFF header
  - `mp3`: Constant bitrate (320k, 256k, 192k, 128k) via `pydub` & `ffmpeg`
  - `flac`: Lossless compression
  - `ogg`: Vorbis/Opus web-streaming codec
  - `m4a`: AAC codec for Apple ecosystem

---

## 3. Audio Trimming & DSP Slicing Standards

- **`AudioProcessor.trim_audio_segment()`**: Slices WAV buffers between `start_ms` and `end_ms` with configurable anti-click `fade_in_ms` and `fade_out_ms`.
- **Endpoint `POST /api/v1/export/trim`**: Persists the sliced take to `audio_output/` and registers a generation history record in SQLite when `save_as_new=True`.
