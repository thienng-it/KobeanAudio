# 🎧 KobeanAudio Studio

> **Premium Multi-Engine AI Text-to-Audio Studio for macOS (M3 Apple Silicon Optimized)**

KobeanAudio is a high-performance desktop studio for creators, voiceover artists, and developers. It unifies state-of-the-art AI speech models — including Google AI Studio's Gemini TTS and ultra-fast local engines (Kokoro, Orpheus, Chatterbox, Qwen3, Piper) — into a seamless desktop audio workstation.

---

## ✨ Key Features

- **7-Engine AI Voice Architecture**:
  - ⚡ **Kokoro (82M)**: Ultra-fast local synthesis (14x real-time on Apple Silicon, 50+ voices, Apache 2.0).
  - 🎭 **Orpheus (3B)**: Llama-3 Speech LLM with expressive emotion tags (`<laugh>`, `<sigh>`, `<gasp>`, `<yawn>`).
  - 🎤 **Chatterbox**: Zero-shot voice cloning from 5s reference audio with emotion exaggeration control (MIT).
  - ☁️ **Google AI Studio (Gemini Pro)**: 4 models (`3.1-flash-tts`, `2.5-flash-tts`, `2.5-pro-tts`, `2.5-flash-lite-tts`) with 30 prebuilt voices and 200+ director audio tags.
  - 🌐 **Qwen3-TTS**: Multilingual generation across 10 languages with natural language voice design.
  - 🔇 **Piper**: Lightweight instant offline CPU draft synthesis (<50ms).
- **Interactive Audio Workstation**:
  - WaveSurfer.js real-time waveform visualizer with cursor following and scrub-to-seek.
  - TipTap script editor with director note templates and tag insert toolbar.
  - In-app microphone voice recording & file upload for instant voice cloning.
  - Studio export to WAV, MP3 (320kbps), FLAC, OGG, M4A with broadcast LUFS loudness normalization.
  - Project management & generation version history saved in local SQLite.

---

## 🚀 Quick Start

### 1. Prerequisites
- macOS (Apple Silicon M1/M2/M3/M4 recommended)
- Node.js 20+ & pnpm
- Python 3.11+
- ffmpeg (`brew install ffmpeg`)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/KobeanAudio.git
cd KobeanAudio

# Run one-step setup
bash scripts/setup.sh
```

### 3. Environment Variables
Create a `.env` file from the template:
```bash
cp .env.example .env
```
Add your Google AI Studio API key if using cloud Gemini TTS:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run Development Studio

#### Web Studio:
```bash
pnpm dev
```
Open **[http://localhost:3001](http://localhost:3001)** to access the Studio.

#### Native Desktop App (macOS):
```bash
pnpm dev:desktop
```
This launches the native Tauri 2.x desktop workstation window with the backend automatically connected.

---

## 🏛️ Monorepo Architecture

```
KobeanAudio/
├── apps/
│   ├── api/          # FastAPI backend (Unified TTS Engines, Audio DSP, SQLite)
│   ├── web/          # Next.js 15 App Router (Tailwind CSS 4, TipTap, WaveSurfer)
│   └── desktop/      # Tauri 2.x native macOS desktop shell
├── packages/
│   └── types/        # Shared TypeScript domain contracts
├── scripts/          # Setup, dev runner, and model downloaders
└── audio_output/     # Studio audio files and exports
```

---

## 📄 License
MIT License. Open source and free for personal and commercial audio creation.
