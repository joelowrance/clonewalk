Status: ready-for-agent

## What to build

Set up the local development environment. Provide a Docker Compose file that starts a PostgreSQL instance with a local dev database. Choose and configure a migrations tool (e.g. Drizzle ORM or raw SQL with a migration runner), wire it into `packages/db`, and ship a first empty migration that confirms the toolchain works end-to-end.

## Acceptance criteria

- [ ] `docker-compose.yml` starts Postgres with a named dev database
- [ ] Migration tool is configured in `packages/db`
- [ ] `db:migrate` script runs from the repo root and applies migrations against the local dev DB
- [ ] First migration runs without error (even if it creates nothing yet)
- [ ] README or CLAUDE.md updated with dev setup instructions

## Blocked by

- #01 Monorepo workspace scaffold
