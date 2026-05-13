# Spec: Dev Environment Bootstrap

## Docker Compose

File: `docker-compose.yml` at repo root.

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: compliance
      POSTGRES_PASSWORD: compliance
      POSTGRES_DB: compliance_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Environment variables

File: `.env.example` (checked in). Actual `.env` is gitignored.

```env
DATABASE_URL=postgresql://compliance:compliance@localhost:5432/compliance_dev
```

`packages/db` reads `DATABASE_URL` from `process.env`. Throws a clear error at startup if unset.

## Migration tool: Drizzle ORM

Package: `drizzle-orm`, `drizzle-kit` in `packages/db`.

```
packages/db/
├── src/
│   ├── schema/         # One file per domain entity (tenants.ts, users.ts, …)
│   ├── migrations/     # Generated SQL migration files
│   ├── client.ts       # Drizzle client singleton
│   └── index.ts        # Re-exports schema types and client
├── drizzle.config.ts
└── package.json
```

```typescript
// packages/db/drizzle.config.ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/schema/*',
  out: './src/migrations',
  driver: 'pg',
  dbCredentials: { connectionString: process.env.DATABASE_URL! },
} satisfies Config
```

```typescript
// packages/db/src/client.ts
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
export const db = drizzle(pool, { schema })
```

## Root scripts

```jsonc
{
  "scripts": {
    "db:migrate": "pnpm --filter @compliance/db migrate",
    "db:generate": "pnpm --filter @compliance/db generate",
    "db:studio": "pnpm --filter @compliance/db studio"
  }
}
```

```jsonc
// packages/db/package.json scripts
{
  "migrate": "drizzle-kit migrate",
  "generate": "drizzle-kit generate",
  "studio": "drizzle-kit studio"
}
```

## Tests

**Integration (Vitest + real DB):**
- `db:migrate` runs to completion on a clean database with zero errors
- Running `db:migrate` a second time is idempotent (no errors, no duplicate migrations)
- `db` client connects successfully and can execute a simple `SELECT 1` query
- Missing `DATABASE_URL` throws a clear startup error (not a cryptic postgres connection error)

**CI:**
- Migration test runs in CI against a Postgres service container (GitHub Actions `services:`)

## Key behaviors & edge cases

- Running `db:migrate` against a fresh DB (no tables yet) must complete without error
- Migration files are committed to the repo — never regenerated destructively
- `packages/db/src/client.ts` exports a single shared pool; apps do not create their own `pg` connections
