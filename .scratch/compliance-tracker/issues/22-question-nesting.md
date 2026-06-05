Status: done

## What to build

Add support for nested Questions in the survey builder. A Question can contain child Questions that are always visible and always required — nesting is purely organizational with no conditionality. This is distinct from Branching Logic (which is conditional visibility).

## Acceptance criteria

- [x] `questions` table gains a nullable `parent_question_id` foreign key
- [x] API for creating a Question accepts an optional `parent_question_id`
- [x] `GET /api/surveys/[id]/questions` returns Questions with their children nested in the response
- [x] In the survey builder, Admin can add a child Question under any top-level Question
- [x] Nested Questions are visually indented under their parent
- [x] Nested Questions are always shown — no conditional logic applies
- [x] Nested Questions can themselves be edited, reordered within their parent, and deleted
- [x] Deleting a parent Question also deletes its children (cascade)

## Blocked by

- #19 Question CRUD UI

## Testing instructions

**Prerequisites:** Docker running (`docker compose up -d`), migration applied (`pnpm db:migrate`).

**Integration tests (fast):**
```
# DB layer:
DATABASE_URL="postgresql://compliance:compliance@localhost:5432/compliance_dev" \
  pnpm --filter @compliance/db exec vitest run src/__tests__/questions.integration.test.ts
# Expected: 20 passing

# API layer:
pnpm --filter @compliance/admin exec vitest run src/__tests__/questions.integration.test.ts
# Expected: 32 passing
```

New tests cover:
- `createQuestion` stores `parentQuestionId`
- Child positions scoped within parent siblings (not global)
- `createQuestion` returns `parent_is_child` error for grandchild attempts
- `listQuestions` returns nested structure with `children: []` on each parent
- Children ordered by position within parent
- `reorderQuestions` rejects IDs spanning different parent contexts
- Cascade delete: deleting parent removes children
- POST API accepts `parentQuestionId`, validates parent exists in survey and is not itself a child
- GET API returns nested structure inline
- PATCH response includes `parentQuestionId`

**E2E tests:**
```
DATABASE_URL="postgresql://..." pnpm --filter @compliance/admin test:e2e -- e2e/questions.spec.ts
```

New tests cover:
- "Add child" button visible on each top-level question row
- Adding a child question → appears as indented `[data-testid="child-question-row"]` below parent
- Reordering children with up/down buttons
- Deleting a parent with children shows cascade warning ("also delete 1 child question")
