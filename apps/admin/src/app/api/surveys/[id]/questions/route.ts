import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { db } from '@compliance/db'
import { schema } from '@compliance/db'
import { eq, and } from 'drizzle-orm'
import { resolvePermissions, listQuestions, createQuestion } from '@compliance/db'
import type { QuestionRow, NestedQuestionRow } from '@compliance/db'

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
    scoredMinValue: q.scoredMinValue,
    scoredMaxValue: q.scoredMaxValue,
    isCritical: q.isCritical,
    parentQuestionId: q.parentQuestionId,
    position: q.position,
    createdAt: q.createdAt.toISOString(),
  }
}

function serializeNested(q: NestedQuestionRow) {
  return { ...serialize(q), children: q.children.map(serialize) }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, res } = await guard(req)
  if (!ctx) return res!
  const { id } = await params
  const qs = await listQuestions(ctx.tenantId, id)
  return NextResponse.json({ questions: qs.map(serializeNested) })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, res } = await guard(req)
  if (!ctx) return res!
  const { id } = await params

  const body = await req.json() as unknown
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'validation_error' }, { status: 400 })
  }
  const { text, answerType, pointValue, isCritical, scoredMinValue, scoredMaxValue, parentQuestionId } = body as Record<string, unknown>

  if (typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json({ error: 'validation_error', fields: { text: 'required' } }, { status: 400 })
  }
  if (!VALID_ANSWER_TYPES.includes(answerType as never)) {
    return NextResponse.json({ error: 'validation_error', fields: { answerType: 'must be one of: true_false, scored, multiple_choice, photo, file' } }, { status: 400 })
  }
  if (answerType === 'scored') {
    if (typeof scoredMinValue !== 'number') {
      return NextResponse.json({ error: 'validation_error', fields: { scoredMinValue: 'required for scored questions' } }, { status: 400 })
    }
    if (typeof scoredMaxValue !== 'number') {
      return NextResponse.json({ error: 'validation_error', fields: { scoredMaxValue: 'required for scored questions' } }, { status: 400 })
    }
    if (scoredMinValue >= scoredMaxValue) {
      return NextResponse.json({ error: 'validation_error', fields: { scoredMinValue: 'must be less than scoredMaxValue' } }, { status: 400 })
    }
  }

  let resolvedParentId: string | null = null
  if (parentQuestionId !== undefined && parentQuestionId !== null) {
    if (typeof parentQuestionId !== 'string') {
      return NextResponse.json({ error: 'validation_error', fields: { parentQuestionId: 'must be a UUID string' } }, { status: 400 })
    }
    const [parent] = await db
      .select({ id: schema.questions.id, parentQuestionId: schema.questions.parentQuestionId })
      .from(schema.questions)
      .where(and(eq(schema.questions.id, parentQuestionId), eq(schema.questions.surveyId, id)))
    if (!parent) {
      return NextResponse.json({ error: 'validation_error', fields: { parentQuestionId: 'not found in this survey' } }, { status: 400 })
    }
    if (parent.parentQuestionId !== null) {
      return NextResponse.json({ error: 'validation_error', fields: { parentQuestionId: 'cannot nest under a child question' } }, { status: 400 })
    }
    resolvedParentId = parentQuestionId
  }

  const result = await createQuestion(ctx.tenantId, {
    surveyId: id,
    text: text.trim(),
    answerType: answerType as QuestionRow['answerType'],
    pointValue: typeof pointValue === 'number' ? pointValue : 0,
    scoredMinValue: answerType === 'scored' ? (scoredMinValue as number) : null,
    scoredMaxValue: answerType === 'scored' ? (scoredMaxValue as number) : null,
    isCritical: isCritical === true,
    parentQuestionId: resolvedParentId,
  })

  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 404 })
  return NextResponse.json({ question: serialize(result.question) }, { status: 201 })
}
