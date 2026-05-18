import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { resolvePermissions, updateRole, deleteRole } from '@compliance/db'
import { PERMISSIONS } from '@compliance/shared'
import type { Permission } from '@compliance/shared'

async function guardManageUsers(req: Request) {
  const ctx = await getAuthContext(req)
  if (!ctx) return { ctx: null, res: NextResponse.json({ error: 'unauthenticated' }, { status: 401 }) }
  const perms = await resolvePermissions(ctx.userId)
  if (!perms.has('manage:users')) return { ctx: null, res: NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  return { ctx, res: null }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, res } = await guardManageUsers(req)
  if (!ctx) return res!

  const { id } = await params
  const body = await req.json() as Record<string, unknown>

  const data: { name?: string; permissions?: Permission[] } = {}

  if (body['name'] !== undefined) {
    if (typeof body['name'] !== 'string' || body['name'].trim().length === 0 || body['name'].trim().length > 100) {
      return NextResponse.json({ error: 'validation_error', fields: { name: 'must be 1–100 characters' } }, { status: 400 })
    }
    data.name = (body['name'] as string).trim()
  }

  if (body['permissions'] !== undefined) {
    const perms = body['permissions']
    if (!Array.isArray(perms) || perms.some((p) => !(PERMISSIONS as readonly string[]).includes(p as string))) {
      return NextResponse.json({ error: 'validation_error', fields: { permissions: 'must be a subset of valid permissions' } }, { status: 400 })
    }
    data.permissions = perms as Permission[]
  }

  const result = await updateRole(ctx.tenantId, id, data)

  if ('error' in result) {
    if (result.error === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 })
    return NextResponse.json({ error: 'name_taken' }, { status: 409 })
  }

  const { role } = result
  return NextResponse.json({
    role: {
      id:          role.id,
      name:        role.name,
      permissions: role.permissions,
      userCount:   role.userCount,
      createdAt:   role.createdAt.toISOString(),
    },
  })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, res } = await guardManageUsers(req)
  if (!ctx) return res!

  const { id } = await params
  const result = await deleteRole(ctx.tenantId, id)

  if ('error' in result) {
    if (result.error === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 })
    return NextResponse.json({ error: 'role_in_use' }, { status: 409 })
  }

  return NextResponse.json({ ok: true })
}
