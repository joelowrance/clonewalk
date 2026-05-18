---
name: developer
description: Full-cycle developer workflow for the Compliance Tracker project. Given a spec or ticket, generates a plan, reviews it against every acceptance criterion, writes it to disk, then implements using TDD one behavior at a time with a mandatory user-review gate after each passing test. Use when asked to "work on", "implement", or "build" an issue, or when given a spec file or ticket number to build from.
---

# Developer

Two phases: **Plan** then **Implement**. Never write implementation code without an approved plan on disk.

## Phase 1: Plan

### 1. Read inputs
- Issue: `.scratch/compliance-tracker/issues/{N}-{slug}.md`
- Spec: `.scratch/compliance-tracker/issues/{N}-{slug}.spec.md`
- Domain language: `CONTEXT.md`
- Decisions: `docs/adr/` for any area being touched

### 2. Explore the codebase
Launch Explore agents to understand existing patterns in the affected area before designing anything. Look for utilities, query helpers, and component patterns that can be reused.

### 3. Draft the plan
The plan must contain:
- **Context** — why this change is being made and what it unlocks
- **Files to create / modify** — explicit list with what each file does
- **Execution order** — numbered steps with dependencies respected
- **Verification** — exact commands to run tests, type-check, and do a manual walkthrough

### 4. Review plan against the spec
Before writing to disk, check every acceptance criterion in the spec against the plan. Each criterion must map to at least one file or execution step. Extend the plan for any uncovered criterion.

### 5. Write plan to disk
Save to `.scratch/compliance-tracker/issues/{N}-{slug}-plan.md`.

### 6. Get user approval
Present a summary of what the plan covers. Do not write a single line of implementation until the user approves.

---

## Phase 2: Implement

Use the `/tdd` skill. The loop per behavior is strictly:

```
1. Write one test → run suite → confirm RED
2. Write minimal code → run suite → confirm GREEN
3. STOP — show user the passing test
4. Wait for explicit approval before the next behavior
```

### Rules

- **One behavior at a time.** No speculative implementation. No lookahead.
- **Run the suite after every change.** Never claim GREEN without a fresh run.
- **Type-check after each layer** (not after every test): `pnpm tsc --noEmit`
- **Use domain language** from `CONTEXT.md` in test names, variable names, and error messages.
- **Check the relevant ADR** before touching any area it covers.
- **Update the issue checkbox** for each acceptance criterion as it is satisfied.
- **Add testing instructions** to the issue file when the last criterion is checked off.

### After each passing test, show

1. The test name and the behavior it proves
2. Current suite output (pass count, file name)
3. Which plan item was just completed and how many remain

Then stop and wait. Do not proceed until the user responds.

### Layer-boundary checks

Run after completing each major layer (DB helpers, API routes, UI components — not after every single test):

```
pnpm tsc --noEmit
pnpm --filter <package> lint   # if lint is configured
```

Fix all errors before continuing to the next layer.
