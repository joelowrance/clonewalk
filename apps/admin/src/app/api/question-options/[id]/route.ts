import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { resolvePermissions, updateQuestionOption, deleteQuestionOption } from '@compliance/db'
import type { QuestionOptionRow } from '@compliance/db'

async function guard(req: Request) {
  const ctx = await getAuthContext(req)
  if (!ctx) return { ctx: null, res: NextResponse.json({ error: 'unauthenticated' }, { status: 401 }) }
  const perms = await resolvePermissions(ctx.userId)
  if (!perms.has('manage:surveys')) return { ctx: null, res: NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  return { ctx, res: null }
}

function serialize(o: QuestionOptionRow) {
  return {
    id: o.id,
    questionId: o.questionId,
    label: o.label,
    pointValue: o.pointValue,
    position: o.position,
    createdAt: o.createdAt.toISOString(),
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, res } = await guard(req)
  if (!ctx) return res!
  const { id } = await params

  const body = await req.json() as unknown
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'validation_error' }, { status: 400 })
  }
  const raw = body as Record<string, unknown>
  const data: { label?: string; pointValue?: number } = {}

  if (raw['label'] !== undefined) {
    if (typeof raw['label'] !== 'string' || raw['label'].trim().length === 0) {
      return NextResponse.json({ error: 'validation_error', fields: { label: 'required' } }, { status: 400 })
    }
    data.label = raw['label'].trim()
  }
  if (raw['pointValue'] !== undefined) {
    if (typeof raw['pointValue'] !== 'number') {
      return NextResponse.json({ error: 'validation_error', fields: { pointValue: 'must be a number' } }, { status: 400 })
    }
    data.pointValue = raw['pointValue']
  }

  const result = await updateQuestionOption(ctx.tenantId, id, data)
  if ('error' in result) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ option: serialize(result.option) })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, res } = await guard(req)
  if (!ctx) return res!
  const { id } = await params
  const result = await deleteQuestionOption(ctx.tenantId, id)
  if ('error' in result) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
