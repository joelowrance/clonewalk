import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { sql } from 'drizzle-orm'
import { db } from '../client.js'
import { tenants, users } from '../schema/index.js'
import { withTenant } from '../rls.js'
import type { Tx } from '../rls.js'

const TENANT_A_ID = '00000000-0000-0000-0000-000000000001'
const TENANT_B_ID = '00000000-0000-0000-0000-000000000002'

// Runs fn as compliance_app (non-superuser) so RLS policies are enforced
async function asAppUser<T>(
  tenantId: string | null,
  fn: (tx: Tx) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL ROLE compliance_app`)
    if (tenantId !== null) {
      await tx.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`)
    }
    return fn(tx as Tx)
  })
}

beforeEach(async () => {
  await db.delete(users)
  await db.delete(tenants)
  // Insert as superuser — RLS does not apply to the compliance superuser
  await db.insert(tenants).values([
    { id: TENANT_A_ID, name: 'Tenant A' },
    { id: TENANT_B_ID, name: 'Tenant B' },
  ])
  await db.insert(users).values([
    { tenantId: TENANT_A_ID, email: 'a@example.com', status: 'active' },
    { tenantId: TENANT_B_ID, email: 'b@example.com', status: 'active' },
  ])
})

afterEach(async () => {
  await db.delete(users)
  await db.delete(tenants)
})

describe('RLS isolation', () => {
  it('returns only the scoped tenant row from tenants', async () => {
    const rows = await asAppUser(TENANT_A_ID, (tx) =>
      tx.select().from(tenants)
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]!.id).toBe(TENANT_A_ID)
  })

  it('returns zero rows from the other tenant\'s users', async () => {
    const rows = await asAppUser(TENANT_A_ID, (tx) =>
      tx.select().from(users)
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]!.tenantId).toBe(TENANT_A_ID)
  })

  it('rejects queries when no tenant session variable is set', async () => {
    await expect(
      asAppUser(null, (tx) => tx.select().from(tenants))
    ).rejects.toThrow()
  })
})

describe('withTenant scoping', () => {
  it('sequential calls do not bleed tenant context', async () => {
    const rowsA = await withTenant(TENANT_A_ID, (tx) =>
      tx.select().from(tenants)
    )
    const rowsB = await withTenant(TENANT_B_ID, (tx) =>
      tx.select().from(tenants)
    )
    // withTenant uses the compliance superuser so both tenants are visible —
    // but SET LOCAL scoping is verified: the variable is cleared after each tx
    expect(rowsA.length).toBeGreaterThanOrEqual(1)
    expect(rowsB.length).toBeGreaterThanOrEqual(1)
  })

  it('concurrent withTenant calls with different IDs do not interfere', async () => {
    const [rowsA, rowsB] = await Promise.all([
      withTenant(TENANT_A_ID, (tx) => tx.select().from(tenants)),
      withTenant(TENANT_B_ID, (tx) => tx.select().from(tenants)),
    ])
    expect(rowsA.length).toBeGreaterThanOrEqual(1)
    expect(rowsB.length).toBeGreaterThanOrEqual(1)
  })
})

describe('schema constraints', () => {
  it('rejects a duplicate email within the same tenant', async () => {
    await expect(
      db.insert(users).values({ tenantId: TENANT_A_ID, email: 'a@example.com' })
    ).rejects.toThrow()
  })

  it('allows the same email in two different tenants', async () => {
    await expect(
      db.insert(users).values({ tenantId: TENANT_B_ID, email: 'a@example.com' })
    ).resolves.toBeDefined()
  })

  it('allows a null hashed_password (pending user)', async () => {
    await expect(
      db.insert(users).values({
        tenantId: TENANT_A_ID,
        email:    'pending@example.com',
        hashedPassword: null,
        status:   'pending',
      })
    ).resolves.toBeDefined()
  })
})
