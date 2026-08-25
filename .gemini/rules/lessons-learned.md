# 🧠 KobeanAudio Lessons Learned & Anti-Regression Rules

This document serves as the **mandatory architectural memory** for all AI agents and developers working on KobeanAudio. It records past critical issues, root causes, and explicit design constraints to ensure the same bugs are never reintroduced.

---

## 🚫 1. Dock & Navigation Overflow Rule (`overflow-visible`)
- **Symptom**: Dropdown menus (EnginePicker, ThemePicker, Studio Workspace, More Tools) appear clipped, truncated, or completely invisible when clicked.
- **Root Cause**: The parent `<header>` or dock container had `overflow-hidden` with a fixed height (e.g. `h-12`). Any dropdown using `absolute top-full` was clipped at the 48px boundary.
- **Rule**:
  - `<header>` in `TopNav.tsx` and the bottom dock in `AudioPlayer.tsx` **MUST ALWAYS USE `overflow-visible`**.
  - Never apply `overflow-hidden` to outer dock containers that host floating menus.

---

## 🍎 2. macOS Traffic Light Clearance Rule (`paddingLeft: 84px`)
- **Symptom**: Native macOS window control buttons (`🔴 🟡 🟢`) overlap the Folder button and the KobeanAudio logo.
- **Root Cause**: Tailwind responsive padding classes (such as `sm:px-3` or `px-4`) have higher media query specificity than non-responsive `pl-[78px]`, overriding the titlebar inset on screens > 640px.
- **Rule**:
  - Enforce `style={{ paddingLeft: "84px" }}` inline directly on the `<header>` element in `TopNav.tsx`.
  - Do not use conflicting `px-` utility classes on `<header>`.

---

## 📐 3. Flexbox Viewport Bounds & Shrink Protection (`min-h-0` & `shrink-0`)
- **Symptom**: The bottom transport dock overlaps the bottom of the studio editor or inspector when the window height is small.
- **Root Cause**: In CSS Flexbox, children default to `min-height: auto`. Without `min-h-0`, middle containers refuse to shrink below their internal content height, pushing content under sibling fixed docks.
- **Rule**:
  - Every `flex-1 flex-col` parent between the root viewport and scrollable content in `page.tsx` and `TextEditor.tsx` **MUST include `min-h-0`**.
  - TopNav and AudioPlayer containers **MUST include `shrink-0`**.

---

## 📜 4. Scrollable Container Bottom Clearance (`pb-24` & `pb-16`)
- **Symptom**: Elements at the bottom of the Inspector (`Auto-Trim Silence`, `LUFS Normalization`) or TextEditor (`Local Studio SQLite` status) touch the bottom dock or cannot be scrolled into full view.
- **Root Cause**: Scroll containers used default padding (`p-4` with `pb-4`), leaving no breathing room above the fixed bottom player dock.
- **Rule**:
  - `StudioInspector.tsx` scroll containers must have `pb-24`.
  - `TextEditor.tsx` script canvas must have `pb-16`.

---

## 🎚️ 5. Popover Max Height & Glass Elevation
- **Symptom**: Dropdown menus extend beyond the bottom of the window or text behind them bleeds through.
- **Root Cause**: Popovers lacked explicit height bounds or used semi-transparent backgrounds without high-contrast glass tokens.
- **Rule**:
  - Always apply `.glass-popover` for solid elevated glassmorphism.
  - Dropdown lists must set `max-h-48` or `max-h-56` with `overflow-y-auto`.
  - Dropdowns located near the right edge of the screen must use `absolute right-0 top-full`.

---

## 🌊 6. Waveform Minimum Width
- **Symptom**: Resizing the window narrow collapses the WaveSurfer canvas into a small vertical oval.
- **Root Cause**: In a flex row with buttons, `flex-1` waveform container without `min-w` shrinks to 0px.
- **Rule**:
  - Waveform canvas container in `AudioPlayer.tsx` must always have `min-w-[70px] sm:min-w-[130px]`.

---

## 🖥️ 7. Minimum Desktop Window Size & Bounds (980x640)
- **Symptom**: Resizing window smaller than 900px squashes studio panels and clips controls.
- **Root Cause**: Unconstrained desktop window resize bounds in Tauri and CSS allowed squeezing the 3-column studio workstation beyond physical layout limits.
- **Rule**:
  - `tauri.conf.json` must enforce `minWidth: 980` and `minHeight: 640` (with default `1360x880`).
  - `page.tsx` root container must enforce `min-w-[980px] min-h-[640px]`.
