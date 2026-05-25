# Plan: Issue #16 — Survey Schema + CRUD API

## Context

A Survey is a **versioned** set of Questions for an Industry within a Tenant. Multiple versions can exist per (tenant, industry) — there is no unique constraint on that pair. The most recently created version is marked `is_current = true` and used for new Inspections. Older versions remain intact so Locations can be grandfathered into the version active when their Inspection was scheduled.

Blocked-by #15 (Industry configuration) is complete. This is the prerequisite for #17 (Survey UI) and #18 (Question schema).

---

## Schema

```typescript
surveys = pgTable('surveys', {
  id:           uuid PK defaultRandom
  tenantId:     uuid FK → tenants (cascade)
  industryId:   uuid FK → industries (cascade)
  name:         text not null
  passingScore: integer not null default 0
  isCurrent:    boolean not null default true
  createdAt:    timestamp with timezone default now
})
// No unique constraint on (tenantId, industryId)
```

**`is_current` invariant:** at most one survey per (tenant, industry) has `isCurrent = true` at any time. Enforced in application logic, not a DB constraint (to allow atomic swaps within a transaction).

---

## Files to create / modify

### `packages/db/`
| Action | File | Purpose |
|--------|------|---------|
| CREATE | `src/schema/surveys.ts` | surveys table as above |
| MODIFY | `src/schema/index.ts` | export surveys |
| AUTO+EDIT | `src/migrations/0007_*.sql` | drizzle-generated; hand-add GRANT, RLS, CREATE POLICY |
| CREATE | `src/surveys-queries.ts` | all query functions |
| MODIFY | `src/index.ts` | export functions and SurveyRow type |

### `apps/admin/`
| Action | File | Purpose |
|--------|------|---------|
| CREATE | `src/app/api/surveys/route.ts` | GET (with optional `?industryId=`), POST |
| CREATE | `src/app/api/surveys/[id]/route.ts` | GET one, PATCH, DELETE |
| CREATE | `src/__tests__/surveys.integration.test.ts` | integration tests |

---

## Query functions

```
listSurveys(tenantId, industryId?: string)
  → SurveyRow[]           ordered by createdAt desc

getSurvey(tenantId, id)
  → SurveyRow | null

createSurvey(tenantId, { name, industryId, passingScore })
  → { survey: SurveyRow } | { error: 'industry_not_found' }
  Side-effect: sets isCurrent=true on new row, isCurrent=false on previous current for same industry (in one transaction)

updateSurvey(tenantId, id, { name?, passingScore? })
  → { survey: SurveyRow } | { error: 'not_found' }

deleteSurvey(tenantId, id)
  → { ok: true } | { error: 'not_found' }
  Side-effect: if deleted survey was isCurrent, promotes the next most recent survey for same industry to isCurrent=true
```

---

## API shape

All routes require `manage:surveys` (already in the permission list).

| Method | Path | Body / Query | Success |
|--------|------|--------------|---------|
| GET | `/api/surveys` | `?industryId=` optional | 200 `{ surveys }` ordered newest-first |
| POST | `/api/surveys` | `{ name, industryId, passingScore }` | 201 `{ survey }` |
| GET | `/api/surveys/[id]` | — | 200 `{ survey }` |
| PATCH | `/api/surveys/[id]` | `{ name?, passingScore? }` | 200 `{ survey }` |
| DELETE | `/api/surveys/[id]` | — | 200 `{ ok: true }` |

Errors: 401 unauthenticated, 403 forbidden, 404 `not_found`, 400 `validation_error`, 404 `industry_not_found`

---

## Execution order

1. `packages/db/schema/surveys.ts` — create schema
2. `packages/db/schema/index.ts` — export it
3. `pnpm --filter @compliance/db generate` → edit generated SQL to add GRANT, RLS enable, CREATE POLICY
4. `pnpm --filter @compliance/db migrate`
5. TDD — `packages/db/src/__tests__/surveys.integration.test.ts` + `surveys-queries.ts`:
   - `listSurveys` returns empty array for fresh tenant
   - `createSurvey` inserts survey with `isCurrent=true`
   - `createSurvey` second version for same industry: new row `isCurrent=true`, previous set `isCurrent=false`
   - `createSurvey` returns `industry_not_found` for unknown industryId
   - `listSurveys` with `industryId` filter returns only that industry's surveys
   - `updateSurvey` updates name and passingScore
   - `deleteSurvey` removes the row; if it was current, promotes next most recent
   - `getSurvey` returns null for unknown id
6. `packages/db/src/index.ts` — export functions + SurveyRow type
7. `pnpm --filter @compliance/db tsc --noEmit`
8. TDD — `apps/admin/src/__tests__/surveys.integration.test.ts` + route files:
   - GET /api/surveys: 401, 403, 200 empty, 200 with surveys, 200 filtered by industryId
   - POST /api/surveys: 401, 400 missing name, 400 missing industryId, 400 invalid passingScore, 404 industry_not_found, 201 created + isCurrent set
   - GET /api/surveys/[id]: 401, 403, 404, 200
   - PATCH /api/surveys/[id]: 401, 404, 400, 200
   - DELETE /api/surveys/[id]: 401, 403, 404, 200 + isCurrent promoted on next
9. `pnpm --filter @compliance/admin tsc --noEmit`

---

## Verification

```bash
$env:DATABASE_URL = "postgresql://compliance:compliance@localhost:5432/compliance_dev"
pnpm --filter @compliance/db tsc --noEmit
pnpm --filter @compliance/db test
pnpm --filter @compliance/admin tsc --noEmit
pnpm --filter @compliance/admin test
```

---

## Acceptance criteria coverage

| Criterion | Covered by |
|-----------|------------|
| `surveys` table with all columns incl. `is_current`, RLS | Steps 1–4 |
| Multiple surveys per industry per tenant (no unique constraint) | Schema design + step 5 (createSurvey second version test) |
| `is_current` managed on create and delete | Steps 5–6 (createSurvey + deleteSurvey side-effects) |
| `GET /api/surveys` with optional `?industryId=` filter | Step 8 |
| `GET /api/surveys/[id]` | Step 8 |
| `POST /api/surveys` creates new version, sets as current | Step 8 |
| `PATCH /api/surveys/[id]` updates name or passingScore | Step 8 |
| `DELETE /api/surveys/[id]` with current promotion | Step 8 |
| All endpoints auth/permission protected | All route files use guard pattern |
