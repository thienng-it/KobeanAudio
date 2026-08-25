# 🍎 TTS Models — MacBook Pro M3 Compatibility Report

> **Your Hardware**: MacBook Pro M3 · 18GB Unified RAM · 512GB SSD
>
> **Key Constraint**: Apple Silicon uses **Metal/MPS/MLX** — NOT NVIDIA CUDA. This changes everything.

---

## ⚡ Quick Verdict for YOUR Machine

```
┌──────────────────────────────────────────────────────────────────┐
│            What Actually Runs Great on YOUR M3 Mac               │
│                                                                  │
│  🟢 PERFECT  Kokoro (82M)      CPU/MLX/CoreML  — Blazing fast   │
│  🟢 PERFECT  Orpheus (3B)      llama.cpp+Metal — 2-4x realtime  │
│  🟢 PERFECT  Piper             CPU only        — Instant        │
│  🟡 GOOD     Chatterbox        MPS (needs setup)— 2-3x vs CPU   │
│  🟡 GOOD     Qwen3-TTS (1.7B) MLX native      — Runs offline   │
│  🟡 GOOD     Dia (1.6B)        MLX port        — Works well     │
│  🟡 GOOD     Fish Speech       MPS partial     — Some issues    │
│  🔵 CLOUD    Gemini TTS        API (no local)  — Always works   │
│  🔴 POOR     F5-TTS            CUDA-dependent  — Not for Mac    │
│  🔴 POOR     Sesame CSM        CUDA required   — Not for Mac    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📊 Full M3 Compatibility Matrix

| Model | Params | M3 Support | Acceleration | RAM Usage | Speed | Setup Difficulty |
|-------|:------:|:----------:|:------------:|:---------:|:-----:|:----------------:|
| **Kokoro** | 82M | 🟢 Native | MLX / CoreML / CPU | ~0.5GB | ⚡ 14x RT | 🟢 Easy |
| **Orpheus** | 3B | 🟢 Native | llama.cpp + Metal | ~3-4GB (Q4) | ⚡ 2-4x RT | 🟢 Easy |
| **Piper** | 15-75M | 🟢 Native | CPU | ~0.1GB | ⚡ 50x+ RT | 🟢 Easy |
| **Chatterbox** | ~300M | 🟡 Works | PyTorch MPS | ~2-3GB | 🚀 2-3x vs CPU | 🟡 Medium |
| **Qwen3-TTS** | 0.6/1.7B | 🟡 Works | MLX native | ~2-4GB | 🚀 Good | 🟡 Medium |
| **Dia** | 1.6B | 🟡 Works | MLX port | ~3-4GB | 🚀 Decent | 🟡 Medium |
| **Gemini TTS** | Cloud | 🔵 API | N/A (Cloud) | ~0GB | ☁️ Network | 🟢 Easy |
| **F5-TTS** | ~300M | 🔴 Poor | CUDA only | N/A | ❌ | 🔴 Hard |
| **Sesame CSM** | 1B | 🔴 Poor | CUDA only | N/A | ❌ | 🔴 Hard |

> **RT** = Real-Time. "14x RT" means 14 seconds of audio generated per 1 second of compute.

> [!IMPORTANT]
> With 18GB unified RAM, you can comfortably run **any combination** of these models simultaneously. Even the largest (Orpheus 3B Q4 at ~4GB) leaves 14GB for the OS + your app.

---

## 🏆 Revised Rankings — For YOUR M3 Mac

### 🥇 Tier 1: Runs Perfectly, Zero Friction

---

#### ⚡ Kokoro (82M) — Your Default Engine

**Why #1 on M3**: Apple-native optimizations exist in 3 flavors. On M3, it generates 30 seconds of audio in under a second. The CoreML path even uses the **Apple Neural Engine (ANE)**.

| M3 Path | Framework | Speed | Best For |
|---------|-----------|-------|----------|
| CoreML | `kokoro-coreml` | ⚡⚡⚡ Fastest (ANE) | Real-time streaming |
| MLX | `mlx-audio` | ⚡⚡ Very fast (Metal GPU) | Python integration |
| CPU | `streaming-tts` | ⚡ Still fast (82M is tiny) | Simplest setup |

**Setup on your M3**:
```bash
# Option 1: MLX (recommended for KobeanAudio)
pip install mlx-audio
# Then in Python:
# from mlx_audio.tts import KokoroTTS

