# 🎯 Core Engineering Guidelines & Mindset

When contributing to KobeanAudio, apply these five cross-cutting engineering disciplines:

---

### 0. 🕸️ Architecture Discovery & Codegraph Pre-Check
- **Mandatory Codegraph Reference**: Before implementing new features or refactoring existing ones, always review [docs/CODEGRAPH.md](file:///Users/josephnguyen/Desktop/KobeanAudio/docs/CODEGRAPH.md).
- **Module Dependency Tracing**: Cross-reference the Dependency Matrix to identify upstream callers and downstream subscribers across the 7 TTS Engines, DSP services, FastAPI routes, and Zustand stores.
- **Side-Effect Prevention**: Verify that changes to shared schemas, state stores, or audio pipelines do not break unrelated components.

---

### 1. 🎯 Taste Skills (Design Excellence)
- **4px Spatial Rhythm**: All margins, padding, and gaps must strictly adhere to the 4px scale (4, 8, 12, 16, 20, 24, 32, 48, 64).
- **Dynamic Theming**: Never use hardcoded colors (`bg-cyan-500`, `bg-[#0A0A0F]`). Strictly use dynamic theme tokens: `var(--accent-primary)`, `var(--accent-secondary)`, `var(--accent-gradient)`, `var(--accent-glow)`, `var(--bg-surface)`, `var(--bg-surface-elevated)`.
- **Zero-Flicker Transitions**: Ensure modals use unified single-motion overlays and persistent workspace displays (`flex` vs `hidden`) to prevent double-flashing and layout shifts.
- **Empty States**: Never leave empty states blank; provide engaging contextual prompts and one-click sample templates.

---

### 2. 🏇 Ponytail Skills (Attention to Detail)
- **Edge Cases First**: Test empty text, 50,000-character scripts, emojis in director notes, and abrupt network disconnects.
- **Human-Readable Metrics**: Format durations as `mm:ss` (e.g. `2:15`), file sizes as `KB`/`MB` with 1 decimal place, and relative timestamps with tooltips.
- **Micro-State Coverage**: Every interactive control must explicitly handle `idle`, `hover`, `active`, `loading`, `disabled`, and `error` states.

---

### 3. 💪 Superpower Skills (Technical Rigor)
- **End-to-End Type Safety**: Shared TypeScript interfaces in `@kobeanaudio/types` mirrored exactly in Python Pydantic models. Zero untyped function arguments.
- **WAV RIFF Compliance**: Always pack 44-byte standard headers (`ChunkID="RIFF"`, `Format="WAVE"`, `Subchunk1ID="fmt "`, `Subchunk2ID="data"`).
- **Asynchronous & Non-Blocking**: All file I/O, audio conversion, and model inferences must execute in thread pools (`asyncio.to_thread`) without blocking FastAPI's event loop.

---

### 4. 🚢 Get Shit Done Skills (Shipping Velocity)
- **Atomic Changes**: Keep changes focused, logical, and independently verifiable.
- **Self-Healing Fallbacks**: If a heavy local model or API key is not ready, provide immediate graceful fallbacks (e.g., Piper draft or test synthesizer) without crashing the application.
