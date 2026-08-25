# 🎧 KobeanAudio — Master Implementation Plan

> **Product**: Premium multi-engine text-to-audio **desktop app** (v1 = macOS only, web later)
> **Hardware**: MacBook Pro M3 · 18GB RAM · 512GB SSD
> **Plan**: Google AI Studio **Pro Plan** (higher rate limits, all Gemini TTS models)
> **Target**: Production-grade app with human-quality AI voices — free + cloud engines
> **Repo**: `/Users/josephnguyen/Desktop/KobeanAudio`

---

## 🎯 Product Vision

KobeanAudio is a professional-grade text-to-audio desktop studio that lets creators type or paste text, choose from **7 AI voice engines** (including 4 Google Gemini TTS models), fine-tune emotion and style, clone voices, and export studio-quality audio — all running **locally on Mac** with powerful cloud engines via your Google AI Pro plan.

```
"Type it. Hear it. Feel it." — KobeanAudio
```

### What Makes It Special
1. **7-Engine Architecture** — Kokoro, Orpheus, Chatterbox, 4× Gemini models, Qwen3, Piper
2. **Human-Quality Voices** — Orpheus emotion tags, Chatterbox voice cloning, Gemini director's notes
3. **Google AI Pro** — Full access to Gemini 3.1 Flash, 2.5 Flash, 2.5 Pro, 2.5 Flash-Lite TTS + 30 voices
4. **Runs Locally** — 4 free local engines, no per-character costs
5. **Director's Notes** — Rich markup for pacing, emotion, scenes (Gemini + Orpheus)
6. **Voice Cloning** — Record mic or upload audio → clone your voice (Chatterbox)
7. **M3-Optimized** — MLX, Metal, CoreML native acceleration

---

## 🏛️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        KobeanAudio App                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Frontend (Desktop Only — v1)                │    │
│  │    Next.js 15 (App Router) + Tauri 2.x (macOS)         │    │
│  │    Tailwind CSS 4 · Radix UI · Framer Motion           │    │
│  │    Web Audio API · WaveSurfer.js (Waveform)            │    │
│  │    Zustand (State) · TanStack Query (Server State)     │    │
│  └────────────────────────┬────────────────────────────────┘    │
│                           │ REST / SSE / WebSocket               │
│  ┌────────────────────────▼────────────────────────────────┐    │
│  │              Backend (FastAPI · Python 3.12+)            │    │
│  │    Unified TTS Engine Interface (7 engines)             │    │
│  │    Audio Processing Pipeline (pydub + ffmpeg)           │    │
│  │    Project Storage (SQLite) · Job Queue (asyncio)       │    │
│  └─┬────────┬────────┬────────┬────────┬────────┬────────┬┘    │
│    │        │        │        │        │        │        │      │
│  ┌─▼──┐ ┌──▼──┐ ┌──▼───┐ ┌──▼──────────────────▼──┐ ┌──▼──┐  │
│  │Koko│ │Orph │ │Chatt │ │  Google AI Studio (Pro) │ │Qwen3│  │
│  │ ro │ │ eus │ │erbox │ │                         │ │ TTS │  │
│  │82M │ │ 3B  │ │300M  │ │ ┌─────┐┌─────┐┌─────┐ │ │0.6- │  │
│  │    │ │     │ │      │ │ │3.1  ││2.5  ││2.5  │ │ │1.7B │  │
│  │MLX/│ │llama│ │Py-   │ │ │Flash││Flash││Pro  │ │ │     │  │
│  │Core│ │.cpp │ │Torch │ │ │TTS  ││TTS  ││TTS  │ │ │MLX  │  │
│  │ML  │ │Metal│ │MPS   │ │ └─────┘└─────┘└─────┘ │ │Nati-│  │
│  │    │ │     │ │      │ │ 30 voices · 200+ tags  │ │ve   │  │
│  │Apa-│ │Apa- │ │MIT   │ │ Director's notes       │ │Apa- │  │
│  │che │ │che  │ │      │ │ Google AI Pro Plan      │ │che  │  │
│  │2.0 │ │2.0  │ │      │ │                         │ │2.0  │  │
│  └────┘ └─────┘ └──────┘ └─────────────────────────┘ └─────┘  │
│  DEFAULT EXPRESSIVE CLONE       CLOUD PREMIUM         MULTI-   │
│  ⚡14xRT  🎭2-4xRT  🎤GPU    ☁️ Pro Plan (4 models)   LINGUAL  │
│  0.5GB    3.5GB     2.5GB     0GB local               2-4GB    │
│                                                                 │
│  + 🔇 Piper (Instant Offline Fallback · CPU · 0.1GB)           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack (M3-Optimized · Desktop-Only v1)

| Layer | Technology | Why This One |
|-------|-----------|-------------|
| **Frontend** | Next.js 15 (App Router) | React RSC, API routes, fast dev (web version ready for v2) |
| **Desktop** | Tauri 2.x | 10x smaller than Electron, native Metal, Rust backend |
| **Styling** | Tailwind CSS 4 + Radix UI | Utility-first + accessible unstyled primitives |
| **Animation** | Framer Motion 12 | Spring physics, layout animations, gesture |
| **Audio Vis** | WaveSurfer.js 7 + Web Audio API | Waveform, spectrogram, playback |
| **State** | Zustand 5 + TanStack Query v5 | Lightweight global + server state cache |
| **Editor** | TipTap (ProseMirror) | Rich text, custom node types, extensible |
| **Mic Recording** | MediaRecorder API + `lamejs` | In-browser voice recording for cloning |
| **Backend** | FastAPI (Python 3.12+) | Async-first, type-safe, streaming SSE |
| **TTS Default** | Kokoro 82M via `mlx-audio` | M3-native MLX, 14x real-time, Apache 2.0 |
| **TTS Expressive** | Orpheus 3B via `llama.cpp` | Metal GPU, emotion tags `<laugh>`, Apache 2.0 |
| **TTS Cloning** | Chatterbox via PyTorch MPS | Voice cloning from 5s sample, MIT |
| **TTS Cloud 1** | Gemini 3.1 Flash TTS | ☁️ Flagship TTS, director's notes, 30 voices |
| **TTS Cloud 2** | Gemini 2.5 Flash TTS | ☁️ Fast + cost-efficient for real-time |
| **TTS Cloud 3** | Gemini 2.5 Pro TTS | ☁️ Highest fidelity, long-form narration |
| **TTS Cloud 4** | Gemini 2.5 Flash-Lite TTS | ☁️ Ultra-fast, cheapest option |
| **TTS Multilingual** | Qwen3-TTS via MLX | 10 languages, voice design, Apache 2.0 |
| **TTS Fallback** | Piper | Instant offline, MIT |
| **Audio Proc** | pydub + ffmpeg + soundfile | Format conversion, normalization |
| **Database** | SQLite (via aiosqlite) | Projects, history, preferences |
| **Package Mgr** | pnpm (JS) + uv (Python) | Fast, disk-efficient |
| **Testing** | Vitest + Pytest + Playwright | Full-stack coverage |
| **CI/CD** | GitHub Actions | Automated lint, test, build |

---

## 📐 Design System — "Kobean Design Language"

### Color Palette

| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `--bg-primary` | `#0A0A0F` | `#FAFAFA` | App background |
| `--bg-surface` | `#14141F` | `#FFFFFF` | Cards, panels |
| `--bg-elevated` | `#1E1E2E` | `#F5F5F5` | Modals, popovers |
| `--border` | `#2A2A3C` | `#E5E5E5` | Borders, dividers |
| `--text-primary` | `#F0F0F0` | `#0A0A0F` | Primary text |
| `--text-secondary` | `#8888A0` | `#6B6B80` | Secondary text |
| `--accent` | `#8B5CF6` | `#7C3AED` | Buttons, links, active |
| `--accent-glow` | `rgba(139,92,246,0.15)` | `rgba(124,58,237,0.1)` | Glow effects |
| `--success` | `#22C55E` | `#16A34A` | Success states |
| `--warning` | `#F59E0B` | `#D97706` | Warnings |
| `--error` | `#EF4444` | `#DC2626` | Errors |
| `--waveform-start` | `#8B5CF6` | `#7C3AED` | Waveform gradient left |
| `--waveform-end` | `#06B6D4` | `#0891B2` | Waveform gradient right |

### Typography

| Token | Font | Size / Line | Weight | Tracking |
|-------|------|------------|--------|----------|
| Display | Inter Variable | 48px / 56px | 700 | -0.02em |
| H1 | Inter Variable | 32px / 40px | 600 | -0.015em |
| H2 | Inter Variable | 24px / 32px | 600 | -0.01em |
| H3 | Inter Variable | 20px / 28px | 600 | -0.005em |
| Body | Inter Variable | 16px / 24px | 400 | 0em |
| Body Small | Inter Variable | 14px / 20px | 400 | 0.005em |
| Caption | Inter Variable | 13px / 18px | 400 | 0.01em |
| Mono | JetBrains Mono | 14px / 20px | 400 | 0em |

### Spacing, Radius, Motion

```
Spacing (4px base): 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 · 64
Radius: sm=6px · md=12px · lg=16px · xl=24px · full=9999px
Shadows:
  subtle  → 0 1px 3px rgba(0,0,0,0.3)
  medium  → 0 4px 16px rgba(0,0,0,0.4)
  glow    → 0 0 24px rgba(139,92,246,0.15)
Motion:
  fast    → 150ms  ease-out
  normal  → 250ms  cubic-bezier(0.4, 0, 0.2, 1)
  slow    → 400ms  cubic-bezier(0.4, 0, 0.2, 1)
  spring  → 500ms  cubic-bezier(0.34, 1.56, 0.64, 1)
```

---

