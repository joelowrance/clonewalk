Status: ready-for-agent

## What to build

Sync completed Walkthrough data (answers, scores, pass/fail) from the device SQLite database to the server when connectivity is restored. This is the write path of the sync loop. Conflict resolution follows the strategy decided in #30.

## Acceptance criteria

- [ ] On reconnect, the app identifies submitted Walkthroughs in SQLite that have not yet been synced to the server
- [ ] Each unsynced Walkthrough is sent to `POST /api/walkthroughs/sync` (or equivalent) with all answers and computed score
- [ ] The server creates or updates the Walkthrough record, applying the conflict resolution strategy from ADR-0008
- [ ] Successfully synced Walkthroughs are marked as synced in SQLite
- [ ] Sync failures are logged and retried on next reconnect
- [ ] Sync status is visible to the Inspector (e.g. "Synced", "Pending sync", "Sync failed")

## Blocked by

- #30 Offline conflict resolution strategy (ADR-0008 must be written)
- #42 Walkthrough submission (offline)
