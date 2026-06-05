import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { resolvePermissions, listBranchRules } from '@compliance/db'
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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, res } = await guard(req)
  if (!ctx) return res!
  const { id } = await params
  const rules = await listBranchRules(ctx.tenantId, id)
  return NextResponse.json({ branchRules: rules.map(serialize) })
}
