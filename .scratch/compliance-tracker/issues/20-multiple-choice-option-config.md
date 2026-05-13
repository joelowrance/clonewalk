Status: ready-for-agent

## What to build

Extend the survey builder so that Multiple Choice Questions can have their options configured. Each option has a label and its own Point Value (graduated scoring, not binary). This is separate from basic Question CRUD because the options model is distinct.

## Acceptance criteria

- [ ] `question_options` table exists with id, question_id, label, point_value, and position; linked to multiple_choice Questions only
- [ ] `GET /api/questions/[id]/options` returns options for a Question
- [ ] `POST /api/questions/[id]/options` adds an option
- [ ] `PATCH /api/question-options/[id]` updates an option's label or point value
- [ ] `DELETE /api/question-options/[id]` removes an option
- [ ] In the survey builder, selecting Multiple Choice Answer Type reveals an options editor
- [ ] Admin can add, edit, delete, and reorder options
- [ ] Each option has its own Point Value input
- [ ] A Multiple Choice Question must have at least two options to be valid

## Blocked by

- #19 Question CRUD UI
