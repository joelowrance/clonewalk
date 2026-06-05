import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { resolvePermissions, createBranchRule } from '@compliance/db'
import type { BranchRuleRow } from '@compliance/db'

async function guard(req: Request) {
  const ctx = await getAuthContext(req)
  if (!ctx) return { ctx: null, res: NextResponse.json({ error: 'unauthenticated' }, { status: 401 }) }
  const perms = await resolvePermissions(ctx.userId)
  if (!perms.has('manage:surveys')) return { ctx: null, res: NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  return { ctx, res: null }
}

function serialize(r: BranchRuleRow) {
  return {
    id: r.id,
    tenantId: r.tenantId,
    surveyId: r.surveyId,
    triggerQuestionId: r.triggerQuestionId,
    triggerAnswerValue: r.triggerAnswerValue,
    targetQuestionId: r.targetQuestionId,
    action: r.action,
    createdAt: r.createdAt.toISOString(),
  }
}

export async function POST(req: Request) {
  const { ctx, res } = await guard(req)
  if (!ctx) return res!

  const body = await req.json() as unknown
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'validation_error' }, { status: 400 })
  }
  const { surveyId, triggerQuestionId, triggerAnswerValue, targetQuestionId, action } = body as Record<string, unknown>

  if (typeof surveyId !== 'string' || typeof triggerQuestionId !== 'string' ||
      typeof triggerAnswerValue !== 'string' || typeof targetQuestionId !== 'string' ||
      (action !== 'show' && action !== 'hide')) {
    return NextResponse.json({ error: 'validation_error' }, { status: 400 })
  }

  const result = await createBranchRule(ctx.tenantId, {
    surveyId,
    triggerQuestionId,
    triggerAnswerValue,
    targetQuestionId,
    action,
  })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ branchRule: serialize(result.rule) }, { status: 201 })
}
