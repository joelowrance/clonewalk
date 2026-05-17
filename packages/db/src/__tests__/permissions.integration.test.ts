import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { sql } from 'drizzle-orm'
import { db } from '../client.js'
import { tenants, users, roles, rolePermissions, userRoleAssignments, userPermissionOverrides } from '../schema/index.js'
import { resolvePermissions } from '../permissions.js'
import { withTenant } from '../rls.js'
import type { Tx } from '../rls.js'

const TENANT_A_ID = '00000000-0000-0000-0001-000000000001'
const TENANT_B_ID = '00000000-0000-0000-0001-000000000002'
const USER_A_ID   = '00000000-0000-0000-0001-000000000010'
const USER_B_ID   = '00000000-0000-0000-0001-000000000011'
const ROLE_1_ID   = '00000000-0000-0000-0001-000000000020'
const ROLE_2_ID   = '00000000-0000-0000-0001-000000000021'

async function asAppUser<T>(tenantId: string | null, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL ROLE compliance_app`)
    if (tenantId !== null) {
      await tx.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`)
    }
    return fn(tx as Tx)
  })
}

beforeEach(async () => {
  await db.delete(userPermissionOverrides)
  await db.delete(userRoleAssignments)
  await db.delete(rolePermissions)
  await db.delete(roles)
  await db.delete(users)
  await db.delete(tenants)

  await db.insert(tenants).values([
    { id: TENANT_A_ID, name: 'Tenant A' },
    { id: TENANT_B_ID, name: 'Tenant B' },
  ])
  await db.insert(users).values([
    { id: USER_A_ID, tenantId: TENANT_A_ID, email: 'a@example.com', status: 'active' },
    { id: USER_B_ID, tenantId: TENANT_B_ID, email: 'b@example.com', status: 'active' },
  ])
})

afterEach(async () => {
  await db.delete(userPermissionOverrides)
  await db.delete(userRoleAssignments)
  await db.delete(rolePermissions)
  await db.delete(roles)
  await db.delete(users)
  await db.delete(tenants)
})

