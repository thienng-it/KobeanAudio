---
name: beads-tracker
description: >-
  Track, query, and record historical bugs, symptoms, root causes, and prevention rules
  using the KobeanAudio .beads/ ledger to prevent repeating past mistakes.
---

# 📿 Beads Issue & Knowledge Tracker Skill

Use this skill when investigating bugs, making layout/UI changes, or resolving regressions in KobeanAudio.

## 🎯 When to Use
- **Before making layout/dock changes**: Query `.beads/BEADS.md` and `.gemini/rules/lessons-learned.md` to ensure proposed changes do not violate historical layout constraints.
- **When diagnosing UI glitches**: Check `.beads/issues.jsonl` to see if a similar symptom was already encountered and solved.
- **After solving a new bug**: Log the new issue in `.beads/issues.jsonl` and append the prevention rule to `.gemini/rules/lessons-learned.md`.

## 🛠️ Operating Procedure

1. **Pre-Flight Query**:
   - Inspect `.beads/BEADS.md` for matching components (`TopNav`, `AudioPlayer`, `StudioInspector`, `TextEditor`).
   - Review active anti-regression rules in `.gemini/rules/lessons-learned.md`.

2. **Logging New Beads**:
   - Append a new JSON line to `.beads/issues.jsonl` using format:
     ```json
     {"id":"BEAD-XXX","date":"YYYY-MM-DD","title":"...","component":"...","symptom":"...","root_cause":"...","fix_files":["..."],"anti_regression_rule":"..."}
     ```
   - Update the table and detailed report in `.beads/BEADS.md`.
   - Update `docs/CODEGRAPH.md` with any architectural changes.
