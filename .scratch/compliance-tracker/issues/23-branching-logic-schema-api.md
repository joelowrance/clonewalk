Status: done

## What to build

Create the schema and API for Branching Logic. Branching Logic defines conditional rules on a Question that show or hide other Questions based on the current answer. Only True/False and Multiple Choice Questions can trigger branches. Branches can be multi-level.

## Acceptance criteria

- [x] `branch_rules` table exists with id, trigger_question_id, trigger_answer_value, target_question_id, and action (show/hide)
- [x] Branching only allowed on true_false and multiple_choice Answer Types — enforced at API level
- [x] `GET /api/surveys/[id]/branch-rules` returns all branch rules for a Survey
- [x] `POST /api/branch-rules` creates a branch rule
- [x] `DELETE /api/branch-rules/[id]` removes a branch rule
- [x] Circular branch references are rejected
- [x] Branch rules do not affect Point Values or Critical flags — enforced at API level

## Blocked by

- #18 Question schema + CRUD API

## Testing instructions

**Prerequisites:** Docker running (`docker compose up -d`), migration applied (`pnpm db:migrate`).

**Integration tests (fast):**
```
# DB layer:
DATABASE_URL="postgresql://compliance:compliance@localhost:5432/compliance_dev" \
  pnpm --filter @compliance/db exec vitest run src/__tests__/branch-rules.integration.test.ts
# Expected: 7 passing

# API layer:
pnpm --filter @compliance/admin exec vitest run src/__tests__/branch-rules.integration.test.ts
# Expected: 8 passing
```

DB tests cover:
- `createBranchRule` stores rule and returns all fields
- `listBranchRules` scopes to survey (not other surveys)
- `deleteBranchRule` removes rule; returns `not_found` for missing id
- `createBranchRule` returns `invalid_trigger_type` for scored/photo/file questions
- `createBranchRule` rejects direct cycles (Q1→Q2, Q2→Q1)
- `createBranchRule` rejects multi-hop cycles (Q1→Q2, Q2→Q3, Q3→Q1)

API tests cover:
- GET 401/403 auth guards
- GET 200 returns branch rules for survey
- POST 201 creates rule with all fields
- POST 400 `invalid_trigger_type` for scored trigger
- POST 401 auth guard
- DELETE 200 removes rule; GET confirms empty
- DELETE 404 for non-existent id
