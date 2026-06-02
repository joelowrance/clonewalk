Status: ready-for-agent

## What to build

Build the flat Question management UI within the survey builder. A Tenant Admin can add, edit, delete, and reorder Questions in a Survey. This covers flat Questions only — Nesting (#22), Multiple Choice options (#20), Scored ranges (#21), and Branching Logic (#24) are separate slices.

## Acceptance criteria

- [x] `/surveys/[id]` (survey builder) lists Questions in order with their text, Answer Type, Point Value, and Critical flag
- [x] Admin can add a new Question (text, Answer Type, Point Value, Critical flag)
- [x] Admin can edit an existing Question inline or via a form
- [x] Admin can delete a Question (with confirmation)
- [x] Admin can reorder Questions via drag-and-drop or up/down controls
- [x] Answer Type selection is limited to: True/False, Scored, Multiple Choice, Photo, File
- [x] Reordering persists on page refresh

## Blocked by

- #17 Survey create/edit UI
- #18 Question schema + CRUD API