# Option 2: Simplest (CPU, still fast enough)
pip install streaming-tts
brew install espeak-ng

# Option 3: OpenAI-compatible API server
docker run -p 8880:8880 remsky/kokoro-fastapi:latest
```

**Estimated performance on your M3**:
- 1 minute of audio → generated in ~4-5 seconds
- Memory: ~500MB
- Quality: ⭐⭐⭐⭐½

---

#### 🎭 Orpheus TTS (3B) — Your Emotional Engine

**Why #1 on M3**: Runs via **llama.cpp** which has **first-class Metal support**. The GGUF format means you get the full 3B model in ~3GB RAM (Q4 quantized). Emotion tags make it the most human-sounding local option.

**Setup on your M3**:
```bash
# 1. Install llama.cpp (Metal is enabled by default on Mac)
brew install llama.cpp

# 2. Download the GGUF model (~3GB)
# From HuggingFace: canopylabs/orpheus-3b-0.1-ft (Q4_K_M variant)
huggingface-cli download QuantFactory/orpheus-3b-0.1-ft-GGUF \
  orpheus-3b-0.1-ft.Q4_K_M.gguf --local-dir ./models

# 3. Start the server with Metal GPU acceleration
llama-server \
  -m ./models/orpheus-3b-0.1-ft.Q4_K_M.gguf \
  -ngl 99 \
  -c 4096

# 4. Use orpheus-tts-local as the audio decoder client
pip install orpheus-speech
```

**Using emotion tags** (this is what makes it sound SO human):
```python
text = """
I just got the most amazing news! <laugh>
I've been waiting for this moment for years. <sigh>
Let me tell you what happened... <gasp>
"""
audio = model.generate(text, voice="tara")
# Available voices: tara, leah, jess, leo, dan, mia, zac, zoe
```

**Estimated performance on your M3**:
- 1 minute of audio → generated in ~15-30 seconds
- Memory: ~3-4GB (Q4_K_M)
- Quality: ⭐⭐⭐⭐⭐ (most emotional/human)

---

#### 🔇 Piper — Your Instant Offline Fallback

**Why perfect for M3**: So lightweight it runs on a Raspberry Pi. On your M3, it's essentially instantaneous. Great as a preview/draft engine before burning compute on higher-quality models.

**Setup**:
```bash
# Install via pip
pip install piper-tts

# Generate audio
echo "Hello, this is a quick preview." | piper \
  --model en_US-lessac-high \
  --output_file preview.wav
```

**Estimated performance on your M3**:
- 1 minute of audio → generated in ~1-2 seconds
- Memory: ~50MB
- Quality: ⭐⭐⭐½ (good but slightly robotic)

---

### 🥈 Tier 2: Works Well, Slightly More Setup

---

#### 🎤 Chatterbox — Your Voice Cloning Engine

**M3 Status**: Works via PyTorch MPS but requires careful dependency management. 2-3x faster than CPU when MPS is properly configured.

**Setup on your M3** (specific order matters!):
```bash
# 1. Create clean environment
python3 -m venv chatterbox-env
source chatterbox-env/bin/activate

# 2. Install PyTorch with MPS support FIRST
pip install torch torchvision torchaudio

# 3. Verify MPS is available
python3 -c "import torch; print(f'MPS: {torch.backends.mps.is_available()}')"
# Should print: MPS: True

# 4. Install Chatterbox WITHOUT auto-dependencies
pip install chatterbox-tts --no-deps

# 5. Manually install remaining deps
pip install transformers diffusers soundfile
```

**Usage with voice cloning**:
```python
from chatterbox.tts import ChatterboxTTS
import torch

