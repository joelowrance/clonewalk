import { eq, inArray } from 'drizzle-orm'
import { db } from './client'
import { rolePermissions, userPermissionOverrides, userRoleAssignments } from './schema/index'

export async function resolvePermissions(userId: string): Promise<Set<string>> {
  const assignments = await db
    .select({ roleId: userRoleAssignments.roleId })
    .from(userRoleAssignments)
    .where(eq(userRoleAssignments.userId, userId))

  const roleIds = assignments.map((a) => a.roleId)

  const rolePerms = roleIds.length > 0
    ? await db
        .select({ permission: rolePermissions.permission })
        .from(rolePermissions)
        .where(inArray(rolePermissions.roleId, roleIds))
    : []

  const overrides = await db
    .select({ permission: userPermissionOverrides.permission, granted: userPermissionOverrides.granted })
    .from(userPermissionOverrides)
    .where(eq(userPermissionOverrides.userId, userId))

  const effective = new Set<string>(rolePerms.map((p) => p.permission))

  for (const override of overrides) {
    if (override.granted) {
      effective.add(override.permission)
    } else {
      effective.delete(override.permission)
    }
  }

  return effective
}
