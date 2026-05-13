Status: ready-for-agent

## What to build

Add support for nested Questions in the survey builder. A Question can contain child Questions that are always visible and always required — nesting is purely organizational with no conditionality. This is distinct from Branching Logic (which is conditional visibility).

## Acceptance criteria

- [ ] `questions` table gains a nullable `parent_question_id` foreign key
- [ ] API for creating a Question accepts an optional `parent_question_id`
- [ ] `GET /api/surveys/[id]/questions` returns Questions with their children nested in the response
- [ ] In the survey builder, Admin can add a child Question under any top-level Question
- [ ] Nested Questions are visually indented under their parent
- [ ] Nested Questions are always shown — no conditional logic applies
- [ ] Nested Questions can themselves be edited, reordered within their parent, and deleted
- [ ] Deleting a parent Question also deletes its children (cascade)

## Blocked by

- #19 Question CRUD UI
