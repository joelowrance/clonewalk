import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { resolvePermissions, reorderQuestions } from '@compliance/db'
import type { AuthContext } from '@/lib/auth'

async function guardManageSurveys(req: Request): Promise<{ ctx: AuthContext; res: null } | { ctx: null; res: Response }> {
  const ctx = await getAuthContext(req)
  if (!ctx) return { ctx: null, res: NextResponse.json({ error: 'unauthenticated' }, { status: 401 }) }
  const perms = await resolvePermissions(ctx.userId)
  if (!perms.has('manage:surveys')) return { ctx: null, res: NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  return { ctx, res: null }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, res } = await guardManageSurveys(req)
  if (!ctx) return res!

  const { id: surveyId } = await params

  const body = await req.json() as unknown
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'validation_error', fields: {} }, { status: 400 })
  }

  const { ids } = body as Record<string, unknown>
  if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string')) {
    return NextResponse.json({ error: 'validation_error', fields: { ids: 'must be an array of strings' } }, { status: 400 })
  }

  const result = await reorderQuestions(ctx.tenantId, surveyId, ids as string[])

  if ('error' in result) {
    if (result.error === 'survey_not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 })
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
