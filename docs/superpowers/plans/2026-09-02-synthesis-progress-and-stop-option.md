# Synthesis Progress Bar & Stop Option Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real-time progress bar to the bottom transport dock and provide an immediate Stop/Cancel synthesis option using AbortController.

**Architecture:** Extend API client `generateAudio` with `AbortSignal` support, wire abort handling in `page.tsx`, update `AudioPlayer.tsx` to display an animated progress bar and transform the Generate button into a Stop button when `isGenerating` is true.

**Tech Stack:** Next.js 15, TypeScript 5, Framer Motion, Zustand 5, Lucide React.

## Global Constraints

- Zero `any` in TypeScript.
- Unified Framer Motion transitions (`modalMotion`, `buttonTapMotion` from `@/lib/motion`).
- Consistent studio theme tokens (`var(--accent-primary)`, `var(--bg-surface-elevated)`).
- Preserve existing playback and editor state on cancellation.

---

### Task 1: Extend API Client with AbortSignal

**Files:**
- Modify: `apps/web/src/lib/api.ts`

- [ ] **Step 1: Add `signal?: AbortSignal` parameter to `generateAudio`**

In `apps/web/src/lib/api.ts`, update `generateAudio(payload: TTSRequest, signal?: AbortSignal)` and pass `signal` into the `fetch` options.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/api.ts
git commit -m "feat(web): add AbortSignal support to generateAudio API client"
```

---

### Task 2: Implement Stop & Progress State in Page Component

**Files:**
- Modify: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Wire `AbortController` and progress simulation in `page.tsx`**

- Add `abortControllerRef = useRef<AbortController | null>(null)`.
- In `handleGenerate`:
  - Create new `AbortController` and attach to ref.
  - Set up a smooth progressive interval updating `streamProgress` (`15%` -> `35%` -> `60%` -> `85%`).
  - Pass `abortController.signal` to `generateAudio`.
  - Handle `err.name === 'AbortError'` gracefully without showing error toast.
- Implement `handleStopGenerate`:
  - Call `abortControllerRef.current?.abort()`.
  - Clear interval, set `isGenerating(false)`, and set `streamProgress(null)`.

- [ ] **Step 2: Pass `streamProgress` and `onStop={handleStopGenerate}` to `AudioPlayer`**

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/page.tsx
git commit -m "feat(web): wire AbortController and progress handling in studio page"
```

---

### Task 3: Update AudioPlayer Dock with Progress Bar and Stop Button

**Files:**
- Modify: `apps/web/src/components/player/AudioPlayer.tsx`

- [ ] **Step 1: Update `AudioPlayerProps` and Generate/Stop button**

- Add `onStop?: () => void` and `progress?: { percent: number; message: string } | null` to `AudioPlayerProps`.
- When `isGenerating` is true:
  - Render an active `[⏹ Stop Synthesis]` button with `<Square className="fill-current w-3.5 h-3.5" />` styled with a glowing red/amber glass effect.
  - Clicking calls `onStop()`.
- When `isGenerating` is true in the waveform area:
  - Render a sleek animated **Glass Progress Bar** displaying `progress.percent`, animated striped gradient, and current phase message.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/player/AudioPlayer.tsx
git commit -m "feat(web): add progress bar and Stop button to AudioPlayer dock"
```

---

### Task 4: Verification & Build Check

**Files:**
- Verify: `apps/web` TypeScript typecheck & Next.js production build.

- [ ] **Step 1: Run `npx tsc --noEmit` and `npm run build`**
- [ ] **Step 2: Commit any cleanups**
