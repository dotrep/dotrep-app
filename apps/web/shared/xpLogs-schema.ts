// XP Logs schema for tracking on-chain awards
import { pgTable, serial, text, boolean, timestamp, varchar, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

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
});

// Zod schemas
export const insertXpLogSchema = createInsertSchema(xpLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertXpLog = z.infer<typeof insertXpLogSchema>;
export type XpLog = typeof xpLogs.$inferSelect;