import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { resolvePermissions, getUserDetail } from '@compliance/db'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req)
  if (!ctx) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const perms = await resolvePermissions(ctx.userId)
  if (!perms.has('manage:users')) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const { id } = await params
  const user = await getUserDetail(ctx.tenantId, id)
  if (!user) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  return NextResponse.json({ user })
}
