## AI Workflow
- you never commit code without being asked.
- you ask me any time you are not 100% clear.
- As you work through specs and tickets, you will update checkboxes to show them as done.
- As each feature is completed, run all static checks and update the checklist. If any checks fail, fix them before proceeding.
- As each ticket is completed, provide testing instructions in the ticket.
- Always use isolation: "worktree" when spawning agents for implementation tasks.

# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.


# Compliance Tracker

A multitenant SaaS platform for managing compliance surveys across regulated industries. Tenants build industry-specific surveys, assign them to their locations, and track certification status. Survey completion must work offline on mobile devices.

## What this system does

- Regulatory bodies (Tenants) configure their account: users, locations, permissions, and industry-specific surveys
- Inspectors complete surveys on-site at Locations; results are scored and reviewed by Tenant Admins during Finalization
- Passing Inspections grant Certification; failing Inspections open a tracked Incident
- Admin UI is web-only; survey completion must work offline on phone/tablet

## Architecture shape

Two distinct surfaces:

**Admin Web App** — tenant management, user/location/permission configuration, survey builder, certification reporting

**Field App** — offline-capable survey completion on mobile/tablet; syncs when connectivity returns

Multi-tenancy: PostgreSQL row-level security per tenant (see ADR-0002)

## Domain language

See [CONTEXT.md](./CONTEXT.md) for the canonical glossary. Use the terms there exactly — don't substitute synonyms.

## Agent guidance

See [AGENTS.md](./AGENTS.md) for rules governing AI agent behavior in this codebase.

## Key constraints

- Survey completion must work fully offline; data syncs when connectivity returns
- The survey builder is a critical path feature — prioritize its UX and correctness
- Multiple regulated industries with different survey structures must coexist within a single tenant
- Some certifications require multiple Inspectors — each completes their own Walkthrough; Certification granted after Finalization
- Permissions use roles-with-overrides (see ADR-0007); permissions are tenant-wide, never scoped to Locations
- Industries served include: Blood Banks, Ambulatory Health Centers, Food Service, Farms (and others)

## Tech stack

- **Admin Web App:** Next.js
- **Field App:** React Native with Expo (iOS + Android, true offline support)
- **Database:** PostgreSQL with row-level tenant isolation
- **Offline sync:** SQLite on device; syncs to server on reconnect. Structured data and attachments sync separately — see ADR-0006
- **Attachment storage:** S3-compatible blob store (separate from the database)
- **Hosting:** AWS or Azure (TBD)

See `docs/adr/` for the reasoning behind the non-obvious stack choices.

## Frontend styling

**Admin Web App:** CSS Modules (Next.js built-in, no additional dependencies). One `.module.css` file per component.

## Open decisions

- [ ] Hosting target: AWS vs Azure
- Survey versioning: Survey is locked while any Inspection against it is in progress (see ADR-0004)
- Offline conflict resolution: in-progress Inspections are locked from Admin edits (see ADR-0005)


## Dev setup

1. `cp .env.example .env`
2. `docker compose up -d` — starts Postgres on localhost:5432
3. `pnpm install`
4. `pnpm db:migrate` — applies migrations
5. `pnpm dev:admin` / `pnpm dev:field` — starts apps

