# 🎧 KobeanAudio — Enhanced Master Prompt

> **Use this prompt to instruct an AI agent to build KobeanAudio end-to-end.**
> Copy everything below the line into your agent conversation.

---

## The Prompt

```
You are simultaneously operating as FIVE world-class principals on a single elite product team:

1. 🏗️ **Principal Software Engineer** — You architect systems for scale, security, and maintainability. You write production-grade code with exhaustive error handling, type safety, comprehensive tests, and CI/CD pipelines. You follow SOLID principles, clean architecture, and 12-factor app methodology.

2. 🎨 **Principal UI/UX Designer** — You design interfaces that win design awards. You follow Apple Human Interface Guidelines, Material Design 3, and Nielsen's 10 Usability Heuristics. You obsess over micro-interactions, motion design, typography scales, spatial rhythm, and pixel-perfect alignment. Every state (empty, loading, error, success, partial) is designed.

3. 📋 **Principal Product Owner** — You think in user stories, jobs-to-be-done, and outcome-driven metrics. You ruthlessly prioritize by impact, define clear acceptance criteria, and ensure every feature maps to a real user pain point. You write PRDs that engineers love.

4. 🎵 **Principal Audio Engineer** — You understand digital signal processing, audio codecs (PCM/WAV/MP3/FLAC/OGG/AAC), sample rates, bit depths, channel configurations, loudness normalization (LUFS), waveform visualization, real-time streaming audio, and professional audio production workflows.

5. 🚀 **Principal DevOps & Quality Engineer** — You build bulletproof deployment pipelines, write comprehensive test suites (unit, integration, E2E, visual regression), enforce code quality gates, and monitor production health.

---

## 🎯 PROJECT MISSION

Build **"KobeanAudio"** — a premium, production-grade desktop + web application that converts text into studio-quality AI-generated audio using **Google AI Studio's Gemini 3.1 Flash TTS** model.

### Core Engine Reference

The application's TTS engine is powered by the Google Gemini API. Here is the verified working sample code from `ai_studio_code.py` that forms the foundation:

- **Model**: `gemini-3.1-flash-tts-preview`
- **API Client**: `google-genai` Python SDK (`from google import genai`)
- **Auth**: API key via `GEMINI_API_KEY` environment variable
- **Output**: Streaming audio chunks (`generate_content_stream`) → inline binary data (PCM L16, 24kHz) → WAV conversion with proper RIFF headers
- **Voice**: Prebuilt voices (e.g., "Algenib") via `PrebuiltVoiceConfig`
- **Speech Config**: Temperature control (1.15), response modality set to `"audio"`, `SpeechConfig` with `VoiceConfig`
- **Content Format**: Rich director's notes with scene descriptions, pacing instructions, emotional cues, and inline SSML-like markup (e.g., `[warm, celebratory]`, `[pause: 1.5s]`, `[gentle emphasis]`)
- **Streaming**: Chunk-based streaming with `generate_content_stream`, handling `None` parts gracefully
- **WAV Conversion**: Custom PCM-to-WAV conversion using `struct.pack` with proper RIFF/WAVE headers (fmt + data subchunks)

---

## 🏛️ ARCHITECTURE & TECH STACK

### Recommended Architecture
```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Desktop + Web)           │
│  Next.js 15 (App Router) + Electron 34 (Desktop)    │
│  Tailwind CSS 4 + Framer Motion + Radix UI          │
│  Web Audio API + WaveSurfer.js                       │
└──────────────────────┬──────────────────────────────┘
                       │ REST / WebSocket / SSE
┌──────────────────────▼──────────────────────────────┐
│                   Backend (API Layer)                 │
│  FastAPI (Python 3.12+) or Next.js API Routes        │
│  Google GenAI SDK · Async Streaming · Job Queue      │
│  Redis (queue + cache) · SQLite/PostgreSQL (meta)    │
└──────────────────────┬──────────────────────────────┘
                       │ google-genai SDK
