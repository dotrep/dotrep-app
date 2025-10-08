// Daily XP minting service - bridges database tracking with on-chain awards
import { ethers } from 'ethers';
import { storage } from '../storage';
import { eq, and } from 'drizzle-orm';

// Points contract ABI (simplified for award function)
const pointsABI = [
  {
    "type": "function",
    "name": "award",
    "inputs": [
      {"name": "user", "type": "address"},
      {"name": "amount", "type": "uint256"},
      {"name": "actionId", "type": "bytes32"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
] as const;

// Environment configuration
const config = {
  AWARD_ONCHAIN: process.env.AWARD_ONCHAIN === 'true',
  AWARD_PRIVATE_KEY: process.env.AWARD_PRIVATE_KEY || '',
  RPC_URL: process.env.RPC_URL || 'http://127.0.0.1:8545',
  POINTS_ADDRESS: process.env.POINTS_ADDRESS || '0x1234567890123456789012345678901234567890',
  AWARD_XP_DAILY: parseInt(process.env.AWARD_XP_DAILY || '10'),
};

interface DailyLoginUser {
  address: string;
  userId: number;
  lastLogin: Date;
}

// Generate stable actionId for idempotency
function generateActionId(address: string, type: string, dayKey: string): string {
  const data = `${address.toLowerCase()}|${type}|${dayKey}`;
  return ethers.keccak256(ethers.toUtf8Bytes(data));
}

// Get today's day key in UTC
function getTodayDayKey(): string {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Query users who logged in today and need daily XP
async function getUsersForDailyAward(dayKey: string): Promise<DailyLoginUser[]> {
  try {
    const todayStart = new Date(dayKey + 'T00:00:00.000Z');
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    // Get users who logged in today and have wallet addresses
    const query = `
      SELECT DISTINCT u.id as "userId", u."walletLinked" as address, u."lastLogin"
      FROM users u 
      WHERE u."lastLogin" >= $1 
        AND u."lastLogin" < $2
        AND u."walletLinked" IS NOT NULL 
        AND u."walletLinked" != ''
    `;
    
    const rawUsers = await storage.db.execute(query, [todayStart, tomorrowStart]);
    
    // Filter out users who already received daily XP today
    const filteredUsers: DailyLoginUser[] = [];
    
    for (const user of rawUsers) {
      const existingLog = await storage.db.select()
        .from(storage.schema.xpLogs)
        .where(
          and(
            eq(storage.schema.xpLogs.address, user.address.toLowerCase()),
            eq(storage.schema.xpLogs.type, 'daily'),
            eq(storage.schema.xpLogs.dayKey, dayKey),
            eq(storage.schema.xpLogs.onchain, true)
          )
        )
        .limit(1);
      
      if (existingLog.length === 0) {
        filteredUsers.push({
          address: user.address.toLowerCase(),
          userId: user.userId,
          lastLogin: user.lastLogin
        });
      }
    }
    
    return filteredUsers;
  } catch (error) {
    console.error('Error querying users for daily award:', error);
    return [];
  }
}

// Award XP on-chain through Points contract
async function awardXPOnChain(
  address: string, 
  amount: number, 
  actionId: string
): Promise<{ txHash?: string; error?: string }> {
  try {
    if (!config.AWARD_ONCHAIN) {
      console.log(`STEALTH mode: Skipping on-chain award for ${address}`);
      return {}; // Success but no tx
    }
    
    if (!config.AWARD_PRIVATE_KEY) {
      throw new Error('AWARD_PRIVATE_KEY not configured');
    }
    
    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider(config.RPC_URL);
    const wallet = new ethers.Wallet(config.AWARD_PRIVATE_KEY, provider);
    const pointsContract = new ethers.Contract(config.POINTS_ADDRESS, pointsABI, wallet);
    
    // Call Points.award(user, amount, actionId)
    console.log(`Awarding ${amount} XP to ${address} with actionId ${actionId}`);
    const tx = await pointsContract.award(address, amount, actionId);
    
    console.log(`Transaction sent: ${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    
    return { txHash: tx.hash };
  } catch (error: any) {
    console.error(`Failed to award XP on-chain for ${address}:`, error);
    
    // Check if it's a duplicate actionId error
    if (error.message && error.message.includes('used')) {
      console.log(`ActionId already used for ${address}, marking as success`);
      return {}; // Treat as success
    }
    
    return { error: error.message || 'Unknown error' };
  }
}

// Log XP award to database
async function logXPAward(
  address: string,
  type: string,
  dayKey: string,
  actionId: string,
  amount: number,
  txHash?: string,
  onchain: boolean = false,
  errorMessage?: string
) {
  try {
    await storage.db.insert(storage.schema.xpLogs).values({
      address: address.toLowerCase(),
      type,
      dayKey,
      actionId,
      amount,
      txHash,
      onchain,
      errorMessage,
    });
    
    console.log(`Logged XP award: ${address} - ${amount} XP - ${type} - ${dayKey}`);
  } catch (error) {
    console.error('Failed to log XP award:', error);
  }
}

// Main daily XP minting function
export async function mintDailyXP(): Promise<{
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}> {
  console.log('🚀 Starting daily XP minting process...');
  
  const dayKey = getTodayDayKey();
  const results = {
    processed: 0,
    successful: 0,
    failed: 0,
    errors: [] as string[]
  };
  
  try {
    // Get users who need daily XP
    const users = await getUsersForDailyAward(dayKey);
    console.log(`Found ${users.length} users eligible for daily XP award`);
    
    if (users.length === 0) {
      console.log('No users need daily XP awards today');
      return results;
    }
    
    // Process in batches of 50 to avoid rate limits
    const batchSize = 50;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(users.length/batchSize)}`);
      
      for (const user of batch) {
        results.processed++;
        
        const actionId = generateActionId(user.address, 'daily', dayKey);
        
        // Award on-chain (or skip in STEALTH mode)
        const awardResult = await awardXPOnChain(user.address, config.AWARD_XP_DAILY, actionId);
        
        if (awardResult.error) {
          // Failed to award
          results.failed++;
          results.errors.push(`${user.address}: ${awardResult.error}`);
          
          await logXPAward(
            user.address,
            'daily',
            dayKey,
            actionId,
            config.AWARD_XP_DAILY,
            undefined,
            false,
            awardResult.error
          );
        } else {
          // Success (either on-chain or STEALTH mode)
          results.successful++;
          
          await logXPAward(
            user.address,
            'daily',
            dayKey,
            actionId,
            config.AWARD_XP_DAILY,
            awardResult.txHash,
            config.AWARD_ONCHAIN,
            undefined
          );
        }
        
        // Add small delay between awards to be nice to RPC
        if (config.AWARD_ONCHAIN) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }
    
    console.log(`✅ Daily XP minting complete: ${results.successful}/${results.processed} successful`);
    
  } catch (error) {
    console.error('Fatal error in daily XP minting:', error);
    results.errors.push(`Fatal error: ${error}`);
  }
  
  return results;
}

// Get XP logs for a specific user and day
export async function getUserXPLogs(address: string, dayKey?: string) {
  try {
    let whereConditions = [eq(storage.schema.xpLogs.address, address.toLowerCase())];
    
    if (dayKey) {
      whereConditions.push(eq(storage.schema.xpLogs.dayKey, dayKey));
    }
    
    return await storage.db.select()
      .from(storage.schema.xpLogs)
      .where(and(...whereConditions))
      .orderBy(storage.db.desc(storage.schema.xpLogs.createdAt));
  } catch (error) {
    console.error('Error getting user XP logs:', error);
    return [];
  }
}

// Get daily XP stats
export async function getDailyXPStats(dayKey?: string) {
  const targetDay = dayKey || getTodayDayKey();
  
  try {
    const logs = await storage.db.select()
      .from(storage.schema.xpLogs)
      .where(
        and(
          eq(storage.schema.xpLogs.type, 'daily'),
          eq(storage.schema.xpLogs.dayKey, targetDay)
        )
      );
    
    const onchain = logs.filter(log => log.onchain).length;
    const total = logs.length;
    const totalXP = logs.reduce((sum, log) => sum + log.amount, 0);
    
    return {
      dayKey: targetDay,
      totalUsers: total,
      onchainUsers: onchain,
      totalXPAwarded: totalXP,
      pendingUsers: total - onchain
    };
  } catch (error) {
    console.error('Error getting daily XP stats:', error);
    return null;
  }
}