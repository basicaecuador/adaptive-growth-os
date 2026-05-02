import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { contentItems } from './content'
import { brands } from './brands'

export const approvals = pgTable('approvals', {
  id: uuid('id').defaultRandom().primaryKey(),
  contentId: uuid('content_id')
    .notNull()
    .references(() => contentItems.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'),
  comment: text('comment'),
  reviewedBy: uuid('reviewed_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const feedback = pgTable('feedback', {
  id: uuid('id').defaultRandom().primaryKey(),
  contentId: uuid('content_id')
    .notNull()
    .references(() => contentItems.id, { onDelete: 'cascade' }),
  brandId: uuid('brand_id')
    .notNull()
    .references(() => brands.id, { onDelete: 'cascade' }),
  comment: text('comment').notNull(),
  type: text('type').notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
