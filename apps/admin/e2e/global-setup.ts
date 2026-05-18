import { db, schema } from '@compliance/db'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcrypt'

export const E2E_USER_EMAIL    = 'e2e@example.com'
export const E2E_USER_PASSWORD = 'TestPassword1!'

const E2E_TENANT_ID = 'e2e00000-0000-0000-0000-000000000001'
const E2E_USER_ID   = 'e2e00000-0000-0000-0000-000000000002'
const E2E_ROLE_ID   = 'e2e00000-0000-0000-0000-000000000003'

export const E2E_TARGET_USER_EMAIL = 'e2e-target@example.com'
const E2E_TARGET_USER_ID = 'e2e00000-0000-0000-0000-000000000004'

export default async function globalSetup() {
  const hashedPassword = await bcrypt.hash(E2E_USER_PASSWORD, 12)

  // Clean up any leftover E2E data, then re-seed
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, E2E_USER_ID))
  await db.delete(schema.userRoleAssignments).where(eq(schema.userRoleAssignments.userId, E2E_USER_ID))
  await db.delete(schema.users).where(eq(schema.users.id, E2E_TARGET_USER_ID))
  await db.delete(schema.users).where(eq(schema.users.id, E2E_USER_ID))
  await db.delete(schema.rolePermissions).where(eq(schema.rolePermissions.roleId, E2E_ROLE_ID))
  await db.delete(schema.roles).where(eq(schema.roles.id, E2E_ROLE_ID))

  await db.insert(schema.tenants).values({ id: E2E_TENANT_ID, name: 'E2E Tenant' }).onConflictDoNothing()
  await db.insert(schema.roles).values({ id: E2E_ROLE_ID, tenantId: E2E_TENANT_ID, name: 'E2E Admin' }).onConflictDoNothing()
  await db.insert(schema.rolePermissions).values({ roleId: E2E_ROLE_ID, permission: 'manage:users' }).onConflictDoNothing()

  await db.insert(schema.users).values({
    id:             E2E_USER_ID,
    tenantId:       E2E_TENANT_ID,
    email:          E2E_USER_EMAIL,
    hashedPassword,
    status:         'active',
  })
  await db.insert(schema.users).values({
    id:             E2E_TARGET_USER_ID,
    tenantId:       E2E_TENANT_ID,
    email:          E2E_TARGET_USER_EMAIL,
    hashedPassword: await bcrypt.hash(E2E_USER_PASSWORD, 12),
    status:         'active',
  })
  await db.insert(schema.userRoleAssignments).values({ userId: E2E_USER_ID, roleId: E2E_ROLE_ID })
}
