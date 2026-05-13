Status: ready-for-agent

## What to build

Create the `questions` table and its CRUD API. A Question belongs to a Survey and has an Answer Type, a Point Value, an optional Critical flag, and an ordering position. This slice covers flat Questions only — Nesting comes in #22 and Branching Logic in #23.

## Acceptance criteria

- [ ] `questions` table exists with id, survey_id, tenant_id, text, answer_type (enum), point_value, is_critical, position, and created_at; RLS applied
- [ ] Answer type enum includes: true_false, scored, multiple_choice, photo, file
- [ ] `GET /api/surveys/[id]/questions` returns Questions for a Survey ordered by position
- [ ] `POST /api/surveys/[id]/questions` creates a Question
- [ ] `PATCH /api/questions/[id]` updates a Question (text, answer type, point value, critical flag)
- [ ] `DELETE /api/questions/[id]` deletes a Question
- [ ] `PATCH /api/surveys/[id]/questions/reorder` accepts a new position array and reorders Questions
- [ ] All endpoints protected by authentication and permission middleware

## Blocked by

- #16 Survey schema + CRUD API