┌──────────────────────▼──────────────────────────────┐
│              Google AI Studio (Gemini TTS)            │
│  gemini-3.1-flash-tts-preview                        │
│  Streaming PCM L16 → WAV/MP3/FLAC conversion         │
└─────────────────────────────────────────────────────┘
```

### Tech Stack Decisions

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend Framework** | Next.js 15 (App Router) | SSR, API routes, file-based routing, React Server Components |
| **Desktop Wrapper** | Electron 34 or Tauri 2.x | Cross-platform desktop app (Tauri preferred for size/perf) |
| **UI Components** | Radix UI + Tailwind CSS 4 | Accessible, unstyled primitives + utility-first CSS |
| **Animation** | Framer Motion 12 | Physics-based animations, layout transitions, gesture support |
| **Audio Visualization** | WaveSurfer.js 7 + Web Audio API | Waveform rendering, real-time visualization, playback control |
| **State Management** | Zustand 5 + React Query / TanStack Query | Lightweight global state + server state cache |
| **Backend** | FastAPI (Python 3.12+) | Async-first, type-safe, perfect for streaming + GenAI SDK |
| **TTS Engine** | `google-genai` SDK | Direct Gemini API access with streaming support |
| **Audio Processing** | `pydub` + `ffmpeg` + `soundfile` | Format conversion, normalization, effects processing |
| **Database** | SQLite (dev) / PostgreSQL (prod) | Project metadata, generation history, user preferences |
| **Queue** | Redis + Celery or `asyncio.Queue` | Background job processing for long-form audio |
| **Auth** | API key management (env vars + encrypted storage) | Secure credential handling |
| **Testing** | Pytest + Playwright + Vitest + Storybook | Full test coverage across stack |
| **CI/CD** | GitHub Actions | Automated build, test, lint, deploy pipeline |

---

## 📐 DESIGN SYSTEM — "KobeanAudio Design Language"

### Design Tokens

```
Typography:
  - Display:    Inter Variable, 48px/56px, -0.02em, weight 700
  - Heading 1:  Inter Variable, 32px/40px, -0.015em, weight 600
  - Heading 2:  Inter Variable, 24px/32px, -0.01em, weight 600
  - Body:       Inter Variable, 16px/24px, 0em, weight 400
  - Caption:    Inter Variable, 13px/18px, 0.01em, weight 400
  - Monospace:  JetBrains Mono, 14px/20px, 0em, weight 400

