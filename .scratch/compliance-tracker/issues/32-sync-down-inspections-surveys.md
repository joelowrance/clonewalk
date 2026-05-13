Status: ready-for-agent

## What to build

On login or when connectivity is restored, sync the Inspector's assigned Inspections and the full Survey data (Questions, options, branch rules) down to the device's SQLite database. After sync, all data needed to complete a Walkthrough is available offline.

## Acceptance criteria

- [ ] SQLite schema on device mirrors the server schema for: Inspections, Surveys, Questions, question options, branch rules, and inspection assignments
- [ ] On login (and on reconnect), the Field App fetches the Inspector's assigned Inspections and related Survey data from the API
- [ ] Data is upserted into SQLite — subsequent syncs are incremental, not full re-downloads
- [ ] The app functions fully offline after the initial sync (no network calls during Walkthrough)
- [ ] Sync status is visible to the Inspector (e.g. "Last synced: 5 min ago")
- [ ] Sync errors are surfaced with a retry option

## Blocked by

- #27 Inspector assignment
- #31 Field App authentication
