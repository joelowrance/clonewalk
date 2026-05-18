import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { resolvePermissions, listRoles, createRole } from '@compliance/db'
import { PERMISSIONS } from '@compliance/shared'
import type { Permission } from '@compliance/shared'

async function guardManageUsers(req: Request) {
  const ctx = await getAuthContext(req)
  if (!ctx) return { ctx: null, res: NextResponse.json({ error: 'unauthenticated' }, { status: 401 }) }
  const perms = await resolvePermissions(ctx.userId)
  if (!perms.has('manage:users')) return { ctx: null, res: NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  return { ctx, res: null }
}

function serializeRole(r: { id: string; name: string; permissions: string[]; userCount: number; createdAt: Date }) {
  return { id: r.id, name: r.name, permissions: r.permissions, userCount: r.userCount, createdAt: r.createdAt.toISOString() }
}

export async function GET(req: Request) {
  const { ctx, res } = await guardManageUsers(req)
  if (!ctx) return res!

  const roles = await listRoles(ctx.tenantId)
  return NextResponse.json({ roles: roles.map(serializeRole) })
}

export async function POST(req: Request) {
  const { ctx, res } = await guardManageUsers(req)
  if (!ctx) return res!

  const body = await req.json() as unknown
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'validation_error', fields: { name: 'required' } }, { status: 400 })
  }

  const { name, permissions } = body as Record<string, unknown>

  const fields: Record<string, string> = {}
  if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100) {
    fields['name'] = 'must be 1–100 characters'
  }
  if (!Array.isArray(permissions) || permissions.some((p) => !(PERMISSIONS as readonly string[]).includes(p as string))) {
    fields['permissions'] = 'must be a subset of valid permissions'
  }
  if (Object.keys(fields).length > 0) {
    return NextResponse.json({ error: 'validation_error', fields }, { status: 400 })
  }

  const result = await createRole(ctx.tenantId, (name as string).trim(), permissions as Permission[])

  if ('error' in result) {
    return NextResponse.json({ error: 'name_taken' }, { status: 409 })
  }

  return NextResponse.json({ role: serializeRole(result.role) }, { status: 201 })
}