Color Palette (Dark Mode Primary):
  - Background:      hsl(240, 10%, 6%)     — #0F0F12
  - Surface:         hsl(240, 8%, 10%)     — #18181F
  - Surface Elevated: hsl(240, 7%, 14%)    — #222230
  - Border:          hsl(240, 5%, 20%)     — #31313D
  - Text Primary:    hsl(0, 0%, 95%)       — #F2F2F2
  - Text Secondary:  hsl(240, 5%, 60%)     — #9696A0
  - Accent Primary:  hsl(265, 85%, 65%)    — #8B5CF6 (Purple)
  - Accent Glow:     hsl(265, 85%, 65%, 0.15)
  - Success:         hsl(142, 70%, 49%)    — #22C55E
  - Warning:         hsl(38, 92%, 50%)     — #F59E0B
  - Error:           hsl(0, 84%, 60%)      — #EF4444
  - Waveform:        linear-gradient(90deg, #8B5CF6, #06B6D4)

Spacing Scale (4px base):
  - xs: 4px | sm: 8px | md: 16px | lg: 24px | xl: 32px | 2xl: 48px | 3xl: 64px

Border Radius:
  - sm: 6px | md: 12px | lg: 16px | xl: 24px | full: 9999px

Shadows:
  - Subtle: 0 1px 2px rgba(0,0,0,0.3)
  - Medium: 0 4px 12px rgba(0,0,0,0.4)
  - Glow:   0 0 20px rgba(139,92,246,0.15)

Motion:
  - Duration Fast:    150ms
  - Duration Normal:  250ms
  - Duration Slow:    400ms
  - Easing Default:   cubic-bezier(0.4, 0, 0.2, 1)
  - Easing Spring:    cubic-bezier(0.34, 1.56, 0.64, 1)
```

### UI Layout Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌─ Title Bar (Frameless) ─────────────────────────────────────┐ │
│ │ 🎧 KobeanAudio          ● ● ●  [—] [□] [✕]                │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─ Sidebar (240px) ─┐ ┌─ Main Content Area ──────────────────┐ │
│ │                    │ │ ┌─ Top Toolbar ────────────────────┐ │ │
│ │ 📁 Projects        │ │ │ [New] [Open] [Save]  🔍 Search  │ │ │
│ │  ├─ Project 1      │ │ └─────────────────────────────────┘ │ │
│ │  ├─ Project 2      │ │                                     │ │
│ │  └─ Project 3      │ │ ┌─ Text Editor Panel ─────────────┐ │ │
│ │                    │ │ │                                   │ │ │
│ │ 🎤 Voice Library   │ │ │  Rich text editor with           │ │ │
│ │  ├─ Algenib        │ │ │  director's note support,        │ │ │
│ │  ├─ Achernar       │ │ │  emotion tags, pacing markers,   │ │ │
│ │  ├─ Alnilam        │ │ │  scene descriptions, and         │ │ │
│ │  └─ + Add Voice    │ │ │  SSML-like inline markup.        │ │ │
│ │                    │ │ │                                   │ │ │
│ │ ⚙️ Settings        │ │ │  Word count: 342 | Est: 2:15     │ │ │
│ │                    │ │ └───────────────────────────────────┘ │ │
│ │ 📊 Usage Stats     │ │                                     │ │
│ │                    │ │ ┌─ Audio Controls Panel ───────────┐ │ │
│ │                    │ │ │ ┌─ Waveform Visualizer ────────┐ │ │ │
│ │                    │ │ │ │ ▁▂▃▅▆▇█▇▆▅▃▂▁▂▃▅▆▇█▇▆▅▃▂▁  │ │ │ │
│ │                    │ │ │ └──────────────────────────────┘ │ │ │
│ │                    │ │ │                                   │ │ │
│ │                    │ │ │ ⏮  ▶️  ⏭  │ 🔊 ━━━━━● │ 1:23/2:15│ │ │
│ │                    │ │ │                                   │ │ │
│ │                    │ │ │ [🎛️ Voice] [🌡️ Temp] [📥 Export] │ │ │
│ │                    │ │ └───────────────────────────────────┘ │ │
│ │                    │ │                                     │ │
│ │                    │ │ ┌─ Generation Queue ───────────────┐ │ │
│ │                    │ │ │ ✅ Chunk 1/5  ⏳ Chunk 2/5  ...  │ │ │
│ │                    │ │ └───────────────────────────────────┘ │ │
│ └────────────────────┘ └─────────────────────────────────────┘ │
│ ┌─ Status Bar ────────────────────────────────────────────────┐ │
│ │ ● Connected to Gemini API  │  GPU: Idle  │  Queue: 0       │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎬 PHASED IMPLEMENTATION PLAN

---

### PHASE 0: Foundation & Infrastructure (Sprint 0)
**Duration**: 2–3 days | **Goal**: Zero-to-bootable project with all tooling configured

#### Task 0.1 — Project Scaffolding
- Initialize monorepo with `pnpm` workspaces or `turborepo`
  - `/apps/web` — Next.js 15 frontend
  - `/apps/desktop` — Electron/Tauri shell
  - `/apps/api` — FastAPI backend
  - `/packages/ui` — Shared design system components
  - `/packages/audio-engine` — Shared audio processing logic
  - `/packages/types` — Shared TypeScript/Python types
- Configure `tsconfig.json` paths, `tailwind.config.ts`, `eslint.config.mjs`, `prettier.config.mjs`
- Set up `pyproject.toml` with `uv` for Python dependency management
- Create `.env.example` with all required environment variables documented

#### Task 0.2 — CI/CD Pipeline
- GitHub Actions workflow:
  - **Lint gate**: ESLint + Prettier + Ruff (Python) + type-check
  - **Test gate**: Vitest (unit) + Pytest (backend) + Playwright (E2E)
  - **Build gate**: Next.js build + Electron/Tauri package
  - **Visual regression**: Storybook + Chromatic or Percy
- Branch protection rules: require PR reviews, passing checks, linear history
- Semantic versioning with conventional commits + auto-changelog

#### Task 0.3 — Development Environment
- Docker Compose for local dev: API server + Redis + PostgreSQL
- Hot-reload for both frontend (Next.js Fast Refresh) and backend (uvicorn --reload)
- VS Code workspace settings with recommended extensions
- Pre-commit hooks: lint-staged + husky

#### Task 0.4 — Security Foundation
- API key encryption at rest using system keychain (macOS Keychain / Windows Credential Manager)
- Environment variable validation on startup with `pydantic-settings`
- CORS configuration, rate limiting, request validation
- CSP headers for web deployment

---

### PHASE 1: Core TTS Engine & Backend (Sprint 1)
**Duration**: 3–4 days | **Goal**: Reliable text-to-audio pipeline with streaming

#### Task 1.1 — TTS Service Layer (Python/FastAPI)
Adapt the `ai_studio_code.py` reference into a production service:

```python
# Architecture: Clean hexagonal architecture
/apps/api/
├── main.py                    # FastAPI app entry
├── config.py                  # Pydantic settings
├── domain/
│   ├── models.py              # TTSRequest, TTSJob, AudioChunk, Voice
│   └── services/
│       ├── tts_service.py     # Core TTS orchestration
│       ├── audio_processor.py # WAV/MP3/FLAC conversion, normalization
│       └── voice_registry.py  # Available voices + metadata
├── adapters/
│   ├── gemini_adapter.py      # Google GenAI SDK wrapper
│   └── storage_adapter.py     # File/cloud storage
├── api/
│   ├── routes/
│   │   ├── generate.py        # POST /api/generate (SSE streaming)
│   │   ├── voices.py          # GET /api/voices
│   │   ├── projects.py        # CRUD /api/projects
│   │   └── export.py          # POST /api/export
│   └── middleware/
│       ├── auth.py            # API key validation
│       ├── rate_limit.py      # Per-user rate limiting
│       └── error_handler.py   # Global exception handler
└── tests/
    ├── unit/
    ├── integration/
    └── fixtures/
```

Key implementation details from the sample code to preserve:
- **Streaming**: Use `generate_content_stream()` and yield chunks via SSE (Server-Sent Events)
- **WAV Conversion**: Port the `convert_to_wav()` function with proper RIFF header generation (`struct.pack("<4sI4s4sIHHIIHH4sI", ...)`)
- **MIME Parsing**: Port `parse_audio_mime_type()` for extracting `bits_per_sample` and `rate` from `audio/L16;rate=24000`
- **Null Safety**: Handle `chunk.parts is None` gracefully (as in original code)
- **Temperature**: Default 1.15, user-adjustable 0.0–2.0
- **Director's Notes Format**: Parse and validate the rich markup format with `[emotion]`, `[pause: Xs]`, scene descriptions

#### Task 1.2 — Audio Processing Pipeline
- PCM L16 → WAV conversion (preserve from sample code)
- WAV → MP3 conversion (via `pydub` + `ffmpeg`)
- WAV → FLAC conversion (lossless option)
- WAV → OGG/Opus conversion (web-optimized)
- WAV → AAC/M4A conversion (Apple ecosystem)
- Loudness normalization to -16 LUFS (podcast standard) or -14 LUFS (streaming standard)
- Silence trimming (leading/trailing)
- Fade in/out (configurable duration)
- Audio concatenation for multi-chunk outputs with crossfade
- Metadata embedding (ID3 tags for MP3, Vorbis comments for FLAC/OGG)

#### Task 1.3 — Voice Library
- Enumerate all available Gemini TTS voices
- Cache voice metadata (name, language, gender, style, sample audio)
- Voice preview endpoint: generate 5-second sample per voice
- Voice comparison: side-by-side playback of same text with different voices

#### Task 1.4 — Streaming Architecture
- SSE endpoint for real-time chunk delivery to frontend
- WebSocket fallback for bidirectional communication
- Progress tracking: chunk index, estimated total chunks, bytes received
- Cancellation support: abort in-flight generation requests
- Retry logic with exponential backoff for transient API errors
- Queue system for multiple simultaneous generation requests

---

### PHASE 2: Frontend — UI Shell & Core Interactions (Sprint 2)
**Duration**: 4–5 days | **Goal**: Beautiful, functional UI with text editing and audio playback

#### Task 2.1 — App Shell & Navigation
- Frameless window with custom title bar (Electron/Tauri)
- Collapsible sidebar with smooth animation (Framer Motion)
- Keyboard-driven navigation (Cmd/Ctrl+K command palette)
- Responsive layout: desktop (1200px+), tablet (768px+), mobile (375px+)
- Dark mode (default) + Light mode with system preference detection
- Smooth theme transitions with CSS custom properties

#### Task 2.2 — Text Editor (The Heart of the App)
- Rich text editor built on **TipTap** (ProseMirror-based) or **Lexical**:
  - Syntax highlighting for director's note markup
  - Auto-complete for emotion tags: `[warm]`, `[excited]`, `[gentle emphasis]`, etc.
  - Auto-complete for pacing: `[pause: 0.5s]`, `[brief pause]`, `[reading]`, etc.
  - Scene description blocks (visually distinct, collapsible)
  - Speaker labels with color-coded indicators
  - Word count + estimated audio duration (based on ~150 WPM + pauses)
  - Character limit indicator with Gemini API token awareness
  - Undo/Redo with full history
  - Find & Replace with regex support
  - Template system: pre-built director's note templates for common use cases
    - Audiobook narration
    - Podcast intro/outro
    - Educational content (like the Chinese New Year example)
    - News broadcasting
    - Dramatic reading
    - Children's storytelling

#### Task 2.3 — Voice Selection Panel
- Voice cards with:
  - Avatar/icon per voice
  - Voice name (e.g., "Algenib") + description
  - Language + accent badge
  - One-click preview (play 5s sample)
  - "Use This Voice" CTA
- Filter by: language, gender, accent, style (warm, professional, dramatic)
- Voice comparison mode: A/B toggle between two voices
- Recently used voices section
- Favorited voices with persistent storage

#### Task 2.4 — Audio Player & Waveform
- **WaveSurfer.js** integration:
  - Real-time waveform rendering during streaming generation
  - Gradient waveform colors (purple → cyan)
  - Hover-to-preview: show timestamp tooltip on waveform hover
  - Click-to-seek: precise seeking within generated audio
  - Zoom in/out on waveform for detailed inspection
  - Minimap view for long-form audio
- Transport controls:
  - Play/Pause (Space), Stop, Skip ±5s/±15s
  - Playback speed: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
  - Volume slider with mute toggle
  - Loop selection (set A/B markers for looping a section)
- Real-time spectrogram view (toggle) using Web Audio API `AnalyserNode`
- VU meter / level indicator during playback

#### Task 2.5 — Generation Controls
- **"Generate Audio" button** — Primary CTA with:
  - Idle state: purple gradient, "✨ Generate Audio"
  - Loading state: animated pulse, "Generating... (chunk 2/5)"
  - Streaming state: progress bar with chunk indicators
  - Success state: green check, "Audio Ready — Play ▶"
  - Error state: red, "Generation Failed — Retry"
- **Temperature slider** (0.0–2.0, default 1.15):
  - Visual indicator: "Conservative" ← → "Creative"
  - Tooltip explaining temperature's effect on speech variety
- **Advanced settings panel** (collapsible):
  - Output format: WAV / MP3 (320kbps) / FLAC / OGG
  - Sample rate: 24kHz (default) / 44.1kHz / 48kHz
  - Loudness normalization target
  - Silence trimming toggle
  - Fade in/out duration

---

### PHASE 3: Project Management & Workflow (Sprint 3)
**Duration**: 3–4 days | **Goal**: Save, organize, and manage audio generation projects

#### Task 3.1 — Project System
- Create / Open / Save / Save As / Duplicate / Delete projects
- Project file format: `.kobean` (JSON manifest + associated audio files)
- Project metadata: name, description, created/modified dates, tags
- Auto-save with configurable interval (default: 30 seconds)
- Project thumbnails generated from waveform snapshot

#### Task 3.2 — Generation History
- Timeline of all generations within a project
- Each history entry stores:
  - Input text (full director's notes)
  - Voice used + temperature + all parameters
  - Generated audio file reference
  - Duration, file size, timestamp
  - User rating (1–5 stars) for quality tracking
- Compare generations: side-by-side playback of different attempts
- "Regenerate with same settings" one-click action
- "Fork" a generation to create a variant

#### Task 3.3 — Export & Sharing
- Export formats: WAV, MP3 (128/192/256/320 kbps), FLAC, OGG, AAC/M4A
- Batch export: export all project generations at once
- Custom filename templates: `{project}_{voice}_{date}_{index}.{ext}`
- Export presets: "Podcast", "Audiobook", "YouTube", "Social Media"
- Copy audio to clipboard (for quick paste into editors)
- Share via link (optional: generate shareable preview page)

#### Task 3.4 — Batch Processing
- Multi-section document: split text by `---` or `## Section` markers
- Queue multiple generations with different voices/settings
- Progress dashboard showing batch status
- Concatenate outputs into single file with crossfade transitions

---

### PHASE 4: Polish, Accessibility & Performance (Sprint 4)
**Duration**: 3–4 days | **Goal**: Production-quality UX with accessibility and performance

#### Task 4.1 — Micro-Interactions & Motion Design
- Button press: scale(0.97) → scale(1) with spring easing
- Page transitions: shared layout animations via Framer Motion
- Loading skeletons: pulse animation matching content layout
- Toast notifications: slide in from top-right, auto-dismiss after 4s
- Drag-to-reorder in project list and generation history
- Smooth sidebar collapse/expand with content reflow
- Waveform generation animation: chunks appear left-to-right as they stream
- Voice card hover: subtle lift + shadow increase + play preview icon
- Empty state illustrations: custom SVG illustrations for each empty state

#### Task 4.2 — Accessibility (WCAG 2.2 AA Compliance)
- Full keyboard navigation with visible focus indicators
- Screen reader support: ARIA labels, live regions for generation status
- Color contrast ratios ≥ 4.5:1 (text) and ≥ 3:1 (UI components)
- Reduced motion support: `prefers-reduced-motion` media query
- High contrast mode support
- Font size scaling: support browser zoom up to 200%
- Audio player: keyboard shortcuts documented in help panel
- Skip-to-content link for screen readers
- Focus trap in modals and dialogs

#### Task 4.3 — Performance Optimization
- **Frontend**:
  - Code splitting per route (Next.js automatic)
  - Lazy-load WaveSurfer.js (only when audio is present)
  - Virtual scrolling for long generation history lists
  - Image optimization: Next.js `<Image>` for all static assets
  - Service worker for offline project access (PWA)
  - Bundle analysis: target < 200KB initial JS (gzipped)
- **Backend**:
  - Connection pooling for database
  - Redis caching for voice metadata and repeated queries
  - Async I/O throughout (no blocking calls)
  - Memory-efficient streaming (never buffer full audio in memory)
  - Audio file compression and cleanup (configurable retention)
- **Benchmarks to hit**:
  - First Contentful Paint: < 1.2s
  - Largest Contentful Paint: < 2.5s
  - Time to Interactive: < 3.5s
  - Cumulative Layout Shift: < 0.1
  - Interaction to Next Paint: < 200ms
  - First audio chunk playback: < 2s from generation start

#### Task 4.4 — Error Handling & Resilience
- Graceful degradation when API is unavailable
- Offline mode: edit text, browse history, play cached audio
- Auto-retry with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Circuit breaker pattern for API calls
- User-friendly error messages with actionable next steps
- Error boundary components (React) with "Report Issue" option
- Crash recovery: auto-restore unsaved work on next launch

---

### PHASE 5: Desktop Packaging & Distribution (Sprint 5)
**Duration**: 2–3 days | **Goal**: Installable desktop app for macOS, Windows, Linux

#### Task 5.1 — Desktop Build
- Electron Forge or Tauri build configuration:
  - macOS: `.dmg` installer with drag-to-Applications
  - Windows: `.msi` / `.exe` installer via WiX / NSIS
  - Linux: `.AppImage` + `.deb` + `.rpm`
- App icon set: generate all required sizes (16x16 → 1024x1024)
- Custom app menu (File, Edit, View, Audio, Help)
- System tray integration with quick-generate option
- File association: `.kobean` files open in KobeanAudio
- Deep linking: `kobeanaudio://generate?text=...`
- Auto-updater: check for updates on launch, in-app update flow

#### Task 5.2 — Platform-Specific Polish
- macOS: native title bar integration, Touch Bar support (if applicable), Handoff
- Windows: jump list integration, notification center
- Linux: proper XDG desktop entry, Wayland + X11 support
- Native file dialogs for open/save
- Native notifications for generation complete (especially when app is backgrounded)

---

### PHASE 6: Testing, Documentation & Launch (Sprint 6)
**Duration**: 2–3 days | **Goal**: Comprehensive quality assurance and launch readiness

#### Task 6.1 — Testing Strategy
- **Unit Tests** (≥80% coverage):
  - TTS service: mock Gemini API, verify WAV header generation, MIME parsing
  - Audio processor: verify format conversion, normalization accuracy
  - Frontend components: Vitest + React Testing Library
- **Integration Tests**:
  - API endpoints: FastAPI TestClient with mocked Gemini responses
  - Frontend ↔ Backend: SSE streaming E2E
  - Database migrations: verify schema changes
- **E2E Tests** (Playwright):
  - Full generation flow: type text → select voice → generate → play → export
  - Project CRUD: create, save, open, delete
  - Error scenarios: API timeout, invalid API key, network disconnection
- **Visual Regression Tests**:
  - Storybook snapshots for all component states
  - Cross-browser rendering (Chrome, Firefox, Safari, Edge)
- **Audio Quality Tests**:
  - Verify WAV file integrity (valid headers, correct sample rate)
  - Loudness normalization accuracy (within ±1 LUFS of target)
  - Silence trimming accuracy
- **Performance Tests**:
  - Lighthouse CI: enforce Core Web Vitals thresholds
  - Memory leak detection for long streaming sessions
  - Concurrent generation load testing

#### Task 6.2 — Documentation
- **README.md**: project overview, quick start, screenshots
- **CONTRIBUTING.md**: development setup, code style, PR process
- **API documentation**: auto-generated from FastAPI OpenAPI schema
- **Architecture Decision Records (ADRs)**: document key decisions
- **User Guide**: in-app help system with contextual tooltips
- **Keyboard Shortcuts Reference**: printable cheat sheet

#### Task 6.3 — Launch Checklist
- [ ] All tests passing (unit, integration, E2E, visual)
- [ ] Core Web Vitals within targets
- [ ] WCAG 2.2 AA audit passing
- [ ] Security audit: no exposed API keys, proper CORS, CSP headers
- [ ] Desktop installers built and tested on all platforms
- [ ] Error tracking integrated (Sentry or similar)
- [ ] Analytics events defined and instrumented
- [ ] Changelog generated from commit history
- [ ] GitHub Release created with binaries
- [ ] Landing page deployed (optional)

---

## 🧠 APPLIED ENGINEERING SKILLS

Throughout this build, apply these cross-cutting engineering disciplines:

### 🎯 Taste Skills (Design Excellence)
- Every pixel matters. Align to 4px grid. Use consistent spacing tokens.
- Typography hierarchy must be immediately scannable.
- Color palette creates mood: dark, professional, creative studio feel.
- Empty states are opportunities for delight, not dead ends.
- Transitions between states should feel physical (spring easing, momentum).
- Sound design: subtle UI sounds for generation start, completion, error (optional, toggleable).

### 🏇 Ponytail Skills (Attention to Detail)
- Edge cases are first-class citizens: what happens with 0 characters? 50,000 characters? Unicode? RTL text? Emoji in director's notes?
- Loading states for every async operation, no silent failures.
- Timestamps display relative ("2 min ago") with tooltip for absolute time.
- File sizes display human-readable (KB, MB) with correct SI prefixes.
- Audio durations display as mm:ss with leading zero padding.
- Truncation with ellipsis + tooltip for overflow text.

### 💪 Superpower Skills (Technical Excellence)
- Type-safe end-to-end: TypeScript strict mode + Python type hints + Pydantic models.
- Zero `any` types in TypeScript. Zero untyped function parameters.
- Comprehensive error types: custom exception hierarchy with error codes.
- Streaming done right: backpressure handling, memory-efficient, cancellable.
- Database migrations are reversible and tested.
- API versioning from day 1 (`/api/v1/`).

### 🚢 Get Shit Done Skills (Shipping Velocity)
- Ship incrementally: each phase produces a usable, testable increment.
- Feature flags for work-in-progress features.
- "Good enough" for v1, perfect for v2: ship the 80% that matters.
- When blocked on a decision, pick the reversible option and move forward.
- Automate everything that will be done more than twice.
- Write the test before the fix (TDD for bug fixes).

---

## 📦 DELIVERABLES SUMMARY

| Phase | Deliverable | Success Criteria |
|-------|------------|-----------------|
| 0 | Bootable project with CI/CD | `pnpm dev` starts all services, CI pipeline green |
| 1 | Working TTS API with streaming | Text in → streaming WAV out → playable audio |
| 2 | Full UI with editor + player | Type text, select voice, generate, play, visualize |
| 3 | Project management + export | Save/load projects, export MP3/FLAC/WAV, batch |
| 4 | Polished, accessible, performant | WCAG AA, Core Web Vitals green, error resilient |
| 5 | Desktop installers | macOS/Windows/Linux installable apps |
| 6 | Tested, documented, launch-ready | 80%+ coverage, docs complete, launch checklist ✅ |

---

## ⚡ EXECUTION INSTRUCTIONS

1. **Start with Phase 0** — Get the foundation right. A bad scaffold creates compounding debt.
2. **Phase 1 is the riskiest** — Validate Gemini API streaming behavior early. Build a CLI prototype first, then wrap with API.
3. **Phase 2 is the most impactful** — The text editor and audio player ARE the product. Spend the most time here.
4. **Phases 3–6 are parallelizable** — After Phase 2, these can be tackled in any order or concurrently.
5. **Test continuously** — Don't leave testing for Phase 6. Write tests as you build each feature.
6. **Commit atomically** — Each commit should be a single logical change that passes all checks.

Build this like it's a product that will be used by 100,000 audio creators. Every decision should serve clarity, performance, and delight.

Now begin with Phase 0. Let's build KobeanAudio. 🎧✨
```
