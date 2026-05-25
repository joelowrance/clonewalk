import { pgTable, uuid, primaryKey } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { industries } from './industries'

export const tenantIndustries = pgTable('tenant_industries', {
  tenantId:   uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  industryId: uuid('industry_id').notNull().references(() => industries.id, { onDelete: 'cascade' }),
}, (t) => [
  primaryKey({ columns: [t.tenantId, t.industryId] }),
])
