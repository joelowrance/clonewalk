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

  // Clean up all E2E tenant data, then re-seed
  await db.delete(schema.surveys).where(eq(schema.surveys.tenantId, E2E_TENANT_ID))
  await db.delete(schema.tenantIndustries).where(eq(schema.tenantIndustries.tenantId, E2E_TENANT_ID))
  await db.delete(schema.sessions).where(eq(schema.sessions.tenantId, E2E_TENANT_ID))
  await db.delete(schema.userPermissionOverrides).where(eq(schema.userPermissionOverrides.userId, E2E_TARGET_USER_ID))
  await db.delete(schema.userRoleAssignments).where(eq(schema.userRoleAssignments.userId, E2E_USER_ID))
  await db.delete(schema.userRoleAssignments).where(eq(schema.userRoleAssignments.userId, E2E_TARGET_USER_ID))
  await db.delete(schema.users).where(eq(schema.users.id, E2E_TARGET_USER_ID))
  await db.delete(schema.users).where(eq(schema.users.id, E2E_USER_ID))
  await db.delete(schema.rolePermissions).where(eq(schema.rolePermissions.roleId, E2E_ROLE_ID))
  await db.delete(schema.locations).where(eq(schema.locations.tenantId, E2E_TENANT_ID))
  // Delete all roles for this tenant (including test-created ones like "Inspector")
  await db.delete(schema.roles).where(eq(schema.roles.tenantId, E2E_TENANT_ID))

  await db.insert(schema.tenants).values({ id: E2E_TENANT_ID, name: 'E2E Tenant' }).onConflictDoNothing()
  await db.insert(schema.roles).values({ id: E2E_ROLE_ID, tenantId: E2E_TENANT_ID, name: 'E2E Admin' })
  await db.insert(schema.rolePermissions).values({ roleId: E2E_ROLE_ID, permission: 'manage:users' })
  await db.insert(schema.rolePermissions).values({ roleId: E2E_ROLE_ID, permission: 'manage:locations' })
  await db.insert(schema.rolePermissions).values({ roleId: E2E_ROLE_ID, permission: 'manage:surveys' })

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
