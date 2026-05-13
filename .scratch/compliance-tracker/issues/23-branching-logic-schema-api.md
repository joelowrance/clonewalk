Status: ready-for-agent

## What to build

Create the schema and API for Branching Logic. Branching Logic defines conditional rules on a Question that show or hide other Questions based on the current answer. Only True/False and Multiple Choice Questions can trigger branches. Branches can be multi-level.

## Acceptance criteria

- [ ] `branch_rules` table exists with id, trigger_question_id, trigger_answer_value, target_question_id, and action (show/hide)
- [ ] Branching only allowed on true_false and multiple_choice Answer Types — enforced at API level
- [ ] `GET /api/surveys/[id]/branch-rules` returns all branch rules for a Survey
- [ ] `POST /api/branch-rules` creates a branch rule
- [ ] `DELETE /api/branch-rules/[id]` removes a branch rule
- [ ] Circular branch references are rejected
- [ ] Branch rules do not affect Point Values or Critical flags — enforced at API level

## Blocked by

- #18 Question schema + CRUD API
