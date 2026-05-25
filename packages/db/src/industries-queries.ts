import { eq } from 'drizzle-orm'
import { db } from './client'
import { industries, tenantIndustries } from './schema/index'
import { withTenant } from './rls'

export interface IndustryRow {
  id:      string
  name:    string
  enabled: boolean
}

export async function listIndustriesWithTenantStatus(tenantId: string): Promise<IndustryRow[]> {
  return withTenant(tenantId, async (tx) => {
    const allIndustries = await db.select().from(industries).orderBy(industries.name)
    const enabled = await tx.select({ industryId: tenantIndustries.industryId }).from(tenantIndustries)
    const enabledSet = new Set(enabled.map(r => r.industryId))
    return allIndustries.map(i => ({ id: i.id, name: i.name, enabled: enabledSet.has(i.id) }))
  })
}

export async function enableIndustry(
  tenantId: string,
  industryId: string,
): Promise<{ ok: true } | { error: 'not_found' }> {
  const [industry] = await db.select({ id: industries.id }).from(industries).where(eq(industries.id, industryId))
  if (!industry) return { error: 'not_found' }

  await withTenant(tenantId, async (tx) => {
    await tx
      .insert(tenantIndustries)
      .values({ tenantId, industryId })
      .onConflictDoNothing()
  })
  return { ok: true }
}

export async function disableIndustry(
  tenantId: string,
  industryId: string,
): Promise<{ ok: true } | { error: 'not_found' }> {
  return withTenant(tenantId, async (tx) => {
    const [existing] = await tx
      .select({ industryId: tenantIndustries.industryId })
      .from(tenantIndustries)
      .where(eq(tenantIndustries.industryId, industryId))
    if (!existing) return { error: 'not_found' }

    await tx
      .delete(tenantIndustries)
      .where(eq(tenantIndustries.industryId, industryId))
    return { ok: true }
  })
}

export async function isIndustryEnabled(tenantId: string, industryId: string): Promise<boolean> {
  return withTenant(tenantId, async (tx) => {
    const [row] = await tx
      .select({ industryId: tenantIndustries.industryId })
      .from(tenantIndustries)
      .where(eq(tenantIndustries.industryId, industryId))
    return row !== undefined
  })
}
