import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { VaultItemType } from "./vault";

// Cryptocurrency type enum
export const cryptoTypeEnum = pgEnum('crypto_type', ['bitcoin', 'ethereum', 'litecoin', 'dogecoin']);

// User type enum for differentiating between human users and AI agents
export const userTypeEnum = pgEnum('user_type', ['human', 'ai_agent']);

// Legacy users table (keeping for backward compatibility during migration)
export const legacyUsers = pgTable("legacy_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"), // Optional, lowercase, validated
  firstName: text("first_name"),
  lastName: text("last_name"),
  isAdmin: boolean("is_admin").default(false),
  userType: userTypeEnum("user_type").notNull().default('human'),
  agentScript: text("agent_script"), // For AI agents only
  blockUnknownMessages: boolean("block_unknown_messages").default(false),
  inventory: jsonb("inventory").default([]), // Array of items in user's inventory stored as JSONB
  isPublic: boolean("is_public").default(true), // Flag for public FSN name visibility
  
  // FSN Phase 0 fields
  fsnName: text("fsn_name"), // Foreign key from fsn_names.name
  lastLogin: timestamp("last_login"), // Timestamp for login tracking
  lastRecast: timestamp("last_recast"), // Timestamp for last beacon recast
  streakDays: integer("streak_days").default(0), // Login streak counter
  xp: integer("xp").default(0), // XP points
  walletLinked: text("wallet_linked"), // Optional wallet address string
  badges: jsonb("badges").default([]), // JSON array for badges
  
  // Beacon specific fields
  broadcastsTotal: integer("broadcasts_total").default(0), // Total beacon recasts
  beaconStreakDays: integer("beacon_streak_days").default(0), // Beacon recast streak
  lastRecastAt: timestamp("last_recast_at"), // Beacon recast timestamp
  
  // Profile verification fields
  phone: text("phone"),
  twitter: text("twitter"),
  discord: text("discord"),
  telegram: text("telegram"),
  linkedin: text("linkedin"),
  github: text("github"),
  website: text("website"),
  bio: text("bio"),
  isEmailVerified: boolean("is_email_verified").default(false),
  isPhoneVerified: boolean("is_phone_verified").default(false),
  profileCompletionXP: integer("profile_completion_xp").default(0),
  
  // Phase 0 Onboarding fields
  onboarded: boolean("onboarded").default(false),
  onboardingTasks: jsonb("onboarding_tasks").default({}),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// FSN domain registration status enum
export const fsnStatusEnum = pgEnum('fsn_status', ['available', 'registered', 'reserved', 'banned']);

// Legacy FSN domain names table
export const legacyFsnDomains = pgTable("legacy_fsn_domains", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  status: fsnStatusEnum("status").notNull().default('available'),
  ownerId: integer("owner_id").references(() => legacyUsers.id),
  reservedReason: text("reserved_reason"),
  // Identity verification fields for soulbinding
  ownerEmail: text("owner_email"),
  ownerPhone: text("owner_phone"),
  deviceFingerprint: text("device_fingerprint"),
  registrationIP: text("registration_ip"),
  xpAtClaim: integer("xp_at_claim").default(0),
  verificationMethod: varchar("verification_method", { length: 20 }), // 'email' or 'phone'
  isEmailVerified: boolean("is_email_verified").default(false),
  isPhoneVerified: boolean("is_phone_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Beacon status enum
export const beaconStatusEnum = pgEnum('beacon_status', ['locked', 'warming_up', 'active']);

// Legacy XP Logs table (replaced by blockchain-enabled xpLogs below)
export const legacyXpLogs = pgTable("legacy_xp_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: varchar("action", { length: 50 }).notNull(), // Key from XP_ACTIONS
  xpEarned: integer("xp_earned").notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 20 }).notNull(), // identity, social, content, etc.
  metadata: jsonb("metadata"), // Additional context data
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Reward events for UI feedback system
export const rewardEvents = pgTable("reward_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  reasonKey: varchar("reason_key", { length: 50 }).notNull(),
  txnId: varchar("txn_id", { length: 100 }).notNull().unique(), // Unique transaction ID to prevent duplicates
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User statistics table
export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  xpPoints: integer("xp_points").default(0),
  level: integer("level").default(1),
  signalsSent: integer("signals_sent").default(0),
  connectionsCount: integer("connections_count").default(0),
  lastActive: timestamp("last_active").defaultNow(),
  settings: text("settings"), // JSON string for user settings like chat preferences
  questData: text("quest_data"), // JSON string for text adventure quest progress
  inventory: text("inventory"), // JSON string for user's collected items
  avatarSelection: varchar("avatar_selection", { length: 20 }).default("default"),
  hexStyle: varchar("hex_style", { length: 20 }).default("classic"),
  activityHours: text("activity_hours"), // JSON array of active hours
  invitedCount: integer("invited_count").default(0),
  // Trust engine fields
  pulseScore: integer("pulse_score").default(30), // 30-100, never below 30
  signalScore: integer("signal_score").default(0), // 0-100, capped by pulse
  beaconStatus: beaconStatusEnum("beacon_status").default('locked'),
  xpLast7Days: integer("xp_last_7_days").default(0),
  lastActivityCheck: timestamp("last_activity_check").defaultNow(),
});

