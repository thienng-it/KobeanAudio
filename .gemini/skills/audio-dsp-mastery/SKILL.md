---
name: audio-dsp-mastery
description: Procedures for audio signal processing, loudness normalization (LUFS), format conversions, and WAV header verification.
---

# Audio DSP Mastery Workflow

## 1. WAV RIFF Header Validation Procedure

Ensure the header structure strictly follows canonical 44-byte format:
```
Offset 00: b"RIFF"
Offset 04: ChunkSize (Total file size - 8)
Offset 08: b"WAVE"
Offset 12: b"fmt "
Offset 16: 16 (Subchunk1Size for PCM)
Offset 20: 1 (AudioFormat = PCM)
Offset 22: NumChannels (1 = Mono, 2 = Stereo)
Offset 24: SampleRate (e.g. 24000)
Offset 28: ByteRate (SampleRate * NumChannels * BitsPerSample / 8)
Offset 32: BlockAlign (NumChannels * BitsPerSample / 8)
Offset 34: BitsPerSample (16 or 24)
Offset 36: b"data"
Offset 40: Subchunk2Size (Data length)
```

## 2. Loudness Normalization Procedure

Target LUFS standards:
- Podcast & Spoken Word: `-16.0 LUFS` (with max peak `-1.0 dBTP`)
- Streaming Music: `-14.0 LUFS`
- Web Audio: `-16.0 LUFS`

Use `AudioProcessor.process_audio(wav_bytes, normalize_lufs=-16.0)` to apply peak and RMS normalization before export.
