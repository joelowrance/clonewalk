# Plan: Issue #18 — Question Schema + CRUD API

## Context

Questions are the core content unit of a Survey. This slice adds the flat `questions` table (no nesting, no branching) and its full CRUD API, including a position-based reorder endpoint. Nesting (#22) and Branching Logic (#23) extend this foundation.

Permission used throughout: `manage:surveys` (Questions are part of survey configuration).

## Files to Create / Modify

### DB layer

| File | Action | Purpose |
|------|--------|---------|
| `packages/db/src/schema/questions.ts` | Create | `answerTypeEnum` + `questions` table definition |
| `packages/db/src/schema/index.ts` | Modify | Add `export * from './questions'` |
| `packages/db/src/questions-queries.ts` | Create | listQuestions, getQuestion, createQuestion, updateQuestion, deleteQuestion, reorderQuestions |
| `packages/db/src/index.ts` | Modify | Export question query functions and `QuestionRow` type |
| Migration (auto-generated) | Generate | `pnpm db:generate` → applies via `pnpm db:migrate` |

### API layer

| File | Action | Purpose |
|------|--------|---------|
| `apps/admin/src/app/api/surveys/[id]/questions/route.ts` | Create | GET list ordered by position; POST create |
| `apps/admin/src/app/api/surveys/[id]/questions/reorder/route.ts` | Create | PATCH reorder — accepts `{ questionIds: string[] }` |
| `apps/admin/src/app/api/questions/[id]/route.ts` | Create | PATCH update; DELETE |

### Tests

| File | Action | Purpose |
|------|--------|---------|
| `packages/db/src/__tests__/questions.integration.test.ts` | Create | DB-level query tests |
| `apps/admin/src/__tests__/questions.integration.test.ts` | Create | API-level integration tests |

## Schema Design

```typescript
// packages/db/src/schema/questions.ts
export const answerTypeEnum = pgEnum('answer_type', [
  'true_false', 'scored', 'multiple_choice', 'photo', 'file'
])

export const questions = pgTable('questions', {
  id:          uuid('id').primaryKey().defaultRandom(),
  tenantId:    uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  surveyId:    uuid('survey_id').notNull().references(() => surveys.id, { onDelete: 'cascade' }),
  text:        text('text').notNull(),
  answerType:  answerTypeEnum('answer_type').notNull(),
  pointValue:  integer('point_value').notNull().default(0),
  isCritical:  boolean('is_critical').notNull().default(false),
  position:    integer('position').notNull().default(0),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

## Queries Design

- `listQuestions(tenantId, surveyId)` → `QuestionRow[]` ordered by `position asc`
- `getQuestion(tenantId, id)` → `QuestionRow | null`
- `createQuestion(tenantId, data)` → `{ question: QuestionRow } | { error: 'survey_not_found' }` — auto-assigns next position (max + 1)
- `updateQuestion(tenantId, id, data)` → `{ question: QuestionRow } | { error: 'not_found' }`
- `deleteQuestion(tenantId, id)` → `{ ok: true } | { error: 'not_found' }` — no re-numbering (gaps are OK; reorder handles cleanup)
- `reorderQuestions(tenantId, surveyId, questionIds)` → `{ ok: true } | { error: 'not_found' | 'invalid_ids' }` — verifies all IDs belong to survey, then updates positions in a transaction

## Execution Order

1. **Schema** → `questions.ts` + `schema/index.ts`
2. **Generate + apply migration** → `pnpm db:generate && pnpm db:migrate`
3. **DB queries** → `questions-queries.ts` + `db/index.ts`
4. **DB integration tests** → `packages/db/src/__tests__/questions.integration.test.ts`
5. **API routes** → 3 new route files under `apps/admin/src/app/api/`
6. **API integration tests** → `apps/admin/src/__tests__/questions.integration.test.ts`

## Verification

```powershell
# After step 2
pnpm db:migrate

# After step 4
pnpm --filter @compliance/db test

# After step 6
pnpm --filter admin test

# Final type check
pnpm tsc --noEmit
```

Manual walkthrough: start `pnpm dev:admin`, log in as admin@demo.com, navigate to a Survey, call each endpoint via curl or a REST client to verify list/create/update/delete/reorder.

## Acceptance Criteria Coverage

| Criterion | Covered by |
|-----------|-----------|
| `questions` table with all columns; RLS applied | Step 1 + 2 |
| Answer type enum includes all 5 types | Step 1 |
| `GET /api/surveys/[id]/questions` ordered by position | Step 5 + 6 |
| `POST /api/surveys/[id]/questions` creates | Step 5 + 6 |
| `PATCH /api/questions/[id]` updates (text, type, value, critical) | Step 5 + 6 |
| `DELETE /api/questions/[id]` deletes | Step 5 + 6 |
| `PATCH /api/surveys/[id]/questions/reorder` accepts position array | Step 5 + 6 |
| All endpoints protected by auth + permission middleware | Step 5 + 6 |
