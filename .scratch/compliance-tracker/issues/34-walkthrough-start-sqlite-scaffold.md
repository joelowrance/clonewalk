Status: ready-for-agent

## What to build

Allow an Inspector to start a Walkthrough from an Inspection. Creates a Walkthrough record in local SQLite and navigates to the question flow. This is the persistence scaffold — actual Question rendering comes in #35.

## Acceptance criteria

- [ ] `walkthroughs` table in SQLite stores id, inspection_id, inspector_id, status (in_progress / submitted), started_at, submitted_at
- [ ] `walkthrough_answers` table stores question_id, answer_value, answered_at
- [ ] Tapping "Start Walkthrough" on the Inspection detail screen creates a new Walkthrough record in SQLite
- [ ] If a Walkthrough already exists for this Inspector + Inspection, the existing one is resumed
- [ ] Navigation lands on a placeholder "questions" screen (populated in #35)
- [ ] Walkthrough record survives app restart — reopening the Inspection resumes correctly

## Blocked by

- #33 Inspection list screen (Field App)
