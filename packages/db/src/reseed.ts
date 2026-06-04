import { config } from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

config({ path: resolve(fileURLToPath(import.meta.url), '../../../..', '.env') })

const { db }    = await import('./client.js')
const schema    = await import('./schema/index.js')

// Delete in leaf-first order to respect FK constraints
await db.delete(schema.questionOptions)
await db.delete(schema.questions)
await db.delete(schema.surveys)
await db.delete(schema.tenantIndustries)
await db.delete(schema.inviteTokens)
await db.delete(schema.userPermissionOverrides)
await db.delete(schema.userRoleAssignments)
await db.delete(schema.rolePermissions)
await db.delete(schema.sessions)
await db.delete(schema.locations)
await db.delete(schema.roles)
await db.delete(schema.users)
await db.delete(schema.industries)
await db.delete(schema.tenants)

console.log('Cleared all data.')

const TENANT_ID    = 'd0000000-0000-0000-0000-000000000001'
const USER_ID      = 'd0000000-0000-0000-0000-000000000002'
const ROLE_ID      = 'd0000000-0000-0000-0000-000000000003'
const INDUSTRY_IDS = {
  bloodBank:        'd0000000-0000-0000-0000-000000000010',
  ambulatory:       'd0000000-0000-0000-0000-000000000011',
  foodService:      'd0000000-0000-0000-0000-000000000012',
  farms:            'd0000000-0000-0000-0000-000000000013',
}

// bcrypt hash of "admin" with cost 12
const HASHED_PW = '$2b$12$oG8Wut.tCu73YPjkGTTwK.yxvHRv2B4i3m6D.4/2dSOwBMi/ACEVi'

await db.insert(schema.industries).values([
  { id: INDUSTRY_IDS.bloodBank,   name: 'Blood Bank' },
  { id: INDUSTRY_IDS.ambulatory,  name: 'Ambulatory Health Center' },
  { id: INDUSTRY_IDS.foodService, name: 'Food Service' },
  { id: INDUSTRY_IDS.farms,       name: 'Farm' },
])

await db.insert(schema.tenants)
  .values({ id: TENANT_ID, name: 'Demo Tenant' })

await db.insert(schema.users)
  .values({ id: USER_ID, tenantId: TENANT_ID, email: 'admin@demo.com', hashedPassword: HASHED_PW, status: 'active' })

await db.insert(schema.roles)
  .values({ id: ROLE_ID, tenantId: TENANT_ID, name: 'Admin' })

await db.insert(schema.rolePermissions)
  .values([
    { roleId: ROLE_ID, permission: 'manage:users' },
    { roleId: ROLE_ID, permission: 'manage:locations' },
    { roleId: ROLE_ID, permission: 'manage:industries' },
    { roleId: ROLE_ID, permission: 'manage:surveys' },
    { roleId: ROLE_ID, permission: 'manage:inspections' },
    { roleId: ROLE_ID, permission: 'finalize:inspections' },
    { roleId: ROLE_ID, permission: 'manage:incidents' },
    { roleId: ROLE_ID, permission: 'conduct:walkthroughs' },
  ])

await db.insert(schema.userRoleAssignments)
  .values({ userId: USER_ID, roleId: ROLE_ID })

await db.insert(schema.tenantIndustries).values(
  Object.values(INDUSTRY_IDS).map(industryId => ({ tenantId: TENANT_ID, industryId }))
)

console.log('Seeded: admin@demo.com / admin (4 industries)')
process.exit(0)
