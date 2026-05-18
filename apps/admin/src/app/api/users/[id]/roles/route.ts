import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { resolvePermissions, setUserRoles, getUserDetail, listRoles } from '@compliance/db'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req)
  if (!ctx) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const perms = await resolvePermissions(ctx.userId)
  if (!perms.has('manage:users')) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json() as unknown
  if (typeof body !== 'object' || body === null || !Array.isArray((body as Record<string, unknown>)['roleIds'])) {
    return NextResponse.json({ error: 'validation_error' }, { status: 400 })
  }

  const roleIds = (body as { roleIds: unknown[] }).roleIds
  if (roleIds.some((r) => typeof r !== 'string')) {
    return NextResponse.json({ error: 'validation_error' }, { status: 400 })
  }

  if (id === ctx.userId) {
    const wouldBePerms = await computeEffectiveWithNewRoles(ctx.tenantId, id, roleIds as string[])
    if (!wouldBePerms.has('manage:users')) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
  }

  await setUserRoles(ctx.tenantId, id, roleIds as string[])

  const user = await getUserDetail(ctx.tenantId, id)
  if (!user) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  return NextResponse.json({ user })
}

async function computeEffectiveWithNewRoles(tenantId: string, userId: string, newRoleIds: string[]): Promise<Set<string>> {
  const [allRoles, currentUser] = await Promise.all([
    listRoles(tenantId),
    getUserDetail(tenantId, userId),
  ])

  const newRolePerms = new Set<string>()
  for (const role of allRoles) {
    if (newRoleIds.includes(role.id)) {
      for (const p of role.permissions) newRolePerms.add(p)
    }
  }

  const overrides = currentUser?.overrides ?? []
  for (const o of overrides) {
    if (o.granted) newRolePerms.add(o.permission)
    else newRolePerms.delete(o.permission)
  }

  return newRolePerms
}
