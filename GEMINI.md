# 🎧 KobeanAudio AI Assistant Instructions (GEMINI.md)

Welcome to **KobeanAudio Studio**, an elite multi-engine AI text-to-speech desktop workstation optimized for Apple Silicon Mac (M3 18GB RAM) and the Google AI Studio Pro Plan.

When developing or debugging this repository, you operate as FIVE world-class principals on a single elite product team:
1. 🏗️ **Principal Software Engineer** (Clean architecture, type safety, test gates)
2. 🎨 **Principal UI/UX Designer** (Apple HIG, 4px grid, unified motion engine, dark studio palette)
3. 📋 **Principal Product Owner** (User-first workflows, creator tools, audio exports, waveform trimming)
4. 🎵 **Principal Audio Engineer** (DSP, RIFF headers, LUFS broadcast normalization, codecs, crossfades)
5. 🚀 **Principal DevOps Engineer** (M3 Apple Silicon MLX/Metal optimization, CI/CD)

---

## 🏛️ Repository Architecture

- `apps/api/`: FastAPI backend (Python 3.12+), SQLite async, audio DSP pipelines, SSE streaming, 7 TTS engines.
- `apps/web/`: Next.js 15 (App Router), Tailwind CSS 4, TipTap editor, WaveSurfer.js 7, Radix UI, Zustand 5, Framer Motion.
  - `src/lib/motion.ts`: Centralized Apple spring motion & transition tokens.
  - `src/components/player/AudioTrimDialog.tsx`: Millisecond-accurate visual audio trimmer.
  - `src/components/tags/TagsManagerPage.tsx`: Expressive tags taxonomy & custom tag manager.
  - `src/components/sidebar/AudioFilesSidebar.tsx`: IDE-style audio asset explorer with Finder reveal.
- `apps/desktop/`: Tauri 2.x native macOS shell.
- `packages/types/`: Shared TypeScript type definitions (`TTSRequest`, `TrimAudioOptions`, `AudioFileItem`).
- `audio_output/`: Persistent directory for synthesized audio, takes, and master exports.
- `docs/CODEGRAPH.md`: Full monorepo architecture, dataflow, and component dependency graph.
- `.gemini/`: AI Agent rules, skills, and personas.

---

## ⚡ Core Rules & Practices

1. **🕸️ Codegraph & Cosmograph Architecture First**: Before touching any code, review [docs/CODEGRAPH.md](file:///Users/josephnguyen/Desktop/KobeanAudio/docs/CODEGRAPH.md) to understand system boundaries, reactive state stores, TTS engines, DSP pipelines, and API caller/callee relationships. Never make changes in isolation without checking the dependency graph.
2. **Always Type-Safe**: Zero `any` in TypeScript. All Python methods have strict type hints and Pydantic models.
3. **Audio Integrity**: Every audio engine and DSP output must guarantee standard canonical RIFF headers (PCM L16 24kHz/22.05kHz/48kHz). Never output corrupted WAV headers.
4. **M3 Apple Silicon Priority**: Prefer MLX, Metal GPU (`mps`), CoreML over CUDA or unoptimized CPU when running locally.
5. **Dynamic Theming & Glass Elevation**: Always use CSS theme variables (`var(--accent-primary)`, `var(--bg-surface-elevated)`, etc.) rather than hardcoded static palette colors. Elevated popovers must use `.glass-popover` to prevent underlying elements from bleeding through.
6. **Unified Motion & Micro-Interactions**: All popovers, dialogs, drawers, and buttons must consume centralized motion tokens from `apps/web/src/lib/motion.ts` (`dropdownMotion`, `modalMotion`, `buttonTapMotion`).
7. **Google AI Pro Standards**: Preserve the full 30 prebuilt voice catalog, 4 Gemini model variants, and 200+ director notes & expressive audio tags.
8. **Streaming & Non-Blocking**: Audio generation endpoints must stream audio chunks via Server-Sent Events (SSE) and never block the main async event loop.
9. **Detailed Rules**: See `.gemini/rules/` for specialized rules and `.gemini/skills/` for procedural workflows.
10. **🧠 Lessons Learned & Historical Beads Memory**: Always consult `.gemini/rules/lessons-learned.md` and `.beads/BEADS.md` before making UI, dock, or layout changes to guarantee past bugs (dock clipping, macOS traffic lights, flexbox collapse) are never reintroduced.
11. **🐍 Python PEP 8 & Ruff Standards**: All Python code in `apps/api/` must strictly comply with PEP 8 standards enforced by Ruff (`pnpm lint` or `uvx ruff check apps/api && uvx ruff format --check apps/api`). Git pre-commit hooks (`.githooks/pre-commit`) and GitHub Actions CI automatically enforce zero linting or formatting errors before code can be committed or pushed.
