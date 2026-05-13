# Agent Guidelines

This file contains guidance for AI agents working in this codebase.

## Project context

Read [CLAUDE.md](./CLAUDE.md) for the project overview, architecture shape, and open decisions.
Read [CONTEXT.md](./CONTEXT.md) for the canonical domain glossary — use those terms exactly.

## Domain rules

- Always use the terms defined in CONTEXT.md. Do not substitute synonyms (e.g., use "Location" not "site" or "facility").
- When a term is ambiguous or missing from CONTEXT.md, flag it before proceeding — do not invent terminology.
- Flagged ambiguities in CONTEXT.md are unresolved decisions. Do not resolve them unilaterally — surface them to the user.

## Architecture rules

- The Admin Web App and the Field App are distinct surfaces. Do not couple their concerns.
- The Field App must support full offline operation. Any feature that touches survey completion must account for offline-first behavior and sync on reconnect.
- Multi-tenancy isolation is not yet decided. Do not assume a data model — treat tenant boundaries as a strict constraint in all data access code.
- The survey builder is critical path. Changes to survey structure (Questions, Branching Logic, nesting) require extra care.

## Open decisions (do not assume)

The following are unresolved — do not make assumptions about them:

- Tech stack (web framework, mobile approach)
- Multi-tenancy data isolation model
- Offline sync and conflict resolution strategy
- Grading model (per-question, per-survey, or both)
- Multi-certifier sign-off flow (concurrent vs sequential)
- Survey versioning behavior
- Certification expiry and renewal

## When exploring the codebase

- Prefer reading existing patterns before introducing new ones
- If you find code that contradicts CONTEXT.md or CLAUDE.md, surface the conflict rather than silently resolving it
