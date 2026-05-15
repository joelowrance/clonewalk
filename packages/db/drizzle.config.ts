import type { Config } from 'drizzle-kit'

export default {
  dialect: 'postgresql',
  schema: './src/schema/*',
  out: './src/migrations',
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config
