import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core'
import { brands } from './brands'

export const brandRules = pgTable('brand_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  brandId: uuid('brand_id')
    .notNull()
    .references(() => brands.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  description: text('description').notNull(),
  instruction: text('instruction').notNull(),
  source: text('source').notNull().default('manual'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
