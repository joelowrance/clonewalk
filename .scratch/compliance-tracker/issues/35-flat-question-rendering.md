Status: ready-for-agent

## What to build

Render all flat Questions during a Walkthrough in the Field App. Each Answer Type renders an appropriate input control; answers are saved to SQLite as the Inspector progresses. This covers flat Questions only — Nesting (#37) and Branching Logic (#36) are separate.

## Acceptance criteria

- [ ] True/False Questions render a Yes/No toggle or equivalent binary control
- [ ] Scored Questions render a numeric input constrained to the admin-defined min/max range
- [ ] Multiple Choice Questions render a list of options with their labels (point values not shown to Inspector)
- [ ] Photo Questions render a camera capture control (functional capture not required here — a placeholder is acceptable; full implementation in #39)
- [ ] File Questions render a file picker placeholder (full implementation in #40)
- [ ] Answers are saved to SQLite immediately on change (no explicit "Save" needed)
- [ ] Previously answered Questions show their saved answer on resume
- [ ] Progress indicator shows how many Questions have been answered

## Blocked by

- #18 Question schema + CRUD API
- #34 Walkthrough start + SQLite scaffold
