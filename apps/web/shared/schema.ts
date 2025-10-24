// Clean, simplified schema for leaderboard and referral system
import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, varchar, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
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

// Legacy reservations table (used by claim flow)
export const reservations = pgTable('reservations', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  name: text('name').notNull(),
  nameLower: text('name_lower').notNull().unique(),
  address: text('address').notNull(),
  addressLower: text('address_lower').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
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

// FSN Messages table
export const fsnMessages = pgTable('fsn_messages', {
  id: serial('id').primaryKey(),
  fromFsn: varchar('from_fsn', { length: 50 }).notNull(), // Sender's FSN name
  toFsn: varchar('to_fsn', { length: 50 }).notNull(), // Recipient's FSN name
  message: text('message').notNull(), // Message content
  fileUrl: varchar('file_url', { length: 500 }), // Optional file attachment URL
  fileName: varchar('file_name', { length: 255 }), // Original file name
  fileType: varchar('file_type', { length: 100 }), // MIME type
  isRead: boolean('is_read').default(false).notNull(), // Read status
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  toFsnIdx: index('fsn_messages_to_fsn_idx').on(table.toFsn),
  fromFsnIdx: index('fsn_messages_from_fsn_idx').on(table.fromFsn),
}));

// Contacts table
export const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  ownerAddress: varchar('owner_address', { length: 42 }).notNull(), // User's wallet address
  contactFsnName: varchar('contact_fsn_name', { length: 50 }).notNull(), // Contact's FSN name
  displayName: varchar('display_name', { length: 100 }).notNull(), // Display name
  notes: text('notes'), // Optional notes
  isFriend: boolean('is_friend').default(true).notNull(), // Friend status
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  ownerAddressIdx: index('contacts_owner_address_idx').on(table.ownerAddress),
}));

// Chat history for AI agent conversations
export const chatHistory = pgTable('chat_history', {
  id: serial('id').primaryKey(),
  userAddress: varchar('user_address', { length: 42 }).notNull(), // User's wallet address
  role: varchar('role', { length: 20 }).notNull(), // 'user' or 'assistant'
  content: text('content').notNull(), // Message content
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userAddressIdx: index('chat_history_user_address_idx').on(table.userAddress),
}));

// Schema types for new tables
export const insertFsnMessageSchema = createInsertSchema(fsnMessages).omit({
  id: true,
  createdAt: true,
});
export type InsertFsnMessage = z.infer<typeof insertFsnMessageSchema>;
export type FsnMessage = typeof fsnMessages.$inferSelect;

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

export const insertChatHistorySchema = createInsertSchema(chatHistory).omit({
  id: true,
  createdAt: true,
});
export type InsertChatHistory = z.infer<typeof insertChatHistorySchema>;
export type ChatHistory = typeof chatHistory.$inferSelect;

// Wallet addresses table
export const walletAddresses = pgTable('wallet_addresses', {
  id: serial('id').primaryKey(),
  ownerAddress: varchar('owner_address', { length: 42 }).notNull(), // User's wallet address
  fsnName: varchar('fsn_name', { length: 50 }), // Associated FSN name
  blockchain: varchar('blockchain', { length: 50 }).notNull().default('base'), // Blockchain network
  label: varchar('label', { length: 100 }).notNull(), // User-friendly label
  isActive: boolean('is_active').default(true).notNull(), // Active status
  balance: varchar('balance', { length: 50 }).default('0.0').notNull(), // Balance as string
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  ownerAddressIdx: index('wallet_addresses_owner_idx').on(table.ownerAddress),
}));

// Transactions table
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  walletAddressId: integer('wallet_address_id').notNull(), // References walletAddresses.id
  txHash: varchar('tx_hash', { length: 66 }).notNull().unique(), // Transaction hash
  amount: varchar('amount', { length: 50 }).notNull(), // Amount as string
  toAddress: varchar('to_address', { length: 42 }).notNull(), // Recipient address
  fromAddress: varchar('from_address', { length: 42 }).notNull(), // Sender address
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, confirmed, failed
  note: text('note'), // Optional note
  blockHeight: integer('block_height'), // Block number
  blockTime: timestamp('block_time'), // Block timestamp
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  walletAddressIdIdx: index('transactions_wallet_id_idx').on(table.walletAddressId),
  txHashIdx: index('transactions_tx_hash_idx').on(table.txHash),
}));

// Schema types for wallet tables
export const insertWalletAddressSchema = createInsertSchema(walletAddresses).omit({
  id: true,
  createdAt: true,
});
export type InsertWalletAddress = z.infer<typeof insertWalletAddressSchema>;
export type WalletAddress = typeof walletAddresses.$inferSelect;

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Phase 0 Missions System Tables
export const repPhase0Missions = pgTable('rep_phase0_missions', {
  slug: varchar('slug', { length: 50 }).primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),
  xp: integer('xp').notNull(),
});

export const repPhase0Progress = pgTable('rep_phase0_progress', {
  id: varchar('id', { length: 100 }).primaryKey().default(sql`gen_random_uuid()::text`),
  userWallet: varchar('user_wallet', { length: 42 }).notNull(),
  missionSlug: varchar('mission_slug', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
  meta: text('meta'),
}, (table) => ({
  uniqueUserMission: uniqueIndex('rep_phase0_progress_user_mission_idx').on(table.userWallet, table.missionSlug),
}));

export const repPhase0Heartbeat = pgTable('rep_phase0_heartbeat', {
  id: varchar('id', { length: 100 }).primaryKey().default(sql`gen_random_uuid()::text`),
  userWallet: varchar('user_wallet', { length: 42 }).notNull(),
  day: varchar('day', { length: 10 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueUserDay: uniqueIndex('rep_phase0_heartbeat_user_day_idx').on(table.userWallet, table.day),
}));

// Phase 0 schema types
export const insertRepPhase0MissionSchema = createInsertSchema(repPhase0Missions);
export type InsertRepPhase0Mission = z.infer<typeof insertRepPhase0MissionSchema>;
export type RepPhase0Mission = typeof repPhase0Missions.$inferSelect;

export const insertRepPhase0ProgressSchema = createInsertSchema(repPhase0Progress).omit({
  id: true,
});
export type InsertRepPhase0Progress = z.infer<typeof insertRepPhase0ProgressSchema>;
export type RepPhase0Progress = typeof repPhase0Progress.$inferSelect;

export const insertRepPhase0HeartbeatSchema = createInsertSchema(repPhase0Heartbeat).omit({
  id: true,
  createdAt: true,
});
export type InsertRepPhase0Heartbeat = z.infer<typeof insertRepPhase0HeartbeatSchema>;
export type RepPhase0Heartbeat = typeof repPhase0Heartbeat.$inferSelect;