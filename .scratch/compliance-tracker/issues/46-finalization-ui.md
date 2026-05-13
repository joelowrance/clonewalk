Status: ready-for-agent

## What to build

Build the Finalization UI in the Admin Web App. After reviewing Walkthroughs, a Tenant Admin can formally finalize an Inspection — setting the Certification expiry date on a pass, or confirming the Incident on a fail.

## Acceptance criteria

- [ ] From the Inspection detail page, a "Finalize" action is available when all required Walkthroughs are submitted
- [ ] Finalization screen shows the aggregate outcome (pass/fail) based on all Walkthrough scores
- [ ] On pass: Admin must set a Certification expiry date before confirming
- [ ] On fail: Admin sees the failed Walkthrough(s) and confirms opening an Incident
- [ ] Confirming finalizes the Inspection, creates the Certification or Incident, and redirects to the Inspection detail showing finalized status
- [ ] A finalized Inspection cannot be re-finalized — the Finalize action is hidden/disabled

## Blocked by

- #45 Walkthrough review UI
