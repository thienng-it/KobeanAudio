# 💻 Frontend Architecture & UI Conventions

KobeanAudio's frontend is built with **Next.js 15 (App Router)**, **Tailwind CSS 4**, **Radix UI**, **WaveSurfer.js 7**, **Zustand 5**, and **Framer Motion**.

---

## 1. Directory & Component Structure

- `apps/web/src/lib/motion.ts`: Centralized Apple spring motion presets, easing curves, and button micro-interactions.
- `apps/web/src/components/navigation/`: TopNav, EnginePicker, ThemePicker.
- `apps/web/src/components/editor/`: Studio Blocks & Plain Script editor, story template selector, tags drawer.
- `apps/web/src/components/player/`: WaveSurfer.js visualizer, transport controls, scrub bar, AudioTrimDialog.
- `apps/web/src/components/inspector/`: StudioInspector with acoustic sliders, voice character search popover, take history.
- `apps/web/src/components/tags/`: TagsManagerPage for 120+ tag taxonomy and custom tag creation.
- `apps/web/src/components/sidebar/`: AudioFilesSidebar IDE asset explorer with native Finder reveals.
- `apps/web/src/components/voice-clone/`: Microphone recorder & file upload dialogs.
- `apps/web/src/components/export/`: Studio export dialog (format, LUFS normalization, custom target directory).
- `apps/web/src/stores/`: Zustand state stores (`engineStore`, `projectStore`, `playerStore`, `themeStore`, `tagStore`, `audioFilesStore`).

---

## 2. State Management Rules

- **Engine State (`engineStore.ts`)**: Manages active engine, active voice, temperature, speed, emotion exaggeration, and engine discovery list.
- **Project State (`projectStore.ts`)**: Manages current project, script text, auto-saving to SQLite backend, and generation history.
- **Player State (`playerStore.ts`)**: Manages current audio URL, playback state, seeking, speed, volume, and waveform zoom.
- **Theme State (`themeStore.ts`)**: Manages 9 studio themes with automatic OS appearance listener.
- **Tag State (`tagStore.ts`)**: Manages prebuilt expressive tags and custom user-created tags with import/export.
- **Audio Files State (`audioFilesStore.ts`)**: Scans disk storage, deletes takes, and reveals files in native macOS Finder.

---

## 3. WaveSurfer & Audio Integration

- Always initialize WaveSurfer with a cleanup function in `useEffect`.
- Waveform gradient colors: `#4C1D95` to `#8B5CF6` (progress), `#06B6D4` (cursor), or dynamic theme `--accent-primary`.
- When a new audio chunk or URL is loaded, handle loading states gracefully without freezing the UI.

---

## 4. Motion, Animations & Glassmorphism Tokens

- **Motion Presets (`apps/web/src/lib/motion.ts`)**:
  - `dropdownMotion`: Standard spring transition for all popovers and menus (`scale: 0.96 -> 1`, `y: -4 -> 0`).
  - `modalMotion`: Backdrop fade and modal card scale entry.
  - `buttonTapMotion` / `buttonSubtleTapMotion`: Tactile micro-press feedback.
  - `SPRINGS.popover`: Spring curve for sidebars and collapsible drawers.
- **Solid Glass Elevation (`globals.css`)**:
  - Popovers and menus must use `.glass-popover` (high opacity `0.96–0.98` with deep specular drop shadow) to eliminate background text bleed-through.
