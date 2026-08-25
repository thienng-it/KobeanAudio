# 📿 KobeanAudio Beads (Historical Issue & Architectural Memory Ledger)

This directory acts as the permanent Git-versioned issue and architectural memory system for KobeanAudio. All solved bugs, regressions, symptoms, root causes, and verification tests are indexed here.

---

## 📋 Active Issue Catalog

| ID | Title | Component | Root Cause | Prevention Rule | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `BEAD-001` | macOS Traffic Light Button Overlap | `TopNav.tsx` | Tailwind `sm:px-3` overrode `pl-[78px]` | Enforce `style={{ paddingLeft: "84px" }}` inline | ✅ Resolved |
| `BEAD-002` | Viewport Bottom Overlap & Cutoff | `page.tsx`, `TextEditor.tsx` | Flexbox children default to `min-height: auto` | Add `min-h-0` on `flex-1` layout parents | ✅ Resolved |
| `BEAD-003` | TopNav & Dock Dropdown Clipping | `TopNav.tsx`, `AudioPlayer.tsx` | Outer dock had `overflow-hidden` with fixed height | Docks must strictly use `overflow-visible` | ✅ Resolved |
| `BEAD-004` | Scroll Container Bottom Cutoff | `StudioInspector.tsx`, `TextEditor.tsx` | `p-4` with default `pb-4` left zero breathing room | Use `pb-24` / `pb-16` on scroll containers | ✅ Resolved |
| `BEAD-005` | Waveform Collapsing on Narrow Windows | `AudioPlayer.tsx` | Flex child had no `min-w` constraint | Add `min-w-[70px] sm:min-w-[130px]` | ✅ Resolved |
| `BEAD-006` | TopNav Right Popover Offscreen Overflow | `EnginePicker.tsx` | `absolute left-0` expanded off the right edge | Use `absolute right-0 top-full` on right elements | ✅ Resolved |

---

## 🔍 Detailed Bead Reports

### `BEAD-001`: macOS Traffic Light Button Overlap
- **Symptom**: Native macOS window buttons (`🔴 🟡 🟢`) overlapping the logo and folder button.
- **Root Cause**: Tailwind responsive padding classes (`sm:px-3`) had higher media query specificity than non-responsive `pl-[78px]`.
- **Fix**: Removed conflicting `px-` classes and applied inline `style={{ paddingLeft: "84px" }}`.
- **Regression Rule**: See `.gemini/rules/lessons-learned.md#2`.

### `BEAD-002`: Viewport Bottom Overlap & Cutoff
- **Symptom**: Studio editor footer and inspector bottom controls pushed under or covered by the bottom player dock.
- **Root Cause**: Flex children without `min-h-0` defaulted to `min-height: auto` and did not calculate shrinking.
- **Fix**: Added `min-h-0` to all `flex-1` parents in `page.tsx` and `TextEditor.tsx`, and `shrink-0` to header and footer.
- **Regression Rule**: See `.gemini/rules/lessons-learned.md#3`.

### `BEAD-003`: TopNav & Dock Dropdown Clipping
- **Symptom**: Dropdown lists in TopNav (EnginePicker, ThemePicker) or AudioPlayer tools were clipped or hidden.
- **Root Cause**: Container had `overflow-hidden` with fixed `h-12` / `h-20`.
- **Fix**: Changed `overflow-hidden` to `overflow-visible` on both navigation and player docks.
- **Regression Rule**: See `.gemini/rules/lessons-learned.md#1`.
