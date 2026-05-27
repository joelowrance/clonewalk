import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { resolvePermissions, listQuestions, createQuestion } from '@compliance/db'
import type { AuthContext } from '@/lib/auth'
import type { QuestionRow } from '@compliance/db'

const ANSWER_TYPES = ['true_false', 'scored', 'multiple_choice', 'photo', 'file'] as const

async function guardManageSurveys(req: Request): Promise<{ ctx: AuthContext; res: null } | { ctx: null; res: Response }> {
  const ctx = await getAuthContext(req)
  if (!ctx) return { ctx: null, res: NextResponse.json({ error: 'unauthenticated' }, { status: 401 }) }
  const perms = await resolvePermissions(ctx.userId)
  if (!perms.has('manage:surveys')) return { ctx: null, res: NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  return { ctx, res: null }
}

function serializeQuestion(q: QuestionRow) {
  return {
    id:         q.id,
    surveyId:   q.surveyId,
    text:       q.text,
    answerType: q.answerType,
    pointValue: q.pointValue,
    isCritical: q.isCritical,
    position:   q.position,
    createdAt:  q.createdAt.toISOString(),
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, res } = await guardManageSurveys(req)
  if (!ctx) return res!

  const { id: surveyId } = await params
  const rows = await listQuestions(ctx.tenantId, surveyId)
  return NextResponse.json({ questions: rows.map(serializeQuestion) })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, res } = await guardManageSurveys(req)
  if (!ctx) return res!

  const { id: surveyId } = await params

  const body = await req.json() as unknown
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'validation_error', fields: {} }, { status: 400 })
  }

  const { text, answerType, pointValue, isCritical } = body as Record<string, unknown>

  if (!text || typeof text !== 'string' || text.trim().length === 0 || text.trim().length > 500) {
    return NextResponse.json({ error: 'validation_error', fields: { text: 'must be 1–500 characters' } }, { status: 400 })
  }

  if (!answerType || !ANSWER_TYPES.includes(answerType as QuestionRow['answerType'])) {
    return NextResponse.json({ error: 'validation_error', fields: { answerType: `must be one of: ${ANSWER_TYPES.join(', ')}` } }, { status: 400 })
  }

  const pv = pointValue !== undefined ? parseInt(String(pointValue), 10) : 0
  if (isNaN(pv) || pv < 0) {
    return NextResponse.json({ error: 'validation_error', fields: { pointValue: 'must be a non-negative integer' } }, { status: 400 })
  }

  const result = await createQuestion(ctx.tenantId, {
    surveyId,
    text:       text.trim(),
    answerType: answerType as QuestionRow['answerType'],
    pointValue: pv,
    isCritical: isCritical === true,
  })

  if ('error' in result) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  return NextResponse.json({ question: serializeQuestion(result.question) }, { status: 201 })
}
