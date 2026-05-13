Status: ready-for-agent

## What to build

Extend the survey builder so that Scored Questions can have an admin-defined numeric range (min/max). The Inspector enters a value within that range during a Walkthrough; the system maps it proportionally to the Question's Point Value.

## Acceptance criteria

- [ ] `question_scored_config` table (or columns on `questions`) stores min_value and max_value for Scored Questions
- [ ] API for creating/updating a Scored Question accepts and persists min_value and max_value
- [ ] In the survey builder, selecting Scored Answer Type reveals min/max range inputs
- [ ] Validation: min must be less than max; both required for Scored Questions
- [ ] Scoring formula documented in code: `(entered_value - min) / (max - min) * point_value`

## Blocked by

- #19 Question CRUD UI
