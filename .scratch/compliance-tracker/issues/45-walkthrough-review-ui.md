Status: ready-for-agent

## What to build

Build the Walkthrough review screen in the Admin Web App. A Tenant Admin can view a completed Walkthrough in full — all Questions, the Inspector's answers, scores per Question, total score, and Critical failure flags — before finalizing the Inspection.

## Acceptance criteria

- [ ] From `/inspections/[id]`, Admin can navigate to a Walkthrough review for each submitted Walkthrough
- [ ] Review screen shows all Questions in survey order with the Inspector's answer and points earned per Question
- [ ] Total score and maximum possible score are shown
- [ ] Critical Questions answered unfavorably are visually flagged
- [ ] Pass/fail determination (based on passing score) is shown clearly
- [ ] Photo and File answers show thumbnails or download links
- [ ] Read-only — no editing of answers from this screen

## Blocked by

- #28 Inspection list + detail UI
- #43 Sync-up: structured Walkthrough data
- #44 Finalization schema + API
