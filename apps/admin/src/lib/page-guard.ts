import { redirect } from 'next/navigation'
import { resolvePermissions } from '@compliance/db'
import { getServerAuthContext } from './auth'
import type { AuthContext } from './auth'
import type { Permission } from '@compliance/shared'

export async function requirePagePermission(permission: Permission): Promise<AuthContext> {
  const ctx = await getServerAuthContext()
  if (!ctx) redirect('/login')

  const perms = await resolvePermissions(ctx.userId)
  if (!perms.has(permission)) redirect('/')

  return ctx
}
