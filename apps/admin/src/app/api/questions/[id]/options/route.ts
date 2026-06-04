import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { resolvePermissions, listQuestionOptions, createQuestionOption } from '@compliance/db'
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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, res } = await guard(req)
  if (!ctx) return res!
  const { id } = await params
  const options = await listQuestionOptions(ctx.tenantId, id)
  return NextResponse.json({ options: options.map(serialize) })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, res } = await guard(req)
  if (!ctx) return res!
  const { id } = await params

  const body = await req.json() as unknown
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'validation_error' }, { status: 400 })
  }
  const { label, pointValue } = body as Record<string, unknown>

  if (typeof label !== 'string' || label.trim().length === 0) {
    return NextResponse.json({ error: 'validation_error', fields: { label: 'required' } }, { status: 400 })
  }

  const result = await createQuestionOption(ctx.tenantId, {
    questionId: id,
    label: label.trim(),
    pointValue: typeof pointValue === 'number' ? pointValue : 0,
  })

  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ option: serialize(result.option) }, { status: 201 })
}
