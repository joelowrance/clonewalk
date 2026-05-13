Status: ready-for-agent

## What to build

Build the flat Question management UI within the survey builder. A Tenant Admin can add, edit, delete, and reorder Questions in a Survey. This covers flat Questions only — Nesting (#22), Multiple Choice options (#20), Scored ranges (#21), and Branching Logic (#24) are separate slices.

## Acceptance criteria

- [ ] `/surveys/[id]` (survey builder) lists Questions in order with their text, Answer Type, Point Value, and Critical flag
- [ ] Admin can add a new Question (text, Answer Type, Point Value, Critical flag)
- [ ] Admin can edit an existing Question inline or via a form
- [ ] Admin can delete a Question (with confirmation)
- [ ] Admin can reorder Questions via drag-and-drop or up/down controls
- [ ] Answer Type selection is limited to: True/False, Scored, Multiple Choice, Photo, File
- [ ] Reordering persists on page refresh

## Blocked by

- #17 Survey create/edit UI
- #18 Question schema + CRUD API
