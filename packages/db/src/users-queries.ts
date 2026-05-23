import { eq, inArray } from 'drizzle-orm'
import { withTenant } from './rls'
import { users, roles, rolePermissions, userRoleAssignments, userPermissionOverrides } from './schema/index'

export interface UserWithRoles {
  id:     string
  email:  string
  status: 'active' | 'pending'
  roles:  Array<{ id: string; name: string }>
}

export interface UserDetail extends UserWithRoles {
  overrides:            Array<{ permission: string; granted: boolean }>
  effectivePermissions: string[]
}

export async function listUsers(tenantId: string): Promise<UserWithRoles[]> {
  return withTenant(tenantId, async (tx) => {
    const usersList = await tx
      .select({ id: users.id, email: users.email, status: users.status })
      .from(users)
      .orderBy(users.email)

    if (usersList.length === 0) return []

    const userIds = usersList.map((u) => u.id)

    const assignments = await tx
      .select({ userId: userRoleAssignments.userId, roleId: roles.id, roleName: roles.name })
      .from(userRoleAssignments)
      .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
      .where(inArray(userRoleAssignments.userId, userIds))

    const rolesByUser = new Map<string, Array<{ id: string; name: string }>>()
    for (const a of assignments) {
      if (!rolesByUser.has(a.userId)) rolesByUser.set(a.userId, [])
      rolesByUser.get(a.userId)!.push({ id: a.roleId, name: a.roleName })
    }

    return usersList.map((u) => ({ ...u, roles: rolesByUser.get(u.id) ?? [] }))
  })
}

export async function getUserDetail(tenantId: string, id: string): Promise<UserDetail | null> {
  return withTenant(tenantId, async (tx) => {
    const [user] = await tx
      .select({ id: users.id, email: users.email, status: users.status })
      .from(users)
      .where(eq(users.id, id))

    if (!user) return null

    const assignments = await tx
      .select({ roleId: roles.id, roleName: roles.name })
      .from(userRoleAssignments)
      .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
      .where(eq(userRoleAssignments.userId, id))

    const overrideRows = await tx
      .select({ permission: userPermissionOverrides.permission, granted: userPermissionOverrides.granted })
      .from(userPermissionOverrides)
      .where(eq(userPermissionOverrides.userId, id))

    const roleIds = assignments.map((a) => a.roleId)
    const rolePermRows = roleIds.length > 0
      ? await tx
          .select({ permission: rolePermissions.permission })
          .from(rolePermissions)
          .where(inArray(rolePermissions.roleId, roleIds))
      : []

    const effective = new Set<string>(rolePermRows.map((p) => p.permission))
    for (const o of overrideRows) {
      if (o.granted) effective.add(o.permission)
      else effective.delete(o.permission)
    }

    return {
      ...user,
      roles:                assignments.map((a) => ({ id: a.roleId, name: a.roleName })),
      overrides:            overrideRows.map((o) => ({ permission: o.permission, granted: o.granted })),
      effectivePermissions: [...effective],
    }
  })
}

export async function setUserRoles(tenantId: string, userId: string, roleIds: string[]): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx.delete(userRoleAssignments).where(eq(userRoleAssignments.userId, userId))
    if (roleIds.length > 0) {
      await tx.insert(userRoleAssignments).values(roleIds.map((roleId) => ({ userId, roleId })))
    }
  })
}

export async function setUserOverrides(
  tenantId:  string,
  userId:    string,
  overrides: Array<{ permission: string; granted: boolean }>,
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx.delete(userPermissionOverrides).where(eq(userPermissionOverrides.userId, userId))
    if (overrides.length > 0) {
      await tx.insert(userPermissionOverrides).values(
        overrides.map((o) => ({ userId, permission: o.permission, granted: o.granted })),
      )
    }
  })
}
