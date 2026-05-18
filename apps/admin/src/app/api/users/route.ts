import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { resolvePermissions, listUsers } from '@compliance/db'

export async function GET(req: Request) {
  const ctx = await getAuthContext(req)
  if (!ctx) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const perms = await resolvePermissions(ctx.userId)
  if (!perms.has('manage:users')) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const users = await listUsers(ctx.tenantId)
  return NextResponse.json({ users })
}
