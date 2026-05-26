import { config } from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { eq } from 'drizzle-orm'

config({ path: resolve(fileURLToPath(import.meta.url), '../../../..', '.env') })

const { db }    = await import('./client.js')
const schema    = await import('./schema/index.js')

const TENANT_ID = 'd0000000-0000-0000-0000-000000000001'
const USER_ID   = 'd0000000-0000-0000-0000-000000000002'
const ROLE_ID   = 'd0000000-0000-0000-0000-000000000003'

// bcrypt hash of "admin" with cost 12
const HASHED_PW = '$2b$12$oG8Wut.tCu73YPjkGTTwK.yxvHRv2B4i3m6D.4/2dSOwBMi/ACEVi'

// Wipe demo data in dependency order
await db.delete(schema.surveys).where(eq(schema.surveys.tenantId, TENANT_ID))
await db.delete(schema.tenantIndustries).where(eq(schema.tenantIndustries.tenantId, TENANT_ID))
await db.delete(schema.sessions).where(eq(schema.sessions.tenantId, TENANT_ID))
await db.delete(schema.userPermissionOverrides).where(eq(schema.userPermissionOverrides.userId, USER_ID))
await db.delete(schema.userRoleAssignments).where(eq(schema.userRoleAssignments.userId, USER_ID))
await db.delete(schema.rolePermissions).where(eq(schema.rolePermissions.roleId, ROLE_ID))
await db.delete(schema.roles).where(eq(schema.roles.id, ROLE_ID))
await db.delete(schema.users).where(eq(schema.users.id, USER_ID))
await db.delete(schema.tenants).where(eq(schema.tenants.id, TENANT_ID))

// Re-seed
await db.insert(schema.tenants).values({ id: TENANT_ID, name: 'Demo Tenant' })
await db.insert(schema.users).values({ id: USER_ID, tenantId: TENANT_ID, email: 'admin@demo.com', hashedPassword: HASHED_PW, status: 'active' })
await db.insert(schema.roles).values({ id: ROLE_ID, tenantId: TENANT_ID, name: 'Admin' })
await db.insert(schema.rolePermissions).values([
  { roleId: ROLE_ID, permission: 'manage:users' },
  { roleId: ROLE_ID, permission: 'manage:locations' },
  { roleId: ROLE_ID, permission: 'manage:industries' },
  { roleId: ROLE_ID, permission: 'manage:surveys' },
  { roleId: ROLE_ID, permission: 'manage:inspections' },
  { roleId: ROLE_ID, permission: 'finalize:inspections' },
  { roleId: ROLE_ID, permission: 'manage:incidents' },
  { roleId: ROLE_ID, permission: 'conduct:walkthroughs' },
])
await db.insert(schema.userRoleAssignments).values({ userId: USER_ID, roleId: ROLE_ID })

console.log('Done: admin@demo.com / admin')
process.exit(0)
