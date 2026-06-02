import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { resolvePermissions, reorderQuestions } from '@compliance/db'

async function guard(req: Request) {
  const ctx = await getAuthContext(req)
  if (!ctx) return { ctx: null, res: NextResponse.json({ error: 'unauthenticated' }, { status: 401 }) }
  const perms = await resolvePermissions(ctx.userId)
  if (!perms.has('manage:surveys')) return { ctx: null, res: NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  return { ctx, res: null }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, res } = await guard(req)
  if (!ctx) return res!
  const { id } = await params

  const body = await req.json() as unknown
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'validation_error' }, { status: 400 })
  }
  const { orderedIds } = body as Record<string, unknown>
  if (!Array.isArray(orderedIds) || orderedIds.some(x => typeof x !== 'string')) {
    return NextResponse.json({ error: 'validation_error', fields: { orderedIds: 'must be an array of strings' } }, { status: 400 })
  }

  const result = await reorderQuestions(ctx.tenantId, id, orderedIds as string[])
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ ok: true })
}
