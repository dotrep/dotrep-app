import { pgTable, text, timestamp, integer, unique } from 'drizzle-orm/pg-core'
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

// Phase 0 Missions System Tables
export const repPhase0Missions = pgTable('rep_phase0_missions', {
  slug: text('slug').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  xp: integer('xp').notNull(),
})

export const repPhase0Progress = pgTable('rep_phase0_progress', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  userWallet: text('user_wallet').notNull(),
  missionSlug: text('mission_slug').notNull(),
  status: text('status').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  meta: text('meta'),
}, (table) => ({
  uniqueUserMission: unique().on(table.userWallet, table.missionSlug),
}))

export const repPhase0Heartbeat = pgTable('rep_phase0_heartbeat', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  userWallet: text('user_wallet').notNull(),
  day: text('day').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  uniqueUserDay: unique().on(table.userWallet, table.day),
}))
