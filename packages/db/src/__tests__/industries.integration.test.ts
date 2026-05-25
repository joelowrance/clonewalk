import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { db } from '../client.js'
import { tenants, tenantIndustries } from '../schema/index.js'
import {
  listIndustriesWithTenantStatus,
  enableIndustry,
  disableIndustry,
  isIndustryEnabled,
} from '../industries-queries.js'

const TENANT_ID = 'bb000000-0000-0000-0000-000000000001'

beforeAll(async () => {
  await db.delete(tenantIndustries)
  await db.delete(tenants).where(undefined as never)
  await db.insert(tenants).values({ id: TENANT_ID, name: 'Test Tenant' }).onConflictDoNothing()
})

afterEach(async () => {
  await db.delete(tenantIndustries)
})

describe('listIndustriesWithTenantStatus', () => {
  it('returns all 4 seeded industries with enabled:false for a fresh tenant', async () => {
    const result = await listIndustriesWithTenantStatus(TENANT_ID)
    expect(result).toHaveLength(4)
    expect(result.map(i => i.name).sort()).toEqual([
      'Ambulatory Health Center',
      'Blood Bank',
      'Farm',
      'Food Service',
    ])
    expect(result.every(i => i.enabled === false)).toBe(true)
  })
})

describe('enableIndustry', () => {
  it('sets the industry to enabled:true for the tenant', async () => {
    const all = await listIndustriesWithTenantStatus(TENANT_ID)
    const bloodBank = all.find(i => i.name === 'Blood Bank')!

    const result = await enableIndustry(TENANT_ID, bloodBank.id)
    expect(result).toEqual({ ok: true })

    const after = await listIndustriesWithTenantStatus(TENANT_ID)
    const updated = after.find(i => i.id === bloodBank.id)!
    expect(updated.enabled).toBe(true)
    expect(after.filter(i => i.enabled)).toHaveLength(1)
  })

  it('is idempotent — enabling an already-enabled industry does not error', async () => {
    const all = await listIndustriesWithTenantStatus(TENANT_ID)
    const bloodBank = all.find(i => i.name === 'Blood Bank')!

    await enableIndustry(TENANT_ID, bloodBank.id)
    const result = await enableIndustry(TENANT_ID, bloodBank.id)
    expect(result).toEqual({ ok: true })

    const after = await listIndustriesWithTenantStatus(TENANT_ID)
    expect(after.filter(i => i.enabled)).toHaveLength(1)
  })

  it('returns not_found for an unknown industryId', async () => {
    const result = await enableIndustry(TENANT_ID, '00000000-0000-0000-0000-000000000000')
    expect(result).toEqual({ error: 'not_found' })
  })
})

describe('disableIndustry', () => {
  it('removes the industry from the tenant enabled list', async () => {
    const all = await listIndustriesWithTenantStatus(TENANT_ID)
    const farm = all.find(i => i.name === 'Farm')!
    await enableIndustry(TENANT_ID, farm.id)

    const result = await disableIndustry(TENANT_ID, farm.id)
    expect(result).toEqual({ ok: true })

    const after = await listIndustriesWithTenantStatus(TENANT_ID)
    expect(after.find(i => i.id === farm.id)!.enabled).toBe(false)
  })

  it('returns not_found when disabling an industry that is not enabled', async () => {
    const all = await listIndustriesWithTenantStatus(TENANT_ID)
    const farm = all.find(i => i.name === 'Farm')!
    const result = await disableIndustry(TENANT_ID, farm.id)
    expect(result).toEqual({ error: 'not_found' })
  })
})

describe('isIndustryEnabled', () => {
  it('returns false when industry is not enabled for tenant', async () => {
    const all = await listIndustriesWithTenantStatus(TENANT_ID)
    const foodService = all.find(i => i.name === 'Food Service')!
    const result = await isIndustryEnabled(TENANT_ID, foodService.id)
    expect(result).toBe(false)
  })

  it('returns true after enabling the industry', async () => {
    const all = await listIndustriesWithTenantStatus(TENANT_ID)
    const foodService = all.find(i => i.name === 'Food Service')!
    await enableIndustry(TENANT_ID, foodService.id)
    const result = await isIndustryEnabled(TENANT_ID, foodService.id)
    expect(result).toBe(true)
  })
})
