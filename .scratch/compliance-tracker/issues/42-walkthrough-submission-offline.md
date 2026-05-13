Status: ready-for-agent

## What to build

Allow an Inspector to mark their Walkthrough as complete (submitted) in the Field App. Submission validates that all required Questions (including required Photo/File Questions) are answered, computes the final score, and marks the Walkthrough as submitted in SQLite. The data is queued for server sync in #43.

## Acceptance criteria

- [ ] "Submit Walkthrough" action is available when all required Questions are answered
- [ ] Submitting validates: all visible required Questions answered, all required Photo/File Questions captured
- [ ] Validation errors list the specific unanswered Questions
- [ ] On successful submission, Walkthrough status in SQLite changes to `submitted`
- [ ] Final score and pass/fail status are recorded in SQLite at submission time
- [ ] Submitted Walkthrough is read-only — answers can no longer be changed
- [ ] Submission works fully offline — no network call required

## Blocked by

- #35 Flat Question rendering
- #38 Walkthrough scoring
