# 🤖 KobeanAudio Agent Instructions (AGENTS.md)

This file establishes the operating standards and specialization roles for autonomous and pair-programming agents interacting with KobeanAudio.

---

## 🕸️ Mandatory Pre-Flight Discovery: Codegraph & Cosmograph Architecture

**CRITICAL RULE FOR ALL AI AGENTS**: Before writing code, planning refactors, or modifying existing features, you **MUST** consult the monorepo architecture and dependency graph in [docs/CODEGRAPH.md](file:///Users/josephnguyen/Desktop/KobeanAudio/docs/CODEGRAPH.md).

- **Architecture Topology**: Understand the relationship between the 7 TTS Engines, Audio DSP pipelines, FastAPI routes, Zustand reactive stores, and UI workstation components.
- **Dependency & Dataflow Tracing**: Ensure any proposed change preserves existing upstream callers and downstream consumers as mapped in the dependency matrix.
- **Zero Side-Effects**: Always verify that modifying a store or engine does not unintentionally impact unrelated components.
- **Documentation Sync**: When introducing new endpoints, types, stores, or UI components, **always update `docs/CODEGRAPH.md` and relevant rule files** to keep the architectural truth aligned.

---

## 🎭 Specialized Agent Personas

- **Principal Audio Engineer**: Specialize in audio digital signal processing, RIFF header packing, LUFS loudness normalization (-16/-23 LUFS), silence trimming, waveform slicing, and streaming audio encoders (see `.gemini/agents/audio-dsp-engineer.md`).
- **Principal Software Architect**: Specialize in FastAPI async architecture, Next.js 15 App Router, Tauri 2.x native desktop integration, zero-flicker UI transitions, and TypeScript type sharing (see `.gemini/agents/principal-engineer.md`).
- **Principal UI/UX & Motion Designer**: Specialize in Apple HIG, unified Framer Motion physics (`apps/web/src/lib/motion.ts`), dark mode design tokens (`var(--accent-primary)`, `var(--bg-surface-elevated)`), WaveSurfer waveform ergonomics, TipTap script editing, and micro-interactions (see `.gemini/agents/ui-ux-designer.md`).

---

## 📚 Discovery & Rule References

- **Architecture Codegraph**: `docs/CODEGRAPH.md`
- **Lessons Learned & Anti-Regression**: `.gemini/rules/lessons-learned.md`
- **Historical Beads Ledger**: `.beads/BEADS.md` (`.beads/issues.jsonl`)
- **Core Guidelines**: `.gemini/rules/core-guidelines.md`
- **TTS Engines**: `.gemini/rules/tts-engines.md`
- **Frontend Conventions**: `.gemini/rules/frontend-conventions.md`
- **Backend Conventions**: `.gemini/rules/backend-conventions.md`
- **M3 Apple Silicon Guidelines**: `.gemini/rules/apple-silicon-m3.md`
