import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { resolvePermissions, enableIndustry } from '@compliance/db'

export async function POST(req: Request) {
  const ctx = await getAuthContext(req)
  if (!ctx) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const perms = await resolvePermissions(ctx.userId)
  if (!perms.has('manage:industries')) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const body = await req.json() as unknown
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'validation_error', fields: { industryId: 'required' } }, { status: 400 })
  }

  const { industryId } = body as Record<string, unknown>
  if (typeof industryId !== 'string' || industryId.trim().length === 0) {
    return NextResponse.json({ error: 'validation_error', fields: { industryId: 'required' } }, { status: 400 })
  }

  const result = await enableIndustry(ctx.tenantId, industryId)
  if ('error' in result) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  return NextResponse.json({ ok: true }, { status: 201 })
}
