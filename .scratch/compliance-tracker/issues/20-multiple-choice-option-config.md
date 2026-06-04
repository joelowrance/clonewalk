Status: done

## What to build

Extend the survey builder so that Multiple Choice Questions can have their options configured. Each option has a label and its own Point Value (graduated scoring, not binary). This is separate from basic Question CRUD because the options model is distinct.

## Acceptance criteria

- [x] `question_options` table exists with id, question_id, label, point_value, and position; linked to multiple_choice Questions only
- [x] `GET /api/questions/[id]/options` returns options for a Question
- [x] `POST /api/questions/[id]/options` adds an option
- [x] `PATCH /api/question-options/[id]` updates an option's label or point value
- [x] `DELETE /api/question-options/[id]` removes an option
- [x] In the survey builder, selecting Multiple Choice Answer Type reveals an options editor
- [x] Admin can add, edit, delete, and reorder options
- [x] Each option has its own Point Value input
- [x] A Multiple Choice Question must have at least two options to be valid

## Blocked by

- #19 Question CRUD UI

## Testing instructions

**API (automated):** 16 integration tests in `apps/admin/src/__tests__/question-options.integration.test.ts` cover all four endpoints and auth guards. Run with:
```
pnpm --filter @compliance/admin exec vitest run src/__tests__/question-options.integration.test.ts
```

**UI (manual):** Start the dev server (`pnpm dev:admin`), open a survey in the survey builder.
1. Add question → select Multiple Choice → verify the "Options" section appears
2. Try saving with 0 or 1 options → should show validation error
3. Add 2+ options with labels and point values → save → question created
4. Click Edit on the multiple_choice question → verify existing options load
5. Add/delete/reorder options → save → verify changes persist
