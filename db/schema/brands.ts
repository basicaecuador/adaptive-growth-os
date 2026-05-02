import { pgTable, text, timestamp, uuid, boolean, jsonb } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const brands = pgTable('brands', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  voice: text('voice'),
  tone: text('tone'),
  targetAudience: text('target_audience'),
  valueProposition: text('value_proposition'),
  contentPillars: jsonb('content_pillars').$type<string[]>().default([]),
  restrictions: jsonb('restrictions').$type<string[]>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
