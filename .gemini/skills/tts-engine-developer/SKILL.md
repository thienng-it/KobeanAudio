---
name: tts-engine-developer
description: Step-by-step procedural workflow for creating, configuring, benchmarking, and integrating new TTS engines into KobeanAudio.
---

# TTS Engine Developer Workflow

Follow this procedure whenever implementing or upgrading a TTS engine in KobeanAudio.

## Step 1: Define Engine Contract
1. Add new enum member in `domain/models.py` under `EngineType`.
2. Add engine metadata and voice listings.

## Step 2: Implement Engine Class
1. Create `apps/api/engines/<engine_name>_engine.py`.
2. Inherit from `TTSEngine` in `apps/api/engines/base.py`.
3. Implement `initialize()`, `generate_stream()`, `generate()`, `get_voices()`, `is_available()`.
4. Ensure all raw PCM data is passed through `convert_pcm_to_wav()` to guarantee 44-byte RIFF headers.

## Step 3: Register in TTSService
1. Instantiate the engine in `apps/api/domain/services/tts_service.py`.
2. Add UI metadata (badge, RAM footprint, speed factor) to `get_all_engines_info()`.

## Step 4: Unit Test Verification
1. Add test case in `apps/api/tests/test_api.py`.
2. Verify:
   - Voice enumeration returns expected count.
   - Generated WAV starts with `b"RIFF"` and `b"WAVE"`.
   - Duration calculation is accurate within ±10%.
