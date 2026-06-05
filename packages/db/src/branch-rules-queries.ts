import { eq, and } from 'drizzle-orm'
import { db } from './client'
import { withTenant } from './rls'
import { branchRules, questions } from './schema/index'

export interface BranchRuleRow {
  id:                 string
  tenantId:           string
  surveyId:           string
  triggerQuestionId:  string
  triggerAnswerValue: string
  targetQuestionId:   string
  action:             'show' | 'hide'
  createdAt:          Date
}

export async function listBranchRules(tenantId: string, surveyId: string): Promise<BranchRuleRow[]> {
  return withTenant(tenantId, (tx) =>
    tx.select().from(branchRules).where(
      and(eq(branchRules.tenantId, tenantId), eq(branchRules.surveyId, surveyId))
    )
  )
}

export async function createBranchRule(
  tenantId: string,
  data: {
    surveyId: string
    triggerQuestionId: string
    triggerAnswerValue: string
    targetQuestionId: string
    action: 'show' | 'hide'
  },
): Promise<{ rule: BranchRuleRow } | { error: 'invalid_trigger_type' | 'circular_reference' }> {
  const [triggerQuestion] = await db
    .select({ id: questions.id, answerType: questions.answerType })
    .from(questions)
    .where(eq(questions.id, data.triggerQuestionId))

  if (!triggerQuestion) return { error: 'invalid_trigger_type' }
  if (triggerQuestion.answerType !== 'true_false' && triggerQuestion.answerType !== 'multiple_choice') {
    return { error: 'invalid_trigger_type' }
  }

  // DFS circular reference check: starting from targetQuestionId, follow existing
  // trigger→target edges; reject if triggerQuestionId is reachable
  const allRules = await db
    .select({ triggerQuestionId: branchRules.triggerQuestionId, targetQuestionId: branchRules.targetQuestionId })
    .from(branchRules)
    .where(eq(branchRules.surveyId, data.surveyId))

  const graph = new Map<string, string[]>()
  for (const rule of allRules) {
    if (!graph.has(rule.triggerQuestionId)) graph.set(rule.triggerQuestionId, [])
    graph.get(rule.triggerQuestionId)!.push(rule.targetQuestionId)
  }

  const visited = new Set<string>()
  const stack = [data.targetQuestionId]
  while (stack.length > 0) {
    const node = stack.pop()!
    if (node === data.triggerQuestionId) return { error: 'circular_reference' }
    if (visited.has(node)) continue
    visited.add(node)
    const neighbors = graph.get(node) ?? []
    stack.push(...neighbors)
  }

  return withTenant(tenantId, async (tx) => {
    const [rule] = await tx
      .insert(branchRules)
      .values({
        tenantId,
        surveyId: data.surveyId,
        triggerQuestionId: data.triggerQuestionId,
        triggerAnswerValue: data.triggerAnswerValue,
        targetQuestionId: data.targetQuestionId,
        action: data.action,
      })
      .returning()
    return { rule: rule! }
  })
}

export async function deleteBranchRule(
  tenantId: string,
  id: string,
): Promise<{ ok: true } | { error: 'not_found' }> {
  return withTenant(tenantId, async (tx) => {
    const [existing] = await tx
      .select({ id: branchRules.id })
      .from(branchRules)
      .where(and(eq(branchRules.id, id), eq(branchRules.tenantId, tenantId)))
    if (!existing) return { error: 'not_found' }
    await tx.delete(branchRules).where(eq(branchRules.id, id))
    return { ok: true as const }
  })
}
