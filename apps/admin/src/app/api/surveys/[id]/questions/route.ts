import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { resolvePermissions, listQuestions, createQuestion } from '@compliance/db'
import type { QuestionRow } from '@compliance/db'

const VALID_ANSWER_TYPES = ['true_false', 'scored', 'multiple_choice', 'photo', 'file'] as const

async function guard(req: Request) {
  const ctx = await getAuthContext(req)
  if (!ctx) return { ctx: null, res: NextResponse.json({ error: 'unauthenticated' }, { status: 401 }) }
  const perms = await resolvePermissions(ctx.userId)
  if (!perms.has('manage:surveys')) return { ctx: null, res: NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  return { ctx, res: null }
}

function serialize(q: QuestionRow) {
  return {
    id: q.id,
    surveyId: q.surveyId,
    text: q.text,
    answerType: q.answerType,
    pointValue: q.pointValue,
    isCritical: q.isCritical,
    position: q.position,
    createdAt: q.createdAt.toISOString(),
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, res } = await guard(req)
  if (!ctx) return res!
  const { id } = await params
  const qs = await listQuestions(ctx.tenantId, id)
  return NextResponse.json({ questions: qs.map(serialize) })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, res } = await guard(req)
  if (!ctx) return res!
  const { id } = await params

  const body = await req.json() as unknown
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'validation_error' }, { status: 400 })
  }
  const { text, answerType, pointValue, isCritical } = body as Record<string, unknown>

  if (typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json({ error: 'validation_error', fields: { text: 'required' } }, { status: 400 })
  }
  if (!VALID_ANSWER_TYPES.includes(answerType as never)) {
    return NextResponse.json({ error: 'validation_error', fields: { answerType: 'must be one of: true_false, scored, multiple_choice, photo, file' } }, { status: 400 })
  }

  const result = await createQuestion(ctx.tenantId, {
    surveyId: id,
    text: text.trim(),
    answerType: answerType as QuestionRow['answerType'],
    pointValue: typeof pointValue === 'number' ? pointValue : 0,
    isCritical: isCritical === true,
  })

  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 404 })
  return NextResponse.json({ question: serialize(result.question) }, { status: 201 })
}
