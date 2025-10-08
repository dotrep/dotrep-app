// Simplified storage interface for basic operations
import { db } from '../db';
import { users, xpLogs, vaultItems } from '../../shared/schema';
import { eq, desc } from 'drizzle-orm';
import type { InsertUser, InsertXpLog, InsertVaultItem } from '../../shared/schema';

export interface ISimpleStorage {
  // User operations
  getUserByAddress(address: string): Promise<any>;
  createUser(userData: InsertUser): Promise<any>;
  updateUser(address: string, updates: Partial<InsertUser>): Promise<any>;
  
  // XP operations
  createXpLog(logData: InsertXpLog): Promise<any>;
  getXpLogsByAddress(address: string): Promise<any[]>;
  
  // Vault operations
  createVaultItem(itemData: InsertVaultItem): Promise<any>;
  getVaultItemsByAddress(address: string): Promise<any[]>;
}

class SimpleStorage implements ISimpleStorage {
  async getUserByAddress(address: string) {
    const results = await db
      .select()
      .from(users)
      .where(eq(users.address, address))
      .limit(1);
    
    return results[0] || null;
  }

  async createUser(userData: InsertUser) {
    const result = await db
      .insert(users)
      .values(userData)
      .returning();
    
    return result[0];
  }

  async updateUser(address: string, updates: Partial<InsertUser>) {
    const result = await db
      .update(users)
      .set(updates)
      .where(eq(users.address, address))
      .returning();
    
    return result[0] || null;
  }

  async createXpLog(logData: InsertXpLog) {
    const result = await db
      .insert(xpLogs)
      .values(logData)
      .returning();
    
    return result[0];
  }

  async getXpLogsByAddress(address: string) {
    return await db
      .select()
      .from(xpLogs)
      .where(eq(xpLogs.address, address))
      .orderBy(desc(xpLogs.createdAt));
  }

  async createVaultItem(itemData: InsertVaultItem) {
    const result = await db
      .insert(vaultItems)
      .values(itemData)
      .returning();
    
    return result[0];
  }

  async getVaultItemsByAddress(address: string) {
    return await db
      .select()
      .from(vaultItems)
      .where(eq(vaultItems.address, address))
      .orderBy(desc(vaultItems.createdAt));
  }
}

export const simpleStorage = new SimpleStorage();