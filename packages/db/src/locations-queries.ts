import { eq, and, not } from 'drizzle-orm'
import { withTenant } from './rls.js'
import { locations } from './schema/index.js'

export interface LocationRow {
  id:        string
  tenantId:  string
  name:      string
  createdAt: Date
}

export async function listLocations(tenantId: string): Promise<LocationRow[]> {
  return withTenant(tenantId, (tx) =>
    tx.select().from(locations).orderBy(locations.createdAt)
  )
}

export async function getLocation(
  tenantId: string,
  id: string,
): Promise<LocationRow | null> {
  return withTenant(tenantId, async (tx) => {
    const [row] = await tx.select().from(locations).where(eq(locations.id, id))
    return row ?? null
  })
}

export async function createLocation(
  tenantId: string,
  name: string,
): Promise<{ location: LocationRow } | { error: 'name_taken' }> {
  return withTenant(tenantId, async (tx) => {
    const [existing] = await tx.select({ id: locations.id }).from(locations).where(eq(locations.name, name))
    if (existing) return { error: 'name_taken' as const }

    const [location] = await tx.insert(locations).values({ tenantId, name }).returning()
    return { location: location! }
  })
}

export async function updateLocation(
  tenantId: string,
  id: string,
  data: { name: string },
): Promise<{ location: LocationRow } | { error: 'not_found' | 'name_taken' }> {
  return withTenant(tenantId, async (tx) => {
    const [taken] = await tx.select({ id: locations.id }).from(locations)
      .where(and(eq(locations.name, data.name), not(eq(locations.id, id))))
    if (taken) return { error: 'name_taken' as const }

    const [updated] = await tx
      .update(locations)
      .set({ name: data.name })
      .where(and(eq(locations.id, id), eq(locations.tenantId, tenantId)))
      .returning()
    if (!updated) return { error: 'not_found' as const }
    return { location: updated }
  })
}

export async function deleteLocation(
  tenantId: string,
  id: string,
): Promise<{ ok: true } | { error: 'not_found' }> {
  return withTenant(tenantId, async (tx) => {
    const [existing] = await tx.select({ id: locations.id }).from(locations).where(eq(locations.id, id))
    if (!existing) return { error: 'not_found' as const }

    await tx.delete(locations).where(and(eq(locations.id, id), eq(locations.tenantId, tenantId)))
    return { ok: true as const }
  })
}
