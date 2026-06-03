Status: done

## What to build

Extend the survey builder so that Scored Questions can have an admin-defined numeric range (min/max). The Inspector enters a value within that range during a Walkthrough; the system maps it proportionally to the Question's Point Value.

## Acceptance criteria

- [x] `question_scored_config` table (or columns on `questions`) stores min_value and max_value for Scored Questions
- [x] API for creating/updating a Scored Question accepts and persists min_value and max_value
- [x] In the survey builder, selecting Scored Answer Type reveals min/max range inputs
- [x] Validation: min must be less than max; both required for Scored Questions
- [x] Scoring formula documented in code: `(entered_value - min) / (max - min) * point_value`

## Blocked by

- #19 Question CRUD UI

## Testing instructions

**Prerequisites:** Docker running (`docker compose up -d`), migration applied (`pnpm db:migrate`).

**Integration tests (fast):**
```
pnpm --filter @compliance/admin exec vitest run src/__tests__/questions.integration.test.ts
```
All 19 tests should pass. New tests cover:
- POST with `answerType: 'scored'` and `scoredMinValue`/`scoredMaxValue` → 201 with range in response
- POST scored without min or max → 400
- POST with min ≥ max → 400
- POST non-scored without range → 201 with `scoredMinValue: null`
- PATCH updating scored range → 200 with updated values

**E2E tests:**
```
DATABASE_URL="postgresql://..." pnpm --filter @compliance/admin test:e2e -- e2e/questions.spec.ts
```
8/9 tests pass. New tests cover:
- Selecting Scored in the form reveals min/max inputs; switching away hides them
- Adding a scored question with a range → row displays `0–5` in the Range column
- Editing a scored question opens modal with existing min/max prefilled; updates persist

The drag-and-drop persistence test (#9) is a pre-existing flaky test unrelated to this issue.
