import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { resolvePermissions, setUserOverrides, getUserDetail, listRoles } from '@compliance/db'
import { PERMISSIONS } from '@compliance/shared'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req)
  if (!ctx) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const perms = await resolvePermissions(ctx.userId)
  if (!perms.has('manage:users')) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json() as unknown
  if (typeof body !== 'object' || body === null || !Array.isArray((body as Record<string, unknown>)['overrides'])) {
    return NextResponse.json({ error: 'validation_error' }, { status: 400 })
  }

  const overrides = (body as { overrides: unknown[] }).overrides
  if (overrides.some((o) =>
    typeof o !== 'object' || o === null ||
    !(PERMISSIONS as readonly string[]).includes((o as Record<string, unknown>)['permission'] as string) ||
    typeof (o as Record<string, unknown>)['granted'] !== 'boolean'
  )) {
    return NextResponse.json({ error: 'validation_error' }, { status: 400 })
  }

  const typedOverrides = overrides as Array<{ permission: string; granted: boolean }>

  if (id === ctx.userId) {
    const wouldBePerms = await computeEffectiveWithNewOverrides(ctx.tenantId, id, typedOverrides)
    if (!wouldBePerms.has('manage:users')) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
  }

  await setUserOverrides(ctx.tenantId, id, typedOverrides)

  const user = await getUserDetail(ctx.tenantId, id)
  if (!user) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  return NextResponse.json({ user })
}

async function computeEffectiveWithNewOverrides(
  tenantId:    string,
  userId:      string,
  newOverrides: Array<{ permission: string; granted: boolean }>,
): Promise<Set<string>> {
  const [currentUser, allRoles] = await Promise.all([
    getUserDetail(tenantId, userId),
    listRoles(tenantId),
  ])

  const userRoleIds = new Set((currentUser?.roles ?? []).map((r) => r.id))
  const rolePerms = new Set<string>()
  for (const role of allRoles) {
    if (userRoleIds.has(role.id)) {
      for (const p of role.permissions) rolePerms.add(p)
    }
  }

  for (const o of newOverrides) {
    if (o.granted) rolePerms.add(o.permission)
    else rolePerms.delete(o.permission)
  }

  return rolePerms
}
