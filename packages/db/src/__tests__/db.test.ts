import { describe, it, expect, vi } from 'vitest'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { sql } from 'drizzle-orm'

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

function runMigrate() {
  return spawnSync('pnpm', ['migrate'], {
    cwd: pkgRoot,
    env: process.env,
    encoding: 'utf8',
    shell: true,
  })
}

describe('migrations', () => {
  it('applies migrations on a clean database without error', () => {
    const result = runMigrate()
    expect(result.status, result.stderr).toBe(0)
  })

  it('is idempotent — running migrate twice exits cleanly', () => {
    const result = runMigrate()
    expect(result.status, result.stderr).toBe(0)
  })
})

describe('db client', () => {
  it('connects and executes a simple query', async () => {
    const { db } = await import('../client.js')
    const result = await db.execute(sql`SELECT 1 AS one`)
    expect(result[0]).toMatchObject({ one: 1 })
  })

  it('throws "DATABASE_URL is not set" when env var is missing', async () => {
    const saved = process.env.DATABASE_URL
    delete process.env.DATABASE_URL
    vi.resetModules()
    try {
      await expect(import('../client.js')).rejects.toThrow('DATABASE_URL is not set')
    } finally {
      process.env.DATABASE_URL = saved
      vi.resetModules()
    }
  })
})
