import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { resolvePermissions, updateQuestion, deleteQuestion } from '@compliance/db'
import type { QuestionRow } from '@compliance/db'

async function guard(req: Request) {
  const ctx = await getAuthContext(req)
  if (!ctx) return { ctx: null, res: NextResponse.json({ error: 'unauthenticated' }, { status: 401 }) }
  const perms = await resolvePermissions(ctx.userId)
  if (!perms.has('manage:surveys')) return { ctx: null, res: NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  return { ctx, res: null }
}

const VALID_ANSWER_TYPES = ['true_false', 'scored', 'multiple_choice', 'photo', 'file'] as const

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; questionId: string }> }) {
  const { ctx, res } = await guard(req)
  if (!ctx) return res!
  const { questionId } = await params

  const body = await req.json() as unknown
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'validation_error' }, { status: 400 })
  }
  const raw = body as Record<string, unknown>
  const data: { text?: string; answerType?: QuestionRow['answerType']; pointValue?: number; scoredMinValue?: number | null; scoredMaxValue?: number | null; isCritical?: boolean } = {}

  if (raw['text'] !== undefined) {
    if (typeof raw['text'] !== 'string' || raw['text'].trim().length === 0) {
      return NextResponse.json({ error: 'validation_error', fields: { text: 'required' } }, { status: 400 })
    }
    data.text = raw['text'].trim()
  }
  if (raw['answerType'] !== undefined) {
    if (!VALID_ANSWER_TYPES.includes(raw['answerType'] as never)) {
      return NextResponse.json({ error: 'validation_error', fields: { answerType: 'invalid' } }, { status: 400 })
    }
    data.answerType = raw['answerType'] as QuestionRow['answerType']
    if (data.answerType !== 'scored' && raw['scoredMinValue'] === undefined && raw['scoredMaxValue'] === undefined) {
      data.scoredMinValue = null
      data.scoredMaxValue = null
    }
  }
  if (raw['pointValue'] !== undefined) {
    if (typeof raw['pointValue'] !== 'number') {
      return NextResponse.json({ error: 'validation_error', fields: { pointValue: 'must be a number' } }, { status: 400 })
    }
    data.pointValue = raw['pointValue']
  }
  if (raw['isCritical'] !== undefined) {
    data.isCritical = raw['isCritical'] === true
  }
  if (raw['scoredMinValue'] !== undefined || raw['scoredMaxValue'] !== undefined || data.answerType === 'scored') {
    const min = raw['scoredMinValue']
    const max = raw['scoredMaxValue']
    if (typeof min !== 'number') {
      return NextResponse.json({ error: 'validation_error', fields: { scoredMinValue: 'required for scored questions' } }, { status: 400 })
    }
    if (typeof max !== 'number') {
      return NextResponse.json({ error: 'validation_error', fields: { scoredMaxValue: 'required for scored questions' } }, { status: 400 })
    }
    if (min >= max) {
      return NextResponse.json({ error: 'validation_error', fields: { scoredMinValue: 'must be less than scoredMaxValue' } }, { status: 400 })
    }
    data.scoredMinValue = min
    data.scoredMaxValue = max
  }

  const result = await updateQuestion(ctx.tenantId, questionId, data)
  if ('error' in result) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const q = result.question
  return NextResponse.json({ question: {
    id: q.id, surveyId: q.surveyId, text: q.text, answerType: q.answerType,
    pointValue: q.pointValue, scoredMinValue: q.scoredMinValue, scoredMaxValue: q.scoredMaxValue,
    isCritical: q.isCritical, position: q.position,
    createdAt: q.createdAt.toISOString(),
  }})
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; questionId: string }> }) {
  const { ctx, res } = await guard(req)
  if (!ctx) return res!
  const { questionId } = await params
  const result = await deleteQuestion(ctx.tenantId, questionId)
  if ('error' in result) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
