Status: ready-for-agent

## What to build

Apply Branching Logic during Walkthrough rendering in the Field App. Questions show or hide dynamically based on the Inspector's current answers, using the branch rules synced to SQLite.

## Acceptance criteria

- [ ] Questions with branch rules are hidden by default if their trigger condition is not met
- [ ] Changing an answer that has branch rules immediately shows or hides the target Questions
- [ ] Multi-level branching works: a revealed Question may itself reveal further Questions
- [ ] Hidden Questions are excluded from scoring and not required for submission
- [ ] If an answer that revealed Questions is changed to no longer trigger the branch, the previously revealed Questions are hidden and their answers cleared
- [ ] Branch logic is evaluated purely from local SQLite data — no network required

## Blocked by

- #23 Branching Logic schema + API
- #35 Flat Question rendering