describe('resolvePermissions', () => {
  it('returns empty set for user with no roles and no overrides', async () => {
    const perms = await resolvePermissions(USER_A_ID)
    expect(perms.size).toBe(0)
  })

  it('returns role permissions for user with one role', async () => {
    await db.insert(roles).values({ id: ROLE_1_ID, tenantId: TENANT_A_ID, name: 'Admin' })
    await db.insert(rolePermissions).values([
      { roleId: ROLE_1_ID, permission: 'manage:users' },
      { roleId: ROLE_1_ID, permission: 'manage:locations' },
    ])
    await db.insert(userRoleAssignments).values({ userId: USER_A_ID, roleId: ROLE_1_ID })

    const perms = await resolvePermissions(USER_A_ID)
    expect(perms).toEqual(new Set(['manage:users', 'manage:locations']))
  })

  it('unions permissions across multiple roles without duplicates', async () => {
    await db.insert(roles).values([
      { id: ROLE_1_ID, tenantId: TENANT_A_ID, name: 'Role 1' },
      { id: ROLE_2_ID, tenantId: TENANT_A_ID, name: 'Role 2' },
    ])
    await db.insert(rolePermissions).values([
      { roleId: ROLE_1_ID, permission: 'manage:users' },
      { roleId: ROLE_1_ID, permission: 'manage:locations' },
      { roleId: ROLE_2_ID, permission: 'manage:locations' },
      { roleId: ROLE_2_ID, permission: 'manage:surveys' },
    ])
    await db.insert(userRoleAssignments).values([
      { userId: USER_A_ID, roleId: ROLE_1_ID },
      { userId: USER_A_ID, roleId: ROLE_2_ID },
    ])

    const perms = await resolvePermissions(USER_A_ID)
    expect(perms).toEqual(new Set(['manage:users', 'manage:locations', 'manage:surveys']))
  })

  it('override revoking a role permission removes it', async () => {
    await db.insert(roles).values({ id: ROLE_1_ID, tenantId: TENANT_A_ID, name: 'Admin' })
    await db.insert(rolePermissions).values({ roleId: ROLE_1_ID, permission: 'manage:users' })
    await db.insert(userRoleAssignments).values({ userId: USER_A_ID, roleId: ROLE_1_ID })
    await db.insert(userPermissionOverrides).values({ userId: USER_A_ID, permission: 'manage:users', granted: false })

    const perms = await resolvePermissions(USER_A_ID)
    expect(perms.size).toBe(0)
  })

  it('override granting a permission with no roles works', async () => {
    await db.insert(userPermissionOverrides).values({ userId: USER_A_ID, permission: 'manage:users', granted: true })

    const perms = await resolvePermissions(USER_A_ID)
    expect(perms).toEqual(new Set(['manage:users']))
  })

  it('override grants an additional permission on top of role', async () => {
    await db.insert(roles).values({ id: ROLE_1_ID, tenantId: TENANT_A_ID, name: 'Admin' })
    await db.insert(rolePermissions).values({ roleId: ROLE_1_ID, permission: 'manage:users' })
    await db.insert(userRoleAssignments).values({ userId: USER_A_ID, roleId: ROLE_1_ID })
    await db.insert(userPermissionOverrides).values({ userId: USER_A_ID, permission: 'manage:locations', granted: true })

    const perms = await resolvePermissions(USER_A_ID)
    expect(perms).toEqual(new Set(['manage:users', 'manage:locations']))
  })

  it('override revoking a permission not in role is a no-op', async () => {
    await db.insert(roles).values({ id: ROLE_1_ID, tenantId: TENANT_A_ID, name: 'Admin' })
    await db.insert(rolePermissions).values({ roleId: ROLE_1_ID, permission: 'manage:users' })
    await db.insert(userRoleAssignments).values({ userId: USER_A_ID, roleId: ROLE_1_ID })
    await db.insert(userPermissionOverrides).values({ userId: USER_A_ID, permission: 'manage:locations', granted: false })

    const perms = await resolvePermissions(USER_A_ID)
    expect(perms).toEqual(new Set(['manage:users']))
  })
})

describe('RLS isolation', () => {
  it('roles are not visible outside the scoped tenant', async () => {
    await db.insert(roles).values({ id: ROLE_1_ID, tenantId: TENANT_A_ID, name: 'Admin' })

    const rowsA = await asAppUser(TENANT_A_ID, (tx) => tx.select().from(roles))
    const rowsB = await asAppUser(TENANT_B_ID, (tx) => tx.select().from(roles))

    expect(rowsA).toHaveLength(1)
    expect(rowsB).toHaveLength(0)
  })

  it('deleting a role cascades to role_permissions and user_role_assignments', async () => {
    await db.insert(roles).values({ id: ROLE_1_ID, tenantId: TENANT_A_ID, name: 'Admin' })
    await db.insert(rolePermissions).values({ roleId: ROLE_1_ID, permission: 'manage:users' })
    await db.insert(userRoleAssignments).values({ userId: USER_A_ID, roleId: ROLE_1_ID })

    await db.delete(roles)

    const perms = await db.select().from(rolePermissions)
    const assignments = await db.select().from(userRoleAssignments)
    expect(perms).toHaveLength(0)
    expect(assignments).toHaveLength(0)
  })

  it('deleting a user cascades to user_role_assignments and user_permission_overrides', async () => {
    await db.insert(roles).values({ id: ROLE_1_ID, tenantId: TENANT_A_ID, name: 'Admin' })
    await db.insert(userRoleAssignments).values({ userId: USER_A_ID, roleId: ROLE_1_ID })
    await db.insert(userPermissionOverrides).values({ userId: USER_A_ID, permission: 'manage:users', granted: true })

    await db.delete(users).where(sql`id = ${USER_A_ID}::uuid`)

    const assignments = await db.select().from(userRoleAssignments)
    const overrides = await db.select().from(userPermissionOverrides)
    expect(assignments).toHaveLength(0)
    expect(overrides).toHaveLength(0)
  })
})
