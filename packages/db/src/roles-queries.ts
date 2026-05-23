import { and, eq, inArray, ne, sql } from 'drizzle-orm'
import { withTenant } from './rls'
import { roles, rolePermissions, userRoleAssignments } from './schema/index'

export interface RoleWithDetails {
  id:          string
  tenantId:    string
  name:        string
  createdAt:   Date
  permissions: string[]
  userCount:   number
}

export async function listRoles(tenantId: string): Promise<RoleWithDetails[]> {
  return withTenant(tenantId, async (tx) => {
    const rolesList = await tx.select().from(roles).orderBy(roles.createdAt)
    if (rolesList.length === 0) return []

    const roleIds = rolesList.map((r) => r.id)

    const permsList = await tx
      .select({ roleId: rolePermissions.roleId, permission: rolePermissions.permission })
      .from(rolePermissions)
      .where(inArray(rolePermissions.roleId, roleIds))

    const countsList = await tx
      .select({ roleId: userRoleAssignments.roleId, count: sql<string>`count(*)` })
      .from(userRoleAssignments)
      .where(inArray(userRoleAssignments.roleId, roleIds))
      .groupBy(userRoleAssignments.roleId)

    const permsByRole = new Map<string, string[]>()
    for (const p of permsList) {
      if (!permsByRole.has(p.roleId)) permsByRole.set(p.roleId, [])
      permsByRole.get(p.roleId)!.push(p.permission)
    }

    const countByRole = new Map<string, number>()
    for (const c of countsList) countByRole.set(c.roleId, Number(c.count))

    return rolesList.map((r) => ({
      ...r,
      permissions: permsByRole.get(r.id) ?? [],
      userCount:   countByRole.get(r.id) ?? 0,
    }))
  })
}

export async function createRole(
  tenantId:    string,
  name:        string,
  permissions: string[],
): Promise<{ role: RoleWithDetails } | { error: 'name_taken' }> {
  return withTenant(tenantId, async (tx) => {
    const existing = await tx.select({ id: roles.id }).from(roles).where(eq(roles.name, name))
    if (existing.length > 0) return { error: 'name_taken' as const }

    const [role] = await tx.insert(roles).values({ tenantId, name }).returning()

    if (permissions.length > 0) {
      await tx.insert(rolePermissions).values(permissions.map((p) => ({ roleId: role!.id, permission: p })))
    }

    return { role: { ...role!, permissions, userCount: 0 } }
  })
}

export async function updateRole(
  tenantId: string,
  id:       string,
  data:     { name?: string; permissions?: string[] },
): Promise<{ role: RoleWithDetails } | { error: 'not_found' | 'name_taken' }> {
  return withTenant(tenantId, async (tx) => {
    const [existing] = await tx.select().from(roles).where(eq(roles.id, id))
    if (!existing) return { error: 'not_found' as const }

    if (data.name !== undefined) {
      const conflict = await tx
        .select({ id: roles.id })
        .from(roles)
        .where(and(eq(roles.name, data.name), ne(roles.id, id)))
      if (conflict.length > 0) return { error: 'name_taken' as const }

      await tx.update(roles).set({ name: data.name }).where(eq(roles.id, id))
    }

    if (data.permissions !== undefined) {
      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, id))
      if (data.permissions.length > 0) {
        await tx.insert(rolePermissions).values(data.permissions.map((p) => ({ roleId: id, permission: p })))
      }
    }

    const [updated] = await tx.select().from(roles).where(eq(roles.id, id))
    const permsRows = await tx
      .select({ permission: rolePermissions.permission })
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, id))
    const [countRow] = await tx
      .select({ count: sql<string>`count(*)` })
      .from(userRoleAssignments)
      .where(eq(userRoleAssignments.roleId, id))

    return {
      role: {
        ...updated!,
        permissions: permsRows.map((p) => p.permission),
        userCount:   Number(countRow?.count ?? 0),
      },
    }
  })
}

export async function deleteRole(
  tenantId: string,
  id:       string,
): Promise<{ ok: true } | { error: 'not_found' | 'role_in_use' }> {
  return withTenant(tenantId, async (tx) => {
    const [existing] = await tx.select({ id: roles.id }).from(roles).where(eq(roles.id, id))
    if (!existing) return { error: 'not_found' as const }

    const [assigned] = await tx
      .select({ userId: userRoleAssignments.userId })
      .from(userRoleAssignments)
      .where(eq(userRoleAssignments.roleId, id))
      .limit(1)
    if (assigned) return { error: 'role_in_use' as const }

    await tx.delete(roles).where(eq(roles.id, id))
    return { ok: true as const }
  })
}
