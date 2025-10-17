// Clean, simplified schema for leaderboard and referral system
import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Simplified users table optimized for leaderboard
export const users = pgTable('users', {
  address: varchar('address', { length: 42 }).primaryKey(), // Ethereum address as PK
  name: varchar('name', { length: 50 }), // FSN name (nullable)
  streak: integer('streak').default(0).notNull(), // Current login streak
  xpMirror: integer('xp_mirror').default(0).notNull(), // Fast DB copy of on-chain XP
  lastSeen: timestamp('last_seen').defaultNow().notNull(), // Last activity timestamp
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  xpMirrorIdx: index('users_xp_mirror_idx').on(table.xpMirror.desc()),
}));

// XP Logs table for tracking on-chain award idempotency
export const xpLogs = pgTable('xp_logs', {
  id: serial('id').primaryKey(),
  address: varchar('address', { length: 42 }).notNull(), // Ethereum address
  type: varchar('type', { length: 50 }).notNull(), // 'daily', 'referral7', 'milestone', etc.
  dayKey: varchar('day_key', { length: 10 }).notNull(), // YYYY-MM-DD format
  actionId: varchar('action_id', { length: 66 }).notNull(), // keccak256 hash as 0x...
  amount: integer('amount').notNull(), // XP amount awarded
  txHash: varchar('tx_hash', { length: 66 }), // Transaction hash if on-chain
  onchain: boolean('onchain').default(false).notNull(), // Whether this was actually minted on-chain
  errorMessage: text('error_message'), // Error details if failed
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  addressDayKeyIdx: index('xp_logs_address_day_key_idx').on(table.address, table.dayKey),
}));

// Referrals table for anti-farm referral system
export const referrals = pgTable('referrals', {
  id: serial('id').primaryKey(),
  inviter: varchar('inviter', { length: 42 }).notNull(), // Inviter's address
  invitee: varchar('invitee', { length: 42 }).notNull(), // Invitee's address
  createdAt: timestamp('created_at').defaultNow().notNull(), // When referral was created
  activatedAt: timestamp('activated_at'), // When invitee completed first login + claim
  qualifies: boolean('qualifies').default(false).notNull(), // True after 7-day streak
  bonusAwarded: boolean('bonus_awarded').default(false).notNull(), // True after XP awarded
  txHash: varchar('tx_hash', { length: 66 }), // Transaction hash for bonus award
}, (table) => ({
  inviterIdx: index('referrals_inviter_idx').on(table.inviter),
  inviteeIdx: index('referrals_invitee_idx').on(table.invitee),
}));

// FSN Domains table (simplified)
export const fsnDomains = pgTable('fsn_domains', {
  address: varchar('address', { length: 42 }).primaryKey(), // One name per address
  name: varchar('name', { length: 50 }).notNull().unique(), // FSN name
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Rep Name Reservations table
export const repReservations = pgTable('rep_reservations', {
  id: varchar('id', { length: 100 }).primaryKey(), // rid_timestamp_random
  name: varchar('name', { length: 50 }).notNull().unique(), // .rep name
  walletAddress: varchar('wallet_address', { length: 42 }).notNull(), // Reserved by address
  linked: boolean('linked').default(false).notNull(), // Whether wallet is linked
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  walletAddressIdx: index('rep_reservations_wallet_idx').on(table.walletAddress),
}));

// Vault Items table for IPFS storage
export const vaultItems = pgTable('vault_items', {
  id: serial('id').primaryKey(),
  address: varchar('address', { length: 42 }).notNull(), // Owner's address
  cid: varchar('cid', { length: 100 }).notNull(), // IPFS CID
  mime: varchar('mime', { length: 100 }).notNull(), // MIME type
  size: integer('size').notNull(), // File size in bytes
  filename: varchar('filename', { length: 255 }).notNull(), // Original filename
  txHash: varchar('tx_hash', { length: 66 }), // Transaction hash for on-chain anchor
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Schema types for new simplified tables
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertXpLogSchema = createInsertSchema(xpLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertXpLog = z.infer<typeof insertXpLogSchema>;
export type XpLog = typeof xpLogs.$inferSelect;

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
});
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;

export const insertFsnDomainSchema = createInsertSchema(fsnDomains).omit({
  createdAt: true,
});
export type InsertFsnDomain = z.infer<typeof insertFsnDomainSchema>;
export type FsnDomain = typeof fsnDomains.$inferSelect;

export const insertVaultItemSchema = createInsertSchema(vaultItems).omit({
  id: true,
  createdAt: true,
});
export type InsertVaultItem = z.infer<typeof insertVaultItemSchema>;
export type VaultItem = typeof vaultItems.$inferSelect;

export const insertRepReservationSchema = createInsertSchema(repReservations).omit({
  createdAt: true,
});
export type InsertRepReservation = z.infer<typeof insertRepReservationSchema>;
export type RepReservation = typeof repReservations.$inferSelect;