import { config } from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import type { Config } from 'drizzle-kit'

config({ path: resolve(fileURLToPath(import.meta.url), '../../..', '.env') })

export default {
  dialect: 'postgresql',
  schema: './src/schema/*',
  out: './src/migrations',
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config
