import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { resolvePermissions, listIndustriesWithTenantStatus } from '@compliance/db'

export async function GET(req: Request) {
  const ctx = await getAuthContext(req)
  if (!ctx) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const perms = await resolvePermissions(ctx.userId)
  if (!perms.has('manage:industries')) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const industries = await listIndustriesWithTenantStatus(ctx.tenantId)
  return NextResponse.json({ industries })
}
