import { pgTable, uuid, text } from 'drizzle-orm/pg-core'

export const industries = pgTable('industries', {
  id:   uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
})

export type Industry = typeof industries.$inferSelect
