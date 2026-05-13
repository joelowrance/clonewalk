Status: ready-for-agent

## What to build

Render nested Questions correctly during a Walkthrough in the Field App. Nested Questions are always visible and always required — they are displayed indented under their parent with no conditionality.

## Acceptance criteria

- [ ] Child Questions render indented beneath their parent Question
- [ ] Child Questions are always shown regardless of answers (no conditional logic)
- [ ] Child Questions are answered the same way as top-level Questions (same input controls)
- [ ] Answers to child Questions are saved to SQLite independently
- [ ] Progress indicator counts child Questions as part of total required answers
- [ ] Submitting a Walkthrough requires all child Questions to be answered

## Blocked by

- #22 Question Nesting
- #35 Flat Question rendering