## 🖥️ UI Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ ┌─ Title Bar (Frameless/Tauri) ──────────────────────────────────┐ │
│ │ 🎧 KobeanAudio                            ● ● ●  [—] [□] [✕] │ │
│ └────────────────────────────────────────────────────────────────┘ │
│                                                                    │
│ ┌─ Sidebar (260px) ──┐ ┌─ Main Content ────────────────────────┐  │
│ │                     │ │                                       │  │
│ │ 🔍 Search...        │ │ ┌─ Engine Selector Bar ─────────────┐│  │
│ │                     │ │ │ ⚡Kokoro │ 🎭Orpheus │ 🎤Clone │   ││  │
│ │ ─── PROJECTS ───    │ │ │ ☁️Cloud  │ 🔇Draft   │            ││  │
│ │ 📁 My Audiobook     │ │ └─────────────────────────────────── ┘│  │
│ │ 📁 Podcast Ep.12    │ │                                       │  │
│ │ 📁 Course Module 3  │ │ ┌─ Text Editor ─────────────────────┐│  │
│ │ + New Project       │ │ │                                    ││  │
│ │                     │ │ │  [Director's Note]                 ││  │
│ │ ─── VOICES ─────    │ │ │  Pace: Natural. Accent: British.  ││  │
│ │ ⭐ Favorites        │ │ │                                    ││  │
│ │  ├ 🎭 Tara (Orph.)  │ │ │  [Scene]                          ││  │
│ │  ├ ⚡ Heart (Koko.)  │ │ │  A cozy café on a rainy morning.  ││  │
│ │  └ 🎤 My Voice      │ │ │                                    ││  │
│ │                     │ │ │  [Transcript]                      ││  │
│ │ 📚 All Voices       │ │ │  Speaking 1: [warm] Good morning,  ││  │
│ │  ├ Kokoro (50+)     │ │ │  everyone. [pause: 1s] Today we    ││  │
│ │  ├ Orpheus (8)      │ │ │  talk about something special.     ││  │
│ │  └ Cloned (3)       │ │ │  <laugh> I'm so excited! ....      ││  │
│ │                     │ │ │                                    ││  │
│ │ ─── ENGINE INFO ──  │ │ │  📊 342 words · ⏱️ ~2:15 est.     ││  │
│ │ ⚡ Kokoro Active     │ │ └────────────────────────────────────┘│  │
│ │ RAM: 0.5GB / 18GB   │ │                                       │  │
│ │ Speed: 14x RT       │ │ ┌─ Generation Controls ─────────────┐│  │
│ │                     │ │ │                                    ││  │
│ │ ⚙️ Settings         │ │ │ Voice: [Tara ▾]  Temp: [━━●━ 1.15]││  │
│ │ 📊 Usage            │ │ │                                    ││  │
│ │                     │ │ │      [ ✨ Generate Audio ]          ││  │
│ │                     │ │ │                                    ││  │
│ │                     │ │ │ Format: [WAV▾] Quality: [High▾]   ││  │
│ │                     │ │ └────────────────────────────────────┘│  │
│ │                     │ │                                       │  │
│ │                     │ │ ┌─ Audio Player ─────────────────────┐│  │
│ │                     │ │ │ ▁▂▃▅▇█▇▅▃▁▂▃▅▇█▇▅▃▁▂▃▅▇█▇▅▃▁▂▃▅ ││  │
│ │                     │ │ │                                    ││  │
│ │                     │ │ │ ⏮  ▶️  ⏭  │ 🔊━━●━━│ 1:23 / 2:15 ││  │
│ │                     │ │ │                                    ││  │
│ │                     │ │ │ [0.5x] [1x] [1.5x] [2x] │ [📥 Export]│
│ │                     │ │ └────────────────────────────────────┘│  │
│ │                     │ │                                       │  │
│ │                     │ │ ┌─ Generation History ───────────────┐│  │
│ │                     │ │ │ ✅ v3 Tara·Orpheus 2:15 ⭐⭐⭐⭐⭐  ▶️││  │
│ │                     │ │ │ ✅ v2 Heart·Kokoro 2:12 ⭐⭐⭐⭐   ▶️││  │
│ │                     │ │ │ ✅ v1 Heart·Kokoro 2:14 ⭐⭐⭐    ▶️││  │
│ │                     │ │ └────────────────────────────────────┘│  │
│ └─────────────────────┘ └──────────────────────────────────────┘  │
│ ┌─ Status Bar ──────────────────────────────────────────────────┐ │
│ │ ● Kokoro Ready │ RAM: 4.2/18 GB │ Queue: 0 │ v1.0.0         │ │
│ └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
KobeanAudio/
├── README.md
├── LICENSE                         # MIT
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Lint + Test + Build
│       └── release.yml             # Desktop packaging
├── .env.example                    # GEMINI_API_KEY=your_key_here
│
├── apps/
│   ├── web/                        # Next.js 15 frontend
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── public/
│   │   │   └── fonts/              # Inter Variable, JetBrains Mono
│   │   └── src/
│   │       ├── app/
│   │       │   ├── layout.tsx      # Root layout + providers
│   │       │   ├── page.tsx        # Main studio page
│   │       │   └── globals.css     # Tailwind + CSS variables
│   │       ├── components/
│   │       │   ├── ui/             # Radix-based primitives
│   │       │   │   ├── button.tsx
│   │       │   │   ├── slider.tsx
│   │       │   │   ├── select.tsx
│   │       │   │   ├── dialog.tsx
│   │       │   │   ├── toast.tsx
│   │       │   │   └── tooltip.tsx
│   │       │   ├── sidebar/
│   │       │   │   ├── Sidebar.tsx
│   │       │   │   ├── ProjectList.tsx
│   │       │   │   ├── VoiceLibrary.tsx
│   │       │   │   └── EngineStatus.tsx
│   │       │   ├── editor/
│   │       │   │   ├── TextEditor.tsx          # TipTap rich editor
│   │       │   │   ├── DirectorNoteBlock.tsx   # Custom TipTap node
│   │       │   │   ├── EmotionTagPlugin.tsx    # Autocomplete [warm], <laugh>
│   │       │   │   ├── PauseMarkerPlugin.tsx   # [pause: 1.5s] markers
│   │       │   │   ├── WordCounter.tsx
│   │       │   │   └── TemplateSelector.tsx    # Pre-built templates
│   │       │   ├── engine/
│   │       │   │   ├── EngineSelector.tsx       # Tab bar: Kokoro|Orpheus|...
│   │       │   │   ├── EngineConfig.tsx         # Per-engine settings
│   │       │   │   ├── VoicePicker.tsx          # Voice selection dropdown
│   │       │   │   └── TemperatureSlider.tsx
│   │       │   ├── player/
│   │       │   │   ├── AudioPlayer.tsx          # Main player component
│   │       │   │   ├── Waveform.tsx             # WaveSurfer.js wrapper
│   │       │   │   ├── TransportControls.tsx    # Play/Pause/Seek/Speed
│   │       │   │   ├── VolumeControl.tsx
│   │       │   │   └── Spectrogram.tsx          # Optional toggle
│   │       │   ├── generation/
│   │       │   │   ├── GenerateButton.tsx       # Multi-state CTA
│   │       │   │   ├── ProgressTracker.tsx      # Streaming progress
│   │       │   │   └── GenerationHistory.tsx    # Past generations
│   │       │   ├── export/
│   │       │   │   ├── ExportDialog.tsx
│   │       │   │   └── FormatSelector.tsx
│   │       │   └── voice-clone/
│   │       │       ├── VoiceCloneDialog.tsx     # Upload reference audio
│   │       │       └── AudioRecorder.tsx        # Record in-browser
│   │       ├── hooks/
│   │       │   ├── useAudioPlayer.ts
│   │       │   ├── useGeneration.ts             # SSE streaming hook
│   │       │   ├── useProject.ts
│   │       │   ├── useEngine.ts
│   │       │   └── useKeyboardShortcuts.ts
│   │       ├── stores/
│   │       │   ├── engineStore.ts               # Selected engine + config
│   │       │   ├── projectStore.ts              # Current project state
│   │       │   ├── playerStore.ts               # Playback state
│   │       │   └── uiStore.ts                   # Sidebar, theme, layout
│   │       ├── lib/
│   │       │   ├── api.ts                       # Backend API client
│   │       │   ├── audio.ts                     # Web Audio utilities
│   │       │   ├── constants.ts                 # Engine configs, voices
│   │       │   └── utils.ts
│   │       └── types/
│   │           ├── engine.ts                    # EngineType, TTSRequest
│   │           ├── project.ts                   # Project, Generation
│   │           └── audio.ts                     # AudioChunk, ExportConfig
│   │
│   ├── desktop/                    # Tauri 2.x shell
│   │   ├── src-tauri/
│   │   │   ├── Cargo.toml
│   │   │   ├── tauri.conf.json
│   │   │   ├── src/
│   │   │   │   ├── main.rs         # Tauri entry
│   │   │   │   ├── commands.rs     # Native file dialogs, system tray
│   │   │   │   └── menu.rs         # App menu (File, Edit, Audio, Help)
│   │   │   └── icons/              # App icons all sizes
│   │   └── package.json
│   │
│   └── api/                        # FastAPI backend
│       ├── pyproject.toml          # uv-managed dependencies
│       ├── main.py                 # FastAPI app entry + CORS + lifespan
│       ├── config.py               # Pydantic settings (env vars)
│       ├── domain/
│       │   ├── models.py           # TTSRequest, TTSJob, AudioChunk, Voice
│       │   └── services/
│       │       ├── tts_service.py          # Engine router + orchestration
│       │       ├── audio_processor.py      # WAV→MP3/FLAC, normalization
│       │       └── project_service.py      # Project CRUD
│       ├── engines/
│       │   ├── base.py             # Abstract TTSEngine interface
│       │   ├── kokoro_engine.py    # MLX/CPU Kokoro integration
│       │   ├── orpheus_engine.py   # llama.cpp + SNAC decoder
│       │   ├── chatterbox_engine.py# PyTorch MPS voice cloning
│       │   ├── gemini_engine.py    # Google GenAI SDK (your existing code)
│       │   └── piper_engine.py     # Piper subprocess
│       ├── api/
│       │   ├── routes/
│       │   │   ├── generate.py     # POST /api/v1/generate (SSE streaming)
│       │   │   ├── engines.py      # GET /api/v1/engines, /api/v1/voices
│       │   │   ├── projects.py     # CRUD /api/v1/projects
│       │   │   ├── export.py       # POST /api/v1/export
│       │   │   └── clone.py        # POST /api/v1/clone-voice
│       │   └── middleware/
│       │       ├── error_handler.py
│       │       └── rate_limit.py
│       ├── db/
│       │   ├── database.py         # aiosqlite connection
│       │   ├── models.py           # SQLAlchemy/raw SQL schemas
│       │   └── migrations/         # Schema versioning
│       └── tests/
│           ├── unit/
│           │   ├── test_kokoro_engine.py
│           │   ├── test_orpheus_engine.py
│           │   ├── test_audio_processor.py
│           │   └── test_wav_conversion.py
│           ├── integration/
│           │   └── test_api_routes.py
│           └── fixtures/
│               └── sample_audio.wav
│
├── packages/
│   └── types/                      # Shared TypeScript types
│       ├── package.json
│       └── src/
│           └── index.ts
│
├── models/                         # Downloaded model files (gitignored)
│   ├── kokoro/                     # ~330MB
│   ├── orpheus/                    # ~3.5GB (GGUF Q4_K_M)
│   ├── chatterbox/                 # ~1.5GB
│   └── piper/                      # ~50MB per voice
│
├── scripts/
│   ├── setup.sh                    # One-command setup script
│   ├── download-models.sh          # Download all model files
│   └── dev.sh                      # Start all dev servers
│
├── pnpm-workspace.yaml
├── turbo.json                      # Turborepo config
└── .gitignore
```

---

## 🎬 PHASED IMPLEMENTATION

---

### PHASE 0 — Foundation & Tooling
**⏱️ Duration**: 2 days · **Goal**: Bootable project, all tooling configured

---

#### Task 0.1 — Project Scaffolding
**Time**: 3 hours

- [ ] Initialize git repo at `/Users/josephnguyen/Desktop/KobeanAudio`
- [ ] Create `pnpm-workspace.yaml` with `apps/*` and `packages/*`
- [ ] Scaffold Next.js 15: `pnpm create next-app apps/web --typescript --tailwind --app --src-dir`
- [ ] Scaffold Tauri 2.x: `pnpm create tauri-app apps/desktop`
- [ ] Scaffold FastAPI: create `apps/api/` with `pyproject.toml` (managed by `uv`)
- [ ] Create `packages/types/` for shared TypeScript types
- [ ] Configure `turbo.json` for monorepo task orchestration
- [ ] Create `.env.example`:
  ```env
  GEMINI_API_KEY=your_gemini_api_key_here
  KOKORO_MODEL_PATH=./models/kokoro
  ORPHEUS_MODEL_PATH=./models/orpheus/orpheus-3b-0.1-ft.Q4_K_M.gguf
  ORPHEUS_SERVER_URL=http://localhost:8081
  CHATTERBOX_DEVICE=mps
  API_PORT=8000
  ```

**✅ Acceptance**: `pnpm dev` starts Next.js on :3000 and FastAPI on :8000

---

#### Task 0.2 — Python Environment (uv)
**Time**: 1 hour

- [ ] Install `uv` if not present
- [ ] Create `apps/api/pyproject.toml`:
  ```toml
  [project]
  name = "kobeanaudio-api"
  version = "0.1.0"
  requires-python = ">=3.12"
  dependencies = [
      "fastapi>=0.115",
      "uvicorn[standard]>=0.32",
      "pydantic>=2.10",
      "pydantic-settings>=2.6",
      "aiosqlite>=0.20",
      "python-multipart>=0.0.12",
      "pydub>=0.25",
      "soundfile>=0.12",
      "google-genai>=1.0",
      "mlx-audio>=0.2",
      "streaming-tts>=0.5",
      "piper-tts>=1.2",
      "httpx>=0.27",
  ]
  
  [project.optional-dependencies]
  chatterbox = ["chatterbox-tts", "torch", "torchaudio"]
  dev = ["pytest>=8.0", "pytest-asyncio>=0.24", "ruff>=0.8"]
  ```
- [ ] Run `uv sync` to create virtual environment
- [ ] Verify: `uv run python -c "import fastapi; print('OK')"`

**✅ Acceptance**: `uv run uvicorn main:app --reload` starts API server

---

#### Task 0.3 — Design System Setup
**Time**: 2 hours

- [ ] Install fonts: Inter Variable, JetBrains Mono
- [ ] Configure `tailwind.config.ts` with all design tokens (colors, spacing, typography)
- [ ] Create `globals.css` with CSS custom properties for theming
- [ ] Install Radix UI primitives: `@radix-ui/react-dialog`, `react-select`, `react-slider`, `react-tooltip`, `react-toast`
- [ ] Install Framer Motion 12
- [ ] Create base UI components: `Button`, `Slider`, `Select`, `Dialog`, `Toast`, `Tooltip`

**✅ Acceptance**: Storybook-like page at `/dev` showing all base components in dark mode

---

#### Task 0.4 — Development Scripts
**Time**: 1 hour

- [ ] Create `scripts/setup.sh`:
  ```bash
  #!/bin/bash
  # One-command setup for KobeanAudio
  pnpm install
  cd apps/api && uv sync && cd ../..
  brew install espeak-ng ffmpeg llama.cpp
  bash scripts/download-models.sh
  echo "✅ KobeanAudio ready! Run: pnpm dev"
  ```
- [ ] Create `scripts/download-models.sh` (downloads Kokoro + Orpheus GGUF + Piper)
- [ ] Create `scripts/dev.sh` that starts frontend + backend + llama-server concurrently
- [ ] Add to `package.json`: `"dev": "bash scripts/dev.sh"`

**✅ Acceptance**: `bash scripts/setup.sh && pnpm dev` goes from zero to running app

---

#### Task 0.5 — CI Pipeline
**Time**: 2 hours

- [ ] Create `.github/workflows/ci.yml`:
  - Lint: ESLint + Prettier (JS) + Ruff (Python)
  - Type check: `tsc --noEmit` + `pyright`
  - Test: Vitest (frontend) + Pytest (backend)
  - Build: `next build`
- [ ] Configure `ruff.toml` for Python linting
- [ ] Configure `eslint.config.mjs` with strict TypeScript rules
- [ ] Add pre-commit hooks via `husky` + `lint-staged`

**✅ Acceptance**: GitHub Actions pipeline runs green on push

---

### PHASE 1 — Core TTS Engine Layer
**⏱️ Duration**: 4 days · **Goal**: All 5 engines working behind a unified interface

---

#### Task 1.1 — Abstract Engine Interface
**Time**: 2 hours

Create `apps/api/engines/base.py`:

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import AsyncIterator

class EngineType(Enum):
    KOKORO = "kokoro"
    ORPHEUS = "orpheus"
    CHATTERBOX = "chatterbox"
    GEMINI = "gemini"
    PIPER = "piper"

@dataclass
class Voice:
    id: str
    name: str
    engine: EngineType
    language: str = "en"
    gender: str | None = None
    description: str = ""
    preview_url: str | None = None

@dataclass
class TTSRequest:
    text: str
    engine: EngineType = EngineType.KOKORO
    voice_id: str = "af_heart"
    temperature: float = 1.0
    speed: float = 1.0
    emotion_exaggeration: float = 0.5       # Chatterbox only
    reference_audio_path: str | None = None  # Voice cloning
    output_format: str = "wav"               # wav, mp3, flac
    sample_rate: int = 24000

@dataclass
class AudioChunk:
    data: bytes
    index: int
    is_final: bool = False
    sample_rate: int = 24000
    mime_type: str = "audio/wav"

class TTSEngine(ABC):
    engine_type: EngineType

    @abstractmethod
    async def initialize(self) -> None:
        """Load model into memory."""
        ...

    @abstractmethod
    async def generate_stream(self, request: TTSRequest) -> AsyncIterator[AudioChunk]:
        """Yield audio chunks as they're generated."""
        ...

    @abstractmethod
    async def generate(self, request: TTSRequest) -> bytes:
        """Return complete audio as bytes."""
        ...

    @abstractmethod
    def get_voices(self) -> list[Voice]:
        """List available voices for this engine."""
        ...

    @abstractmethod
    async def shutdown(self) -> None:
        """Release model resources."""
        ...
```

**✅ Acceptance**: Interface compiles, all methods documented with docstrings

---

#### Task 1.2 — Kokoro Engine (Default)
**Time**: 4 hours

Implement `apps/api/engines/kokoro_engine.py`:
- [ ] Initialize Kokoro via `mlx-audio` (M3 Metal acceleration)
- [ ] Fallback to `streaming-tts` CPU mode if MLX unavailable
- [ ] Implement `generate_stream()` — yield WAV chunks
- [ ] Implement `generate()` — return complete WAV bytes
- [ ] Implement `get_voices()` — enumerate all 50+ Kokoro voices with metadata
- [ ] Voice blending support (mix two voices: `af_sarah,am_adam`)
- [ ] Handle `espeak-ng` dependency check on startup
- [ ] Unit tests with mocked model

**✅ Acceptance**: `POST /api/v1/generate {"engine":"kokoro","text":"Hello"}` returns audio

---

#### Task 1.3 — Orpheus Engine (Expressive)
**Time**: 6 hours

Implement `apps/api/engines/orpheus_engine.py`:
- [ ] Connect to local `llama-server` (started separately or as subprocess)
- [ ] Send text with emotion tags (`<laugh>`, `<sigh>`, `<gasp>`) to llama-server
- [ ] Capture streaming token output
- [ ] Decode audio tokens via SNAC decoder into PCM audio
- [ ] Convert PCM to WAV with proper headers (port `convert_to_wav` from `ai_studio_code.py`)
- [ ] Implement streaming: yield chunks as SNAC decoder produces them
- [ ] Voice selection: `tara`, `leah`, `jess`, `leo`, `dan`, `mia`, `zac`, `zoe`
- [ ] Health check: verify llama-server is running before accepting requests
- [ ] Unit tests with mocked llama-server responses

**✅ Acceptance**: Text with `<laugh>` generates audio with audible laughter

---

#### Task 1.4 — Gemini Engine (Cloud · 4 Models · Google AI Pro Plan)
**Time**: 5 hours

Implement `apps/api/engines/gemini_engine.py`:
- [ ] Port `ai_studio_code.py` into the engine interface
- [ ] Support **4 Gemini TTS model variants** selectable by user:
  ```python
  GEMINI_MODELS = {
      "gemini-3.1-flash-tts": "gemini-3.1-flash-tts-preview",    # Flagship
      "gemini-2.5-flash-tts": "gemini-2.5-flash-tts",            # Fast
      "gemini-2.5-pro-tts":   "gemini-2.5-pro-tts",              # HD
      "gemini-2.5-flash-lite-tts": "gemini-2.5-flash-lite-preview-tts",  # Ultra-fast
  }
  ```
- [ ] All **30 prebuilt voices**: Achernar, Achird, Algenib, Algieba, Alnilam,
  Aoede, Autonoe, Callirrhoe, Charon, Despina, Enceladus, Erinome, Fenrir,
  Gacrux, Iapetus, Kore, Laomedeia, Leda, Orus, Puck, Pulcherrima,
  Rasalgethi, Sadachbia, Sadaltager, Schedar, Sulafat, Umbriel,
  Vindemiatrix, Zephyr, Zubenelgenubi
- [ ] Preserve `generate_content_stream()` for SSE streaming
- [ ] Preserve `convert_to_wav()` with RIFF header generation
- [ ] Preserve `parse_audio_mime_type()` for PCM L16 parsing
- [ ] Handle `chunk.parts is None` gracefully
- [ ] Director's note format support: `[warm]`, `[pause: 1.5s]`, `[reading]`
- [ ] **200+ audio tags** support: `[whispers]`, `[laughs]`, `[excited]`, etc.
- [ ] Temperature control (default 1.15, range 0.0–2.0)
- [ ] API key validation on startup (from `GEMINI_API_KEY` env var)
- [ ] Graceful fallback when API key is missing (disable engine, don't crash)
- [ ] Rate limit handling (429 retry with exponential backoff)
- [ ] Pro Plan: higher RPM limits, show "Pro" badge in UI
- [ ] Model comparison mode: generate same text with different Gemini models

**✅ Acceptance**: All 4 Gemini models accessible, 30 voices selectable, streaming works

---

#### Task 1.5 — Chatterbox Engine (Voice Cloning)
**Time**: 5 hours

Implement `apps/api/engines/chatterbox_engine.py`:
- [ ] Initialize Chatterbox with MPS device detection:
  ```python
  device = "mps" if torch.backends.mps.is_available() else "cpu"
  ```
- [ ] Handle CUDA-to-MPS weight remapping (monkey-patch `torch.load`)
- [ ] Implement voice cloning: accept reference audio file (5-15s WAV/MP3)
- [ ] Emotion exaggeration slider (0.0 to 1.0)
- [ ] Store cloned voice profiles for reuse
- [ ] Lazy-load model (only load into RAM when engine is first selected)
- [ ] Unit tests with small fixture audio

**✅ Acceptance**: Upload 10s voice clip OR record via mic → generate text in that voice

---

#### Task 1.5b — Qwen3-TTS Engine (Multilingual)
**Time**: 4 hours

Implement `apps/api/engines/qwen3_engine.py`:
- [ ] Initialize via `mlx-audio` or `qwen3-tts-apple-silicon` repo (M3-native)
- [ ] Support both model sizes: 0.6B (fast) and 1.7B (quality)
- [ ] **10 languages**: Chinese, English, Japanese, Korean, German, French, Russian, Portuguese, Spanish, Italian
- [ ] **Voice cloning**: from 3 seconds of reference audio
- [ ] **Voice design**: natural language descriptions ("a warm, low-pitched female voice")
- [ ] **Emotion control**: via natural language instructions ("speak excitedly", "whisper softly")
- [ ] Ultra-low latency streaming (97ms TTFA on optimal hardware)
- [ ] Quantized model support (4-bit/8-bit for lower RAM usage)
- [ ] Lazy-load (only load when user selects this engine)
- [ ] Unit tests with mocked model

**✅ Acceptance**: Generate audio in 10 languages, voice design via natural language works

---

#### Task 1.6 — Piper Engine (Fallback)
**Time**: 2 hours

Implement `apps/api/engines/piper_engine.py`:
- [ ] Run Piper as subprocess: `echo "text" | piper --model X --output_file -`
- [ ] Parse stdout for WAV data
- [ ] Multiple quality levels: `low`, `medium`, `high`
- [ ] Language/voice selection from installed Piper models
- [ ] Auto-download voices on first use

**✅ Acceptance**: Instant audio generation (<100ms for short text)

---

#### Task 1.7 — Engine Router & TTS Service
**Time**: 4 hours

Create `apps/api/domain/services/tts_service.py`:
- [ ] Engine registry: manage all 7 engines (Kokoro, Orpheus, Chatterbox, Gemini×4, Qwen3, Piper)
- [ ] Lazy loading: only load engine into RAM when first requested
- [ ] Gemini sub-model routing: handle model variant selection within Gemini engine
- [ ] Route `TTSRequest` to correct engine based on `engine` field
- [ ] Health checks: `/api/v1/engines` returns status of each engine (loaded/available/offline)
- [ ] Concurrent generation queue (asyncio-based)
- [ ] Cancellation support: abort in-flight generation
- [ ] Engine warmup: pre-load Kokoro on startup (it's tiny), lazy-load everything else

**✅ Acceptance**: Frontend can switch between all 7 engines and get audio from each

---

#### Task 1.8 — Audio Processing Pipeline
**Time**: 4 hours

Create `apps/api/domain/services/audio_processor.py`:
- [ ] WAV → MP3 conversion (128/192/256/320 kbps via pydub + ffmpeg)
- [ ] WAV → FLAC conversion (lossless)
- [ ] WAV → OGG/Opus conversion (web-optimized)
- [ ] WAV → AAC/M4A conversion (Apple ecosystem)
- [ ] Loudness normalization to -16 LUFS (podcast) or -14 LUFS (streaming)
- [ ] Silence trimming (leading/trailing, configurable threshold)
- [ ] Fade in/out (configurable 0-2000ms)
- [ ] Audio concatenation with crossfade for multi-chunk outputs
- [ ] ID3 tag embedding for MP3 exports
- [ ] Unit tests verifying output format validity

**✅ Acceptance**: Generate WAV → export as MP3/FLAC/OGG with correct metadata

---

### PHASE 2 — API Layer & Streaming
**⏱️ Duration**: 2 days · **Goal**: Complete REST API with SSE streaming

---

#### Task 2.1 — Generation Endpoint (SSE Streaming)
**Time**: 4 hours

Create `apps/api/api/routes/generate.py`:
- [ ] `POST /api/v1/generate` — accepts `TTSRequest`, returns SSE stream
- [ ] SSE event format:
  ```
  event: chunk
  data: {"index": 0, "total_estimated": 5, "audio_base64": "..."}

  event: progress
  data: {"percent": 40, "message": "Generating chunk 2/5..."}

  event: complete
  data: {"duration_ms": 135000, "file_size": 4320000, "format": "wav"}

  event: error
  data: {"code": "ENGINE_UNAVAILABLE", "message": "Orpheus server not running"}
  ```
- [ ] Cancellation: client closes connection → generation aborts
- [ ] Request validation with Pydantic models

---

#### Task 2.2 — Engine & Voice Endpoints
**Time**: 2 hours

- [ ] `GET /api/v1/engines` — list engines with status, RAM usage, speed
- [ ] `GET /api/v1/engines/{engine}/voices` — list voices for engine
- [ ] `POST /api/v1/engines/{engine}/preview` — generate 5s voice preview
- [ ] `GET /api/v1/engines/{engine}/status` — health check

---

#### Task 2.3 — Project Endpoints
**Time**: 3 hours

- [ ] `POST /api/v1/projects` — create project
- [ ] `GET /api/v1/projects` — list projects
- [ ] `GET /api/v1/projects/{id}` — get project with generations
- [ ] `PUT /api/v1/projects/{id}` — update project (auto-save)
- [ ] `DELETE /api/v1/projects/{id}` — delete project + audio files
- [ ] `GET /api/v1/projects/{id}/generations` — list generation history

---

#### Task 2.4 — Export & Clone Endpoints
**Time**: 2 hours

- [ ] `POST /api/v1/export` — convert audio to requested format
- [ ] `POST /api/v1/clone-voice` — upload reference audio for Chatterbox cloning
- [ ] `GET /api/v1/clone-voice/{id}` — retrieve cloned voice profile

---

#### Task 2.5 — Database Setup
**Time**: 2 hours

- [ ] SQLite schema via aiosqlite:
  ```sql
  CREATE TABLE projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      text_content TEXT DEFAULT '',
      engine TEXT DEFAULT 'kokoro',
      voice_id TEXT DEFAULT 'af_heart',
      settings JSON DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE generations (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      text_input TEXT NOT NULL,
      engine TEXT NOT NULL,
      voice_id TEXT NOT NULL,
      settings JSON DEFAULT '{}',
      audio_path TEXT,
      duration_ms INTEGER,
      file_size INTEGER,
      rating INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE cloned_voices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      reference_audio_path TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```

**✅ Acceptance**: Full CRUD working, data persists across restarts

---

### PHASE 3 — Frontend UI
**⏱️ Duration**: 5 days · **Goal**: Beautiful, functional UI

---

#### Task 3.1 — App Shell & Layout
**Time**: 4 hours

- [ ] Frameless window with Tauri title bar
- [ ] Collapsible sidebar (260px ↔ 60px icon-only) with Framer Motion
- [ ] Main content area with responsive padding
- [ ] Dark mode (default) + Light mode with `prefers-color-scheme` detection
- [ ] Theme toggle in sidebar footer
- [ ] Status bar at bottom (engine status, RAM, queue)
- [ ] Cmd+K command palette (search projects, voices, switch engines)

---

#### Task 3.2 — Engine Selector Bar
**Time**: 4 hours

- [ ] Horizontal tab bar above editor: `⚡ Kokoro` | `🎭 Orpheus` | `🎤 Clone` | `☁️ Gemini` | `🌐 Qwen3` | `🔇 Draft`
- [ ] Each tab shows engine name + status dot (🟢 ready / 🟡 loading / 🔴 offline)
- [ ] **Gemini tab** expands a sub-selector for model variant:
  ```
  ☁️ Gemini ▾
  ├─ 3.1 Flash TTS  (Flagship — director's notes, 200+ tags)
  ├─ 2.5 Flash TTS  (Fast — real-time, cost-efficient)
  ├─ 2.5 Pro TTS    (HD — highest fidelity, long-form)
  └─ 2.5 Flash-Lite (Draft — ultra-fast, cheapest)
  ```
- [ ] Show all **30 Gemini voices** when Gemini engine is selected:
  - Achernar, Achird, Algenib, Algieba, Alnilam, Aoede, Autonoe,
    Callirrhoe, Charon, Despina, Enceladus, Erinome, Fenrir, Gacrux,
    Iapetus, Kore, Laomedeia, Leda, Orus, Puck, Pulcherrima,
    Rasalgethi, Sadachbia, Sadaltager, Schedar, Sulafat, Umbriel,
    Vindemiatrix, Zephyr, Zubenelgenubi
- [ ] Switching engine updates available voices in VoicePicker
- [ ] Tooltip on hover: engine description + RAM usage + speed estimate
- [ ] Animate active tab indicator with Framer Motion `layoutId`
- [ ] Show "Requires GPU" or "Requires API Key" badges where applicable
- [ ] "Pro Plan" badge on Gemini tab (gold accent)

---

#### Task 3.3 — Text Editor
**Time**: 8 hours (biggest task)

- [ ] TipTap editor with custom extensions:
  - **Director Note Block** — visually distinct header section (darker bg, labeled)
  - **Scene Block** — collapsible, italic, descriptive
  - **Transcript Block** — main text area
  - **Emotion Tag Autocomplete** — type `[` or `<` to get suggestions:
    - Kokoro: plain text (no special tags)
    - Orpheus: `<laugh>`, `<sigh>`, `<gasp>`, `<yawn>`, `<cough>`
    - Gemini: `[warm]`, `[excited]`, `[pause: 1.5s]`, `[reading]`
  - **Speaker Labels** — `Speaking 1:`, `Speaking 2:` with color coding
- [ ] Syntax highlighting for tags (purple for emotions, blue for pauses)
- [ ] Word count + estimated audio duration (bottom of editor)
  - Formula: `words / 150 * 60 + sum(pause_durations)` seconds
- [ ] Template selector button — pre-built templates:
  - 📖 Audiobook Narration
  - 🎙️ Podcast Intro
  - 📚 Educational Content
  - 📰 News Broadcast
  - 🎭 Dramatic Reading
  - 👶 Children's Story
  - Custom / Blank
- [ ] Undo/Redo (Cmd+Z / Cmd+Shift+Z)
- [ ] Find & Replace (Cmd+F)
- [ ] Auto-save every 30 seconds

---

#### Task 3.4 — Voice Picker & Settings
**Time**: 4 hours

- [ ] Voice dropdown grouped by engine
- [ ] Voice cards showing: name, engine badge, language, gender icon
- [ ] One-click preview button (play 5s sample)
- [ ] Recently Used section (top 5)
- [ ] Favorites (star toggle, persisted)
- [ ] For Chatterbox: "Clone New Voice" button → opens upload dialog
- [ ] Temperature slider with labels: "Predictable" ← → "Creative"
- [ ] Speed slider: 0.5x – 2.0x
- [ ] Advanced panel (collapsible):
  - Output format: WAV / MP3 / FLAC / OGG
  - Sample rate: 24kHz / 44.1kHz / 48kHz
  - Loudness target: -16 LUFS / -14 LUFS / Off
  - Silence trimming: On/Off
  - Fade in/out: 0ms / 250ms / 500ms / 1000ms

---

#### Task 3.5 — Generate Button & Progress
**Time**: 3 hours

- [ ] Multi-state button with Framer Motion transitions:
  ```
  IDLE       → ✨ Generate Audio     (purple gradient)
  LOADING    → ● Initializing...     (pulse animation)
  STREAMING  → ■■■□□ Generating 3/5  (progress bar inside button)
  SUCCESS    → ✅ Audio Ready ▶      (green, click to play)
  ERROR      → ❌ Failed — Retry     (red, click to retry)
  ```
- [ ] SSE connection for real-time progress
- [ ] Cancel button appears during generation
- [ ] Estimated time remaining display
- [ ] Keyboard shortcut: `Cmd+Enter` to generate

---

#### Task 3.6 — Audio Player & Waveform
**Time**: 6 hours

- [ ] WaveSurfer.js 7 integration:
  - Gradient waveform (purple → cyan)
  - Cursor follower with timestamp tooltip
  - Click-to-seek
  - Zoom in/out (Cmd+Scroll)
  - Minimap for long audio
  - Real-time waveform rendering during streaming generation
- [ ] Transport controls:
  - Play/Pause (Space)
  - Skip backward/forward 5s (←/→) and 15s (Shift+←/→)
  - Stop (Escape)
  - Playback speed: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
- [ ] Volume slider with mute toggle
- [ ] Time display: `1:23 / 2:15` format
- [ ] Optional spectrogram toggle (Web Audio API `AnalyserNode`)

---

#### Task 3.7 — Sidebar Components
**Time**: 4 hours

- [ ] **Project List**: Create / Open / Delete / Rename projects
- [ ] **Voice Library**: Browse all voices across all engines
- [ ] **Engine Status**: Show active engine, RAM usage, model status
- [ ] **Settings**: Theme, default engine, default voice, auto-save interval
- [ ] Smooth collapse/expand animation
- [ ] Search/filter within each section

---

#### Task 3.8 — Generation History
**Time**: 3 hours

- [ ] List of past generations within current project
- [ ] Each entry shows: version #, voice, engine, duration, timestamp, rating
- [ ] One-click play for any past generation
- [ ] Star rating (1-5) for quality tracking
- [ ] "Regenerate" button (same settings)
- [ ] "Use as starting point" (fork with modifications)
- [ ] Delete individual generations
- [ ] Compare mode: A/B toggle between two generations

---

#### Task 3.9 — Export Dialog
**Time**: 3 hours

- [ ] Modal dialog with format options:
  - WAV (uncompressed, highest quality)
  - MP3 (128 / 192 / 256 / 320 kbps)
  - FLAC (lossless compressed)
  - OGG/Opus (web-optimized)
  - AAC/M4A (Apple ecosystem)
- [ ] Export presets: "Podcast" / "Audiobook" / "YouTube" / "Social Media"
- [ ] Custom filename template: `{project}_{voice}_{date}.{ext}`
- [ ] Loudness normalization checkbox
- [ ] Preview file size estimate before export
- [ ] Export progress bar
- [ ] "Open in Finder" after export

---

#### Task 3.10 — Voice Clone Dialog (Upload + Mic Recording)
**Time**: 6 hours

- [ ] **Two input methods** — Tab selector: "📁 Upload File" | "🎙️ Record Voice"
- [ ] **Upload tab**:
  - Drag & drop zone or file picker (WAV, MP3, M4A, OGG)
  - Audio waveform preview of uploaded clip
  - Auto-trim silence from reference clip
- [ ] **Record tab** (MediaRecorder API):
  - Microphone permission request with friendly explanation
  - Real-time waveform visualization during recording
  - Recording timer: "0:00 / 0:15" (5-15 second range)
  - Auto-stop at 15 seconds
  - Playback review before confirming
  - Re-record button
  - Audio level meter (VU meter) to ensure good recording quality
  - Tips displayed: "Speak clearly in a quiet room, read this sample text: ..."
- [ ] **Shared features**:
  - Quality indicator: "⚠️ Too short" / "✅ Good length" / "⚠️ Too noisy"
  - Name your cloned voice (text input)
  - Engine selector: Chatterbox (5-15s) or Qwen3 (3s minimum)
  - Test generation with cloned voice before saving
  - Cloned voice appears in Voice Library under "🎤 My Voices"
  - Save/Delete cloned voice profiles

---

### PHASE 4 — Integration & Streaming
**⏱️ Duration**: 3 days · **Goal**: Frontend ↔ Backend fully connected with streaming

---

#### Task 4.1 — API Client
**Time**: 3 hours

- [ ] Type-safe API client using `fetch` + TypeScript generics
- [ ] SSE stream handler for `/api/v1/generate`
- [ ] Error handling: network errors, timeouts, API errors → Toast notifications
- [ ] Request cancellation via AbortController
- [ ] TanStack Query integration for caching voices, projects

---

#### Task 4.2 — Real-Time Streaming Pipeline
**Time**: 6 hours

- [ ] Frontend initiates SSE connection on "Generate"
- [ ] Backend streams AudioChunks as they're produced
- [ ] Frontend receives chunks → decodes → feeds to WaveSurfer
- [ ] Waveform builds up left-to-right as chunks arrive
- [ ] Audio plays back as soon as first chunk is ready (< 2s target)
- [ ] Progress bar updates from SSE events
- [ ] On completion: full audio concatenated and available for export

---

#### Task 4.3 — State Management
**Time**: 4 hours

- [ ] Zustand stores:
  - `engineStore`: selected engine, config, available voices
  - `projectStore`: current project, text content, auto-save
  - `playerStore`: playback state, current time, volume
  - `uiStore`: sidebar state, theme, command palette
- [ ] Persistence: save preferences to localStorage
- [ ] Project auto-save: debounced save every 30s

---

### PHASE 5 — Polish, A11y & Performance
**⏱️ Duration**: 3 days · **Goal**: Production-quality UX

---

#### Task 5.1 — Micro-Interactions
**Time**: 4 hours

- [ ] Button press: `scale(0.97)` → `scale(1)` spring
- [ ] Page transitions: shared layout animations
- [ ] Loading skeletons for all async content
- [ ] Toast notifications: slide from top-right, 4s auto-dismiss
- [ ] Engine tab switch: indicator slides with `layoutId`
- [ ] Generate button: morphing states with AnimatePresence
- [ ] Waveform streaming: chunks appear left-to-right with fade-in
- [ ] Voice preview hover: subtle lift + play icon overlay
- [ ] Empty states: illustrated SVGs for "No projects", "No audio"

---

#### Task 5.2 — Keyboard Shortcuts
**Time**: 2 hours

| Shortcut | Action |
|----------|--------|
| `Cmd+Enter` | Generate audio |
| `Space` | Play / Pause |
| `Escape` | Stop playback / Cancel generation |
| `←` / `→` | Seek ±5 seconds |
| `Shift+←` / `Shift+→` | Seek ±15 seconds |
| `Cmd+S` | Save project |
| `Cmd+N` | New project |
| `Cmd+E` | Export dialog |
| `Cmd+K` | Command palette |
| `Cmd+1-5` | Switch to engine 1-5 |
| `Cmd+,` | Settings |

---

#### Task 5.3 — Accessibility (WCAG 2.2 AA)
**Time**: 3 hours

- [ ] Full keyboard navigation with visible focus rings
- [ ] ARIA labels on all interactive elements
- [ ] Live regions for generation status announcements
- [ ] Color contrast ≥ 4.5:1 (text) and ≥ 3:1 (UI)
- [ ] `prefers-reduced-motion` support
- [ ] Screen reader testing with VoiceOver (macOS)
- [ ] Skip-to-content link
- [ ] Focus trap in modals/dialogs

---

#### Task 5.4 — Performance
**Time**: 3 hours

- [ ] Code splitting per route (Next.js automatic)
- [ ] Lazy-load WaveSurfer.js (only when audio exists)
- [ ] Virtual scrolling for generation history (if > 50 items)
- [ ] Image optimization: `next/image` for all assets
- [ ] Bundle target: < 200KB initial JS (gzipped)
- [ ] Core Web Vitals targets: LCP < 2.5s, INP < 200ms, CLS < 0.1
- [ ] Backend: async throughout, no blocking I/O
- [ ] Model lazy-loading: only load engine when first requested

---

#### Task 5.5 — Error Handling
**Time**: 3 hours

- [ ] Engine-specific error messages:
  - Kokoro: "espeak-ng not found → `brew install espeak-ng`"
  - Orpheus: "llama-server not running → Start with `llama-server -m ...`"
  - Chatterbox: "MPS not available → falling back to CPU"
  - Gemini: "API key missing → Add `GEMINI_API_KEY` to Settings"
  - Piper: "Model not downloaded → downloading automatically..."
- [ ] Retry with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- [ ] Offline mode: edit text, browse history, play cached audio
- [ ] Crash recovery: auto-restore unsaved text on restart
- [ ] React error boundaries with "Report Issue" button

---

### PHASE 6 — Desktop Packaging
**⏱️ Duration**: 2 days · **Goal**: Distributable macOS app

---

#### Task 6.1 — Tauri Build Configuration
**Time**: 4 hours

- [ ] `tauri.conf.json`: app name, window size, icon paths
- [ ] Bundle FastAPI backend as sidecar process
- [ ] App icon: generate all sizes (16×16 → 1024×1024)
- [ ] Custom app menu (File, Edit, View, Audio, Help)
- [ ] `.kobean` file association
- [ ] Window state persistence (size, position, sidebar width)
- [ ] macOS DMG installer configuration

---

#### Task 6.2 — Model Bundling Strategy
**Time**: 3 hours

- [ ] First-launch experience: "Download voice models" wizard
- [ ] Model download progress bar per engine
- [ ] Store models in `~/Library/Application Support/KobeanAudio/models/`
- [ ] Verify model checksums after download
- [ ] Models NOT bundled in app (too large) — downloaded on demand

---

#### Task 6.3 — macOS Integration
**Time**: 3 hours

- [ ] Native file open/save dialogs
- [ ] Native notifications for "Generation Complete" (when app backgrounded)
- [ ] System tray icon with quick actions
- [ ] Dock badge for generation progress
- [ ] Handoff support (optional)

---

### PHASE 7 — Testing & Launch
**⏱️ Duration**: 2 days · **Goal**: Comprehensive testing, documentation, ship it

---

#### Task 7.1 — Backend Tests
**Time**: 4 hours

- [ ] Unit tests (≥ 80% coverage):
  - Each engine: mock model, verify output format
  - Audio processor: format conversion correctness
  - WAV header generation (verify RIFF structure)
  - MIME type parsing
- [ ] Integration tests:
  - API routes: FastAPI TestClient
  - Database CRUD operations
  - SSE streaming end-to-end
- [ ] Engine-specific tests:
  - Kokoro: verify voice selection works
  - Orpheus: verify emotion tags pass through
  - Gemini: verify API key handling and error recovery

---

#### Task 7.2 — Frontend Tests
**Time**: 3 hours

- [ ] Component tests (Vitest + React Testing Library):
  - GenerateButton state transitions
  - EngineSelector switching
  - VoicePicker filtering
  - TextEditor word count accuracy
- [ ] E2E tests (Playwright):
  - Full flow: type text → select engine → generate → play → export
  - Project CRUD: create, rename, delete
  - Engine switching mid-session
  - Voice clone upload flow

---

#### Task 7.3 — Documentation
**Time**: 3 hours

- [ ] `README.md`: hero screenshot, feature list, quick start, architecture
- [ ] `CONTRIBUTING.md`: dev setup, code style, PR process
- [ ] In-app help: keyboard shortcuts reference
- [ ] API docs: auto-generated from FastAPI OpenAPI schema
- [ ] Model download instructions for each engine

---

#### Task 7.4 — Launch Checklist
**Time**: 2 hours

- [ ] All tests passing
- [ ] Core Web Vitals green
- [ ] WCAG AA audit passing (VoiceOver + keyboard)
- [ ] macOS DMG builds and installs cleanly
- [ ] Error tracking: Sentry or equivalent
- [ ] Analytics events: generation count, engine usage, export formats
- [ ] GitHub Release with DMG binary
- [ ] README badges: CI status, license, version

---

## 📅 Timeline Summary

| Phase | Duration | Deliverable |
|:-----:|:--------:|-------------|
| **0** | 2 days | Bootable monorepo, CI, design system |
| **1** | 5 days | All 7 TTS engines working behind unified interface |
| **2** | 2 days | Complete REST API with SSE streaming |
| **3** | 6 days | Full UI: editor, player, sidebar, voice clone w/ mic |
| **4** | 3 days | Frontend ↔ Backend connected with real-time streaming |
| **5** | 3 days | Polish, accessibility, performance, error handling |
| **6** | 2 days | macOS desktop app packaged and installable |
| **7** | 2 days | Tests, docs, launch |
| | **~25 days** | **🚀 Launch-ready KobeanAudio v1** |

---

## ✅ Resolved Decisions

| Question | Decision |
|----------|----------|
| Web + Desktop or Desktop-only? | **Desktop-only for v1** (Tauri macOS). Web version in v2. |
| Voice cloning input method? | **Both** — file upload AND in-app mic recording (MediaRecorder API) |
| UI language? | **English-only for v1**. Multilingual UI in v2. |
| Include Qwen3-TTS? | **Yes** — added as 7th engine for multilingual TTS (10 languages) |
| Google AI Studio models? | **All 4 Gemini TTS models** included (Pro Plan): 3.1 Flash, 2.5 Flash, 2.5 Pro, 2.5 Flash-Lite |
| Gemini voices? | **All 30 prebuilt voices** available in engine selector |
