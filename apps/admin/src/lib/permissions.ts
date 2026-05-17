import { NextResponse } from 'next/server'
import { getAuthContext } from './auth'
import { resolvePermissions } from '@compliance/db'
import type { AuthContext } from './auth'
import type { Permission } from '@compliance/shared'

type Handler = (req: Request, ctx: AuthContext) => Promise<Response>

export function requirePermission(permission: Permission) {
  return (handler: Handler) =>
    async (req: Request): Promise<Response> => {
      const ctx = await getAuthContext(req)
      if (!ctx) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

      const perms = await resolvePermissions(ctx.userId)
      if (!perms.has(permission)) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 })
      }

      return handler(req, ctx)
    }
}
