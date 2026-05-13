Status: ready-for-agent

## What to build

Compute the Walkthrough score locally on device as the Inspector answers Questions. Show a running score and flag Critical Question failures immediately. This scoring is computed from SQLite data with no network required.

## Acceptance criteria

- [ ] Score is computed after each answer change: sum of points earned across all visible, answered Questions
- [ ] True/False: full Point Value on favorable answer, zero on unfavorable
- [ ] Scored: `(entered - min) / (max - min) * point_value` (formula from #21)
- [ ] Multiple Choice: point value of the selected option
- [ ] Photo and File Questions do not contribute to score
- [ ] A Critical Question answered unfavorably flags the Walkthrough as failing regardless of total score
- [ ] A running score summary (e.g. "42 / 100") is visible on the Walkthrough screen
- [ ] Critical failure state is visually prominent

## Blocked by

- #35 Flat Question rendering
