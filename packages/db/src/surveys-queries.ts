import { eq, and, desc } from 'drizzle-orm'
import { db } from './client'
import { surveys, industries } from './schema/index'
import { withTenant } from './rls'

export interface SurveyRow {
  id:           string
  tenantId:     string
  industryId:   string
  name:         string
  passingScore: number
  isCurrent:    boolean
  createdAt:    Date
}

export async function listSurveys(tenantId: string, industryId?: string): Promise<SurveyRow[]> {
  return withTenant(tenantId, (tx) => {
    const query = tx.select().from(surveys).orderBy(desc(surveys.createdAt))
    if (industryId) {
      return query.where(eq(surveys.industryId, industryId))
    }
    return query
  })
}

export async function getSurvey(tenantId: string, id: string): Promise<SurveyRow | null> {
  return withTenant(tenantId, async (tx) => {
    const [row] = await tx.select().from(surveys).where(eq(surveys.id, id))
    return row ?? null
  })
}

export async function createSurvey(
  tenantId: string,
  data: { name: string; industryId: string; passingScore: number },
): Promise<{ survey: SurveyRow } | { error: 'industry_not_found' }> {
  const [industry] = await db.select({ id: industries.id }).from(industries).where(eq(industries.id, data.industryId))
  if (!industry) return { error: 'industry_not_found' }

  return withTenant(tenantId, async (tx) => {
    // Unset isCurrent on all existing surveys for this industry
    await tx
      .update(surveys)
      .set({ isCurrent: false })
      .where(and(eq(surveys.industryId, data.industryId), eq(surveys.isCurrent, true)))

    const [survey] = await tx
      .insert(surveys)
      .values({ tenantId, industryId: data.industryId, name: data.name, passingScore: data.passingScore, isCurrent: true })
      .returning()
    return { survey: survey! }
  })
}

export async function updateSurvey(
  tenantId: string,
  id: string,
  data: { name?: string; passingScore?: number },
): Promise<{ survey: SurveyRow } | { error: 'not_found' }> {
  return withTenant(tenantId, async (tx) => {
    const [updated] = await tx
      .update(surveys)
      .set({ ...(data.name !== undefined && { name: data.name }), ...(data.passingScore !== undefined && { passingScore: data.passingScore }) })
      .where(and(eq(surveys.id, id), eq(surveys.tenantId, tenantId)))
      .returning()
    if (!updated) return { error: 'not_found' }
    return { survey: updated }
  })
}

export async function deleteSurvey(
  tenantId: string,
  id: string,
): Promise<{ ok: true } | { error: 'not_found' }> {
  return withTenant(tenantId, async (tx) => {
    const [existing] = await tx.select().from(surveys).where(and(eq(surveys.id, id), eq(surveys.tenantId, tenantId)))
    if (!existing) return { error: 'not_found' }

    await tx.delete(surveys).where(eq(surveys.id, id))

    // If deleted survey was current, promote the next most recent for same industry
    if (existing.isCurrent) {
      const [next] = await tx
        .select({ id: surveys.id })
        .from(surveys)
        .where(and(eq(surveys.industryId, existing.industryId), eq(surveys.tenantId, tenantId)))
        .orderBy(desc(surveys.createdAt))
        .limit(1)
      if (next) {
        await tx.update(surveys).set({ isCurrent: true }).where(eq(surveys.id, next.id))
      }
    }

    return { ok: true }
  })
}
