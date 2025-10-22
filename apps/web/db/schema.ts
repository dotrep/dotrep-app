import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// Use text id with server-side default UUID (pgcrypto required)
export const reservations = pgTable('reservations', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  name: text('name').notNull(),
  nameLower: text('name_lower').notNull(),
  address: text('address').notNull(),
  addressLower: text('address_lower').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})
