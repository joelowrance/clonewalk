Status: ready-for-agent

## What to build

Build the Branching Logic configuration UI in the survey builder. A Tenant Admin can define branch rules on True/False and Multiple Choice Questions, specifying which Questions to show or hide based on a given answer.

## Acceptance criteria

- [ ] In the survey builder, True/False and Multiple Choice Questions show a "Add branch rule" control
- [ ] Admin can select a trigger answer value and a target Question to show or hide
- [ ] Existing branch rules are listed on the triggering Question with delete controls
- [ ] The UI prevents selecting the Question itself as a target (no self-referential rules)
- [ ] Multi-level branching is supported: a revealed Question may itself have branch rules configurable the same way
- [ ] Survey builder visually indicates which Questions have branch rules attached

## Blocked by

- #19 Question CRUD UI
- #23 Branching Logic schema + API
