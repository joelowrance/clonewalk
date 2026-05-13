Status: ready-for-human

## What to build

Decide the offline conflict resolution strategy before the sync-up layer (#43) is built. ADR-0003 explicitly flags this as unresolved. This is a HITL decision slice — no code is produced, but the outcome must be documented in a new ADR before #43 can proceed.

The core question: if the same Walkthrough is modified on multiple devices (e.g. an Inspector logs in on a new phone mid-inspection), how does the system resolve the conflict on sync?

Options to evaluate:
- **Last-write-wins** — simplest; acceptable if Walkthroughs are always single-device
- **Server-authoritative with client rejection** — server rejects a sync if a newer version exists; Inspector must re-sync before submitting
- **Operational transform / CRDT** — most complex; needed only if concurrent multi-device editing is a real scenario

## Acceptance criteria

- [ ] Decision discussed and reached with the Tenant Admin / product owner
- [ ] A new ADR (`docs/adr/0008-offline-conflict-resolution.md`) documents the chosen strategy and the rejected alternatives
- [ ] #43 is unblocked

## Blocked by

None — can start immediately.
