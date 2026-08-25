---
name: voice-cloning-pipeline
description: Workflow for voice cloning using reference audio samples, microphone recording validation, and profile registration.
---

# Voice Cloning Pipeline Workflow

## 1. Input Sample Validation
- Duration: 5 to 15 seconds of clean, continuous speech.
- Format: WAV, MP3, M4A, or FLAC.
- Noise Floor: Trim leading/trailing silence below `-40 dBFS`.

## 2. MediaRecorder Mic Flow
1. Browser requests audio stream: `navigator.mediaDevices.getUserMedia({ audio: true })`.
2. Capture WAV chunks in real-time.
3. Post `FormData` with `audio_file` and `name` to `POST /api/v1/clone-voice`.
4. Register cloned voice profile into SQLite `cloned_voices` table.
5. Add custom `Voice` object to `ChatterboxEngine` voice catalog.