// Admin action logs
export const adminLogs = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  targetTable: text("target_table"),
  targetId: integer("target_id"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reserved names list
export const reservedNames = pgTable("reserved_names", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  reason: text("reason"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// FSN vault storage table
export const vaultItems = pgTable("vault_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  fsnName: varchar("fsn_name", { length: 50 }).notNull(),
  itemId: varchar("item_id", { length: 100 }).notNull().unique(),
  itemType: text("item_type").notNull(),
  data: text("data").notNull(), // Encrypted JSON data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// FSN email aliases table - for mapping fsn names to email addresses
export const fsnEmailAliases = pgTable("fsn_email_aliases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  fsnName: varchar("fsn_name", { length: 50 }).notNull().references(() => fsnDomains.name),
  emailAlias: varchar("email_alias", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// FSN Messages table - for sending messages and files between FSN users
export const fsnMessages = pgTable("fsn_messages", {
  id: serial("id").primaryKey(),
  fromFsn: varchar("from_fsn", { length: 50 }).notNull(),
  toFsn: varchar("to_fsn", { length: 50 }).notNull(),
  message: text("message"),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileType: text("file_type"),
  timestamp: timestamp("timestamp").defaultNow(),
  isRead: boolean("is_read").default(false),
});

// FSN Contacts (address book) table
export const fsnContacts = pgTable("fsn_contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  contactFsn: varchar("contact_fsn", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Verification codes table for email/phone verification
export const verificationCodes = pgTable("verification_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  code: varchar("code", { length: 6 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(), // 'email' or 'phone'
  contact: text("contact").notNull(), // email address or phone number
  isUsed: boolean("is_used").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
  isAdmin: true,
  userType: true,
  agentScript: true,
  blockUnknownMessages: true,
  inventory: true,
  isPublic: true,
});

export const insertFsnDomainSchema = createInsertSchema(fsnDomains).pick({
  name: true,
  status: true,
  ownerId: true,
  reservedReason: true,
  ownerEmail: true,
  ownerPhone: true,
  deviceFingerprint: true,
  registrationIP: true,
  xpAtClaim: true,
  verificationMethod: true,
  isEmailVerified: true,
  isPhoneVerified: true,
  expiresAt: true,
});

export const insertReservedNameSchema = createInsertSchema(reservedNames).pick({
  name: true,
  reason: true,
  createdBy: true,
  isActive: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).pick({
  userId: true,
  xpPoints: true,
  level: true,
  signalsSent: true,
  connectionsCount: true,
  questData: true,
  inventory: true,
  pulseScore: true,
  signalScore: true,
  beaconStatus: true,
  xpLast7Days: true,
  lastActivityCheck: true,
});

export const insertRewardEventSchema = createInsertSchema(rewardEvents).pick({
  userId: true,
  amount: true,
  reasonKey: true,
  txnId: true,
});

export const insertAdminLogSchema = createInsertSchema(adminLogs).pick({
  adminId: true,
  action: true,
  targetTable: true,
  targetId: true,
  details: true,
});

export const insertVaultItemSchema = createInsertSchema(vaultItems).pick({
  userId: true,
  fsnName: true,
  itemId: true,
  itemType: true,
  data: true,
  deletedAt: true,
});

export const insertEmailAliasSchema = createInsertSchema(fsnEmailAliases).pick({
  userId: true,
  fsnName: true,
  emailAlias: true,
});

export const insertFsnMessageSchema = createInsertSchema(fsnMessages).pick({
  fromFsn: true,
  toFsn: true,
  message: true,
  fileUrl: true,
  fileName: true,
  fileType: true,
  isRead: true,
});

export const insertFsnContactSchema = createInsertSchema(fsnContacts).pick({
  userId: true,
  contactFsn: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFsnDomain = z.infer<typeof insertFsnDomainSchema>;
export type FsnDomain = typeof fsnDomains.$inferSelect;

export type InsertReservedName = z.infer<typeof insertReservedNameSchema>;
export type ReservedName = typeof reservedNames.$inferSelect;

export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type UserStats = typeof userStats.$inferSelect;

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

export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;
export type AdminLog = typeof adminLogs.$inferSelect;

export type InsertVaultItem = z.infer<typeof insertVaultItemSchema>;
export type VaultItem = typeof vaultItems.$inferSelect;

export type InsertEmailAlias = z.infer<typeof insertEmailAliasSchema>;
export type EmailAlias = typeof fsnEmailAliases.$inferSelect;

export type InsertFsnMessage = z.infer<typeof insertFsnMessageSchema>;
export type FsnMessage = typeof fsnMessages.$inferSelect;

export type InsertFsnContact = z.infer<typeof insertFsnContactSchema>;
export type FsnContact = typeof fsnContacts.$inferSelect;

// FSN Wallet tables
export const walletAddresses = pgTable("wallet_addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  fsnName: varchar("fsn_name", { length: 50 }).notNull(),
  cryptoType: cryptoTypeEnum("crypto_type").notNull(),
  address: text("address").notNull(),
  publicKey: text("public_key"),
  encryptedPrivateKey: text("encrypted_private_key"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  walletAddressId: integer("wallet_address_id").references(() => walletAddresses.id),
  transactionHash: text("transaction_hash").notNull(),
  cryptoType: cryptoTypeEnum("crypto_type").notNull(),
  amount: text("amount").notNull(), // Store as string to avoid precision issues
  feeAmount: text("fee_amount"),
  isIncoming: boolean("is_incoming").notNull(),
  status: text("status").notNull(), // pending, confirmed, failed
  fromAddress: text("from_address"),
  toAddress: text("to_address"),
  memo: text("memo"),
  blockHeight: integer("block_height"),
  blockTime: timestamp("block_time"),
  createdAt: timestamp("created_at").defaultNow()
});

// Create insert schemas
export const insertWalletAddressSchema = createInsertSchema(walletAddresses).pick({
  userId: true,
  fsnName: true,
  cryptoType: true,
  address: true,
  publicKey: true,
  encryptedPrivateKey: true,
  isDefault: true
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).pick({
  userId: true,
  walletAddressId: true,
  transactionHash: true,
  cryptoType: true,
  amount: true,
  feeAmount: true,
  isIncoming: true,
  status: true,
  fromAddress: true,
  toAddress: true,
  memo: true,
  blockHeight: true,
  blockTime: true
});

// Export types
export type InsertWalletAddress = z.infer<typeof insertWalletAddressSchema>;
export type WalletAddress = typeof walletAddresses.$inferSelect;

export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).pick({
  userId: true,
  token: true,
  expiresAt: true,
});

export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// DISC Game Tables
export const discStats = pgTable("disc_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  highScore: integer("high_score").default(0),
  currentXp: integer("current_xp").default(0),
  level: integer("level").default(1),
  gamesPlayed: integer("games_played").default(0),
  totalTargetsHit: integer("total_targets_hit").default(0),
  totalDiscsThrown: integer("total_discs_thrown").default(0),
  bestAccuracy: integer("best_accuracy").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const discLeaderboard = pgTable("disc_leaderboard", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  score: integer("score").notNull(),
  level: integer("level").notNull(),
  accuracy: integer("accuracy").notNull(),
  gameDate: timestamp("game_date").defaultNow(),
  seasonId: varchar("season_id", { length: 50 }).default("season_1"),
});

export const discAchievements = pgTable("disc_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  achievementType: varchar("achievement_type", { length: 50 }).notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  progress: integer("progress").default(0),
  isCompleted: boolean("is_completed").default(false),
});

export const discMultiplayer = pgTable("disc_multiplayer", {
  id: serial("id").primaryKey(),
  roomId: varchar("room_id", { length: 50 }).notNull(),
  hostUserId: integer("host_user_id").notNull().references(() => users.id),
  players: jsonb("players").default('[]'),
  gameState: varchar("game_state", { length: 20 }).default("waiting"),
  maxPlayers: integer("max_players").default(4),
  createdAt: timestamp("created_at").defaultNow(),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
});

// FSN Phase 0 Required Tables

// Upload types enum for vault uploads
export const uploadTypeEnum = pgEnum('upload_type', ['file', 'nft']);

// Vault uploads table - FSN Phase 0 requirement
export const vaultUploads = pgTable("vault_uploads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  uploadType: uploadTypeEnum("upload_type").notNull(),
  ipfsHash: text("ipfs_hash").notNull(),
  filename: text("filename").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Referrals table - FSN Phase 0 requirement
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => users.id),
  referredUserId: integer("referred_user_id").notNull().references(() => users.id),
  rewarded: boolean("rewarded").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI chat history table - FSN Phase 0 requirement
export const aiChatHistory = pgTable("ai_chat_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  response: text("response").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// DISC Game Insert Schemas
export const insertDiscStatsSchema = createInsertSchema(discStats).pick({
  userId: true,
  highScore: true,
  currentXp: true,
  level: true,
  gamesPlayed: true,
  totalTargetsHit: true,
  totalDiscsThrown: true,
  bestAccuracy: true,
});

export const insertDiscLeaderboardSchema = createInsertSchema(discLeaderboard).pick({
  userId: true,
  score: true,
  level: true,
  accuracy: true,
  seasonId: true,
});

export const insertDiscAchievementsSchema = createInsertSchema(discAchievements).pick({
  userId: true,
  achievementType: true,
  progress: true,
  isCompleted: true,
});

export const insertDiscMultiplayerSchema = createInsertSchema(discMultiplayer).pick({
  roomId: true,
  hostUserId: true,
  players: true,
  gameState: true,
  maxPlayers: true,
});

// DISC Game Types
export type DiscStats = typeof discStats.$inferSelect;
export type InsertDiscStats = z.infer<typeof insertDiscStatsSchema>;
export type DiscLeaderboard = typeof discLeaderboard.$inferSelect;
export type InsertDiscLeaderboard = z.infer<typeof insertDiscLeaderboardSchema>;
export type DiscAchievements = typeof discAchievements.$inferSelect;
export type InsertDiscAchievements = z.infer<typeof insertDiscAchievementsSchema>;
export type DiscMultiplayer = typeof discMultiplayer.$inferSelect;
export type InsertDiscMultiplayer = z.infer<typeof insertDiscMultiplayerSchema>;

// FSN Phase 0 insert schemas and types
export const insertVaultUploadSchema = createInsertSchema(vaultUploads).pick({
  userId: true,
  uploadType: true,
  ipfsHash: true,
  filename: true,
});

export const insertReferralSchema = createInsertSchema(referrals).pick({
  referrerId: true,
  referredUserId: true,
  rewarded: true,
});

export const insertAiChatHistorySchema = createInsertSchema(aiChatHistory).pick({
  userId: true,
  message: true,
  response: true,
});

export type InsertVaultUpload = z.infer<typeof insertVaultUploadSchema>;
export type VaultUpload = typeof vaultUploads.$inferSelect;

export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;

export type InsertAiChatHistory = z.infer<typeof insertAiChatHistorySchema>;
export type AiChatHistory = typeof aiChatHistory.$inferSelect;
