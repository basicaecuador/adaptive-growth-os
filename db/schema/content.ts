import { pgTable, text, timestamp, uuid, jsonb, integer } from 'drizzle-orm/pg-core'
import { brands } from './brands'

export const contentPlans = pgTable('content_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  brandId: uuid('brand_id')
    .notNull()
    .references(() => brands.id, { onDelete: 'cascade' }),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  status: text('status').notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const contentItems = pgTable('content_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  brandId: uuid('brand_id')
    .notNull()
    .references(() => brands.id, { onDelete: 'cascade' }),
  planId: uuid('plan_id').references(() => contentPlans.id, { onDelete: 'set null' }),
  createdBy: uuid('created_by').notNull(),
  type: text('type').notNull(),
  platform: text('platform').notNull(),
  status: text('status').notNull().default('draft'),
  body: text('body').notNull(),
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
