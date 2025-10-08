// Storage interface for leaderboard and referral system
import { db } from '../db';
import { users, xpLogs, referrals, fsnDomains, vaultItems } from '../../shared/schema';
import { desc, eq, and, sql, count } from 'drizzle-orm';
import type { InsertUser, InsertXpLog, InsertReferral, InsertFsnDomain, InsertVaultItem } from '../../shared/schema';

export class LeaderboardStorage {
  // Get leaderboard rankings
  async getLeaderboard(limit: number = 100, offset: number = 0) {
    const result = await db.execute(sql`
      SELECT * FROM users 
      ORDER BY xp_mirror DESC 
      LIMIT ${limit} OFFSET ${offset}
    `);
    return result.rows;
  }

  // Get or create user by address
  async getUserByAddress(address: string) {
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.address, address))
      .limit(1);
    
    return existingUsers[0] || null;
  }

  // Create or update user
  async upsertUser(userData: InsertUser) {
    const result = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.address,
        set: {
          name: userData.name,
          streak: userData.streak,
          xpMirror: userData.xpMirror,
          lastSeen: userData.lastSeen
        }
      })
      .returning();
    
    return result[0];
  }

  // Update user XP mirror (for sync from blockchain)
  async updateUserXP(address: string, xpMirror: number) {
    const result = await db
      .update(users)
      .set({ 
        xpMirror,
        lastSeen: new Date()
      })
      .where(eq(users.address, address))
      .returning();
    
    return result[0] || null;
  }

  // Update user streak
  async updateUserStreak(address: string, streak: number) {
    const result = await db
      .update(users)
      .set({ 
        streak,
        lastSeen: new Date()
      })
      .where(eq(users.address, address))
      .returning();
    
    return result[0] || null;
  }

  // Create XP log entry
  async createXpLog(logData: InsertXpLog) {
    const result = await db
      .insert(xpLogs)
      .values(logData)
      .returning();
    
    return result[0];
  }

  // Check if XP log exists for address and day
  async getXpLog(address: string, dayKey: string, type: string) {
    const existingLogs = await db
      .select()
      .from(xpLogs)
      .where(and(
        eq(xpLogs.address, address),
        eq(xpLogs.dayKey, dayKey),
        eq(xpLogs.type, type)
      ))
      .limit(1);
    
    return existingLogs[0] || null;
  }

  // Create referral relationship
  async createReferral(referralData: InsertReferral) {
    const result = await db
      .insert(referrals)
      .values(referralData)
      .returning();
    
    return result[0];
  }

  // Get referral by invitee address
  async getReferralByInvitee(invitee: string) {
    const existingReferrals = await db
      .select()
      .from(referrals)
      .where(eq(referrals.invitee, invitee))
      .limit(1);
    
    return existingReferrals[0] || null;
  }

  // Activate referral (set activated_at timestamp)
  async activateReferral(invitee: string) {
    const result = await db
      .update(referrals)
      .set({ activatedAt: new Date() })
      .where(and(
        eq(referrals.invitee, invitee),
        sql`activated_at IS NULL`
      ))
      .returning();
    
    return result[0] || null;
  }

  // Mark referral as qualified (7-day streak achieved)
  async qualifyReferral(invitee: string) {
    const result = await db
      .update(referrals)
      .set({ qualifies: true })
      .where(and(
        eq(referrals.invitee, invitee),
        eq(referrals.qualifies, false),
        sql`activated_at IS NOT NULL`
      ))
      .returning();
    
    return result[0] || null;
  }

  // Mark referral bonus as awarded
  async markReferralAwarded(invitee: string, txHash: string) {
    const result = await db
      .update(referrals)
      .set({ 
        bonusAwarded: true,
        txHash 
      })
      .where(and(
        eq(referrals.invitee, invitee),
        eq(referrals.qualifies, true),
        eq(referrals.bonusAwarded, false)
      ))
      .returning();
    
    return result[0] || null;
  }

  // Get qualified referrals pending bonus award
  async getQualifiedReferrals() {
    return await db
      .select()
      .from(referrals)
      .where(and(
        eq(referrals.qualifies, true),
        eq(referrals.bonusAwarded, false)
      ));
  }

  // Get referral statistics for a user
  async getReferralStats(address: string) {
    // Get referrals where user is the inviter
    const invitedCount = await db
      .select({ count: count() })
      .from(referrals)
      .where(eq(referrals.inviter, address));

    const activatedCount = await db
      .select({ count: count() })
      .from(referrals)
      .where(and(
        eq(referrals.inviter, address),
        sql`activated_at IS NOT NULL`
      ));

    const qualifiedCount = await db
      .select({ count: count() })
      .from(referrals)
      .where(and(
        eq(referrals.inviter, address),
        eq(referrals.qualifies, true)
      ));

    const bonusAwarded = await db
      .select({ count: count() })
      .from(referrals)
      .where(and(
        eq(referrals.inviter, address),
        eq(referrals.bonusAwarded, true)
      ));

    // Get in-progress referrals (activated but not yet qualified)
    const inProgress = await db
      .select()
      .from(referrals)
      .where(and(
        eq(referrals.inviter, address),
        sql`activated_at IS NOT NULL`,
        eq(referrals.qualifies, false)
      ));

    return {
      totalInvited: invitedCount[0]?.count || 0,
      totalActivated: activatedCount[0]?.count || 0,
      totalQualified: qualifiedCount[0]?.count || 0,
      totalBonusAwarded: bonusAwarded[0]?.count || 0,
      inProgress: inProgress.map(ref => ({
        invitee: ref.invitee,
        activatedAt: ref.activatedAt,
        daysActive: Math.floor((Date.now() - new Date(ref.activatedAt!).getTime()) / (1000 * 60 * 60 * 24))
      }))
    };
  }

  // Create or update FSN domain
  async upsertFsnDomain(domainData: InsertFsnDomain) {
    const result = await db
      .insert(fsnDomains)
      .values(domainData)
      .onConflictDoUpdate({
        target: fsnDomains.address,
        set: {
          name: domainData.name
        }
      })
      .returning();
    
    return result[0];
  }

  // Get FSN domain by address
  async getFsnDomainByAddress(address: string) {
    const domains = await db
      .select()
      .from(fsnDomains)
      .where(eq(fsnDomains.address, address))
      .limit(1);
    
    return domains[0] || null;
  }

  // Create vault item
  async createVaultItem(itemData: InsertVaultItem) {
    const result = await db
      .insert(vaultItems)
      .values(itemData)
      .returning();
    
    return result[0];
  }

  // Get vault items by address
  async getVaultItemsByAddress(address: string, limit: number = 50) {
    const result = await db.execute(sql`
      SELECT * FROM vault_items 
      WHERE address = ${address}
      ORDER BY created_at DESC 
      LIMIT ${limit}
    `);
    return result.rows;
  }

  // FSN Domain methods - MISSING METHODS ADDED
  async getFsnDomainByName(name: string) {
    // Query the actual fsn_domains table with correct column names
    const result = await db.execute(sql`SELECT * FROM fsn_domains WHERE name = ${name} LIMIT 1`);
    
    return result.rows[0] || null;
  }

  async checkFsnNameAvailability(name: string) {
    const fullName = `${name}.fsn`;
    const existing = await this.getFsnDomainByName(fullName);
    
    return {
      available: !existing,
      reason: existing ? `This name is already taken by user ${existing.owner_id}` : 'Available'
    };
  }

  // Get FSN domain by name (with compatibility for routes.ts)
  async getFsnDomain(name: string) {
    return await this.getFsnDomainByName(name);
  }

  // Get all FSN domains with pagination (with compatibility for routes.ts)
  async getAllFsnDomains(limit: number = 100, offset: number = 0) {
    const result = await db.execute(sql`
      SELECT * FROM fsn_domains 
      ORDER BY created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `);
    return result.rows;
  }

  // Legacy method compatibility
  async updateLoginStreak(userId: number) {
    // For backward compatibility, return success for now
    return { success: true, streak: 1 };
  }

  // User lookup methods for backward compatibility
  async getUserByUsername(username: string) {
    const result = await db.execute(sql`SELECT * FROM users WHERE username = ${username} LIMIT 1`);
    return result.rows[0] || null;
  }

  async getUserByWalletAddress(walletAddress: string) {
    const result = await db.execute(sql`SELECT * FROM users WHERE wallet_address = ${walletAddress} LIMIT 1`);
    return result.rows[0] || null;
  }

  async getUser(userId: number) {
    const result = await db.execute(sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`);
    return result.rows[0] || null;
  }

  async createUser(userData: any) {
    const email = userData.email || (userData.fsnName + '@fsn.local');
    const result = await db.execute(sql`
      INSERT INTO users (username, email, password, fsn_name, wallet_address, is_email_verified, xp, created_at)
      VALUES (${userData.fsnName}, ${email}, 'wallet_auth', ${userData.fsnName}, ${userData.walletAddress}, true, 100, NOW())
      RETURNING *
    `);
    return result.rows[0] || null;
  }

  async updateUser(userId: number, updates: any) {
    const setClause = Object.keys(updates).map(key => `${key} = $${Object.keys(updates).indexOf(key) + 2}`).join(', ');
    const values = [userId, ...Object.values(updates)];
    
    const result = await db.execute(sql`
      UPDATE users SET ${sql.raw(setClause)} WHERE id = $1 RETURNING *
    `.mapWith(values));
    
    return result.rows[0] || null;
  }

  async getUserByEmail(email: string) {
    const result = await db.execute(sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`);
    return result.rows[0] || null;
  }

  async storeVerificationCode(userId: number, email: string, code: string) {
    // For compatibility - just return success when email is disabled
    return { success: true };
  }
}

export const leaderboardStorage = new LeaderboardStorage();