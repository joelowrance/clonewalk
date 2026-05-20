import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { resolvePermissions, getLocation, updateLocation, deleteLocation } from '@compliance/db'
import type { AuthContext } from '@/lib/auth'

async function guardManageLocations(req: Request): Promise<{ ctx: AuthContext; res: null } | { ctx: null; res: Response }> {
  const ctx = await getAuthContext(req)
  if (!ctx) return { ctx: null, res: NextResponse.json({ error: 'unauthenticated' }, { status: 401 }) }
  const perms = await resolvePermissions(ctx.userId)
  if (!perms.has('manage:locations')) return { ctx: null, res: NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  return { ctx, res: null }
}

function serializeLocation(l: { id: string; name: string; createdAt: Date }) {
  return { id: l.id, name: l.name, createdAt: l.createdAt.toISOString() }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, res } = await guardManageLocations(req)
  if (!ctx) return res!

  const { id } = await params
  const location = await getLocation(ctx.tenantId, id)
  if (!location) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  return NextResponse.json({ location: serializeLocation(location) })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, res } = await guardManageLocations(req)
  if (!ctx) return res!

  const { id } = await params
  const body = await req.json() as unknown
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'validation_error', fields: { name: 'required' } }, { status: 400 })
  }

  const { name } = body as Record<string, unknown>
  if (name === undefined || name === null) {
    return NextResponse.json({ error: 'validation_error', fields: { name: 'required' } }, { status: 400 })
  }
  if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100) {
    return NextResponse.json({ error: 'validation_error', fields: { name: 'must be 1–100 characters' } }, { status: 400 })
  }

  const result = await updateLocation(ctx.tenantId, id, { name: name.trim() })
  if ('error' in result) {
    if (result.error === 'name_taken') return NextResponse.json({ error: 'name_taken' }, { status: 409 })
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  return NextResponse.json({ location: serializeLocation(result.location) })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, res } = await guardManageLocations(req)
  if (!ctx) return res!

  const { id } = await params
  const result = await deleteLocation(ctx.tenantId, id)
  if ('error' in result) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