# Use MPS device on M3
device = "mps" if torch.backends.mps.is_available() else "cpu"
model = ChatterboxTTS.from_pretrained(device)

# Clone YOUR voice from a 5-15 second clip
wav = model.generate(
    "This sounds exactly like me!",
    audio_prompt_path="my_voice_sample.wav",
    exaggeration=0.5  # 0.0=monotone, 1.0=very expressive
)
```

**Estimated performance on your M3**:
- 10 seconds of audio → ~5-8 seconds to generate (MPS)
- Memory: ~2-3GB
- Quality: ⭐⭐⭐⭐⭐ (best voice cloning)

---

#### 🌐 Qwen3-TTS — Your Multilingual Engine

**M3 Status**: Excellent via `mlx-audio` or dedicated `qwen3-tts-apple-silicon` repo. Runs fully offline.

**Setup on your M3**:
```bash
# Option A: via mlx-audio (recommended)
pip install mlx-audio

# Option B: dedicated Apple Silicon port
git clone https://github.com/user/qwen3-tts-apple-silicon
cd qwen3-tts-apple-silicon
pip install -r requirements.txt
```

**Estimated performance on your M3**:
- Memory: ~2-4GB (1.7B model, quantized)
- Quality: ⭐⭐⭐⭐½
- Bonus: Voice cloning from 3s, natural language voice design

---

### 🥉 Tier 3: Cloud / API-Based

---

#### ☁️ Gemini TTS — Your Premium Cloud Engine

**M3 Status**: Always works (it's an API). Zero local compute. Your existing code from `ai_studio_code.py` is ready to go.

**Tradeoffs**:
- ✅ Highest quality for director's note-style markup
- ✅ Zero local resource usage
- ⚠️ Free tier: ~10-30 RPM, may need billing for heavy use
- ❌ Requires internet
- ❌ Proprietary

---

## 🧮 Memory Budget on Your M3 (18GB)

```
┌──────────────────────────────────────────────────┐
│           18GB Unified Memory Budget              │
│                                                   │
│  macOS + System      ≈  4-5 GB                    │
│  KobeanAudio App     ≈  0.5-1 GB                  │
│  ────────────────────────────────                  │
│  Available for TTS   ≈  12-13 GB  ← Plenty!       │
│                                                   │
│  Can run simultaneously:                          │
│  • Kokoro (0.5GB) + Orpheus Q4 (3.5GB) = 4GB ✅   │
│  • Kokoro (0.5GB) + Chatterbox (2.5GB) = 3GB ✅   │
│  • All 3 at once                        = 6.5GB ✅ │
│                                                   │
│  Even the worst case leaves 5-6 GB free ✅         │
└──────────────────────────────────────────────────┘
```

---

## 🎯 Final Recommendation for KobeanAudio on YOUR Machine

| Engine | Role in KobeanAudio | Why |
|--------|-------------------|-----|
| **Kokoro** (MLX) | 🏠 Default engine | Fastest, lightest, sounds great, M3-native |
| **Orpheus** (llama.cpp) | 🎭 "Expressive" mode | Emotion tags, most human-sounding, Metal-accelerated |
| **Chatterbox** (MPS) | 🎤 "Clone Voice" mode | Users upload voice sample → app sounds like them |
| **Gemini TTS** (API) | ☁️ "Cloud Premium" mode | Director's notes, no local compute, your existing code |
| **Piper** | ⚡ "Quick Preview" mode | Instant drafts before final generation |
| **Qwen3-TTS** (MLX) | 🌐 "Multilingual" mode | Optional — 10 languages, voice design |

> [!TIP]
> **Your M3 is a beast for this project.** You can run Kokoro + Orpheus simultaneously with room to spare. No cloud needed for daily use — Gemini becomes the optional premium add-on rather than the core dependency.

Let me know if you'd like me to fold all of this M3-specific guidance into the enhanced prompt, or if you're ready to start building!
