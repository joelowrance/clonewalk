import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { resolvePermissions, deleteBranchRule } from '@compliance/db'

async function guard(req: Request) {
  const ctx = await getAuthContext(req)
  if (!ctx) return { ctx: null, res: NextResponse.json({ error: 'unauthenticated' }, { status: 401 }) }
  const perms = await resolvePermissions(ctx.userId)
  if (!perms.has('manage:surveys')) return { ctx: null, res: NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  return { ctx, res: null }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, res } = await guard(req)
  if (!ctx) return res!
  const { id } = await params
  const result = await deleteBranchRule(ctx.tenantId, id)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 404 })
  return NextResponse.json({ ok: true })
}
