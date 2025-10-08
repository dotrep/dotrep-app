import { db } from './db';
// Trust engine temporarily disabled during schema migration
// import { userStats, vaultItems, users } from '@shared/schema';
import { eq, and, gte, sql, isNull } from 'drizzle-orm';

export interface TrustScores {
  pulseScore: number;
  signalScore: number;
  beaconStatus: 'locked' | 'warming_up' | 'active';
  xpLast7Days: number;
  nextRecoveryAction?: string;
  statusMessage?: string;
}

export class TrustEngine {
  
  // Calculate pulse score based on user's identity health
  static async calculatePulseScore(userId: number): Promise<number> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    let pulseScore = 30; // Minimum baseline
    
    // Vault not empty (+15)
    const vaultCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(vaultItems)
      .where(eq(vaultItems.userId, userId));
    
    if (vaultCount[0]?.count > 0) {
      pulseScore += 15;
    }

    // Email is set (+10)
    if (user?.email) {
      pulseScore += 10;
    }

    // Profile data set (+10)
    if (user?.firstName || user?.lastName) {
      pulseScore += 10;
    }

    // Check login streak - get last activity
    const [stats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId));

    if (stats?.lastActive) {
      const daysSinceActive = Math.floor(
        (Date.now() - new Date(stats.lastActive).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Recent activity bonus (+15)
      if (daysSinceActive <= 1) {
        pulseScore += 15;
      }

      // Apply decay for inactivity
      if (daysSinceActive === 3) {
        pulseScore -= 5;
      } else if (daysSinceActive >= 4 && daysSinceActive <= 6) {
        pulseScore -= 10;
      } else if (daysSinceActive >= 7) {
        pulseScore -= 15;
      }
    }

    // FSN name active (+10)
    // This would check if user has an active FSN domain registration
    pulseScore += 10; // Simplified for now

    // Ensure pulse never drops below 30
    return Math.max(Math.min(pulseScore, 100), 30);
  }

  // Calculate signal score based on behavioral trust
  static async calculateSignalScore(userId: number, pulseScore: number): Promise<number> {
    // Get current user stats
    const [stats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId));

    if (!stats) return 0;

    let signalScore = 0;

    // XP earned in last 7 days (+30)
    if ((stats.xpLast7Days || 0) > 0) {
      signalScore += Math.min(30, (stats.xpLast7Days || 0) / 10); // 10 XP = 1 signal point
    }

    // Recent vault activity (+20)
    const recentUploads = await db
      .select({ count: sql<number>`count(*)` })
      .from(vaultItems)
      .where(and(
        eq(vaultItems.userId, userId),
        gte(vaultItems.createdAt, sql`NOW() - INTERVAL '7 days'`)
      ));

    if (recentUploads[0]?.count > 0) {
      signalScore += 20;
    }

    // Invitations completed (+15)
    if ((stats.invitedCount || 0) > 0) {
      signalScore += Math.min(15, (stats.invitedCount || 0) * 5);
    }

    // Social interactions bonus (+10)
    if ((stats.connectionsCount || 0) > 0) {
      signalScore += Math.min(10, (stats.connectionsCount || 0) * 2);
    }

    // Check for inactivity decay
    if (stats.lastActive) {
      const daysSinceActive = Math.floor(
        (Date.now() - new Date(stats.lastActive).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceActive >= 7) {
        signalScore -= 10;
      }
    }

    // Signal is capped by pulse score
    const rawSignal = Math.max(0, Math.min(signalScore, 100));
    return Math.min(rawSignal, pulseScore);
  }

  // Determine beacon status
  static calculateBeaconStatus(pulseScore: number, signalScore: number): 'locked' | 'warming_up' | 'active' {
    if (pulseScore >= 70 && signalScore >= 80) {
      return 'active';
    } else if (pulseScore >= 60 && signalScore >= 60) {
      return 'warming_up';
    }
    return 'locked';
  }

  // Get recovery suggestions
  static getRecoveryAction(pulseScore: number, signalScore: number, hasVaultItems: boolean): string {
    if (pulseScore < 60) {
      if (!hasVaultItems) {
        return "Upload a file to your Vault to stabilize your Pulse";
      }
      return "Log in daily to maintain your Pulse strength";
    }
    
    if (signalScore < pulseScore * 0.8) {
      return "Complete quests or earn XP to boost your Signal";
    }

    if (pulseScore >= 70 && signalScore >= 80) {
      return "Beacon ready! You're broadcasting trust globally";
    }

    return "Keep building your crypto presence to unlock Beacon";
  }

  // Calculate XP earned in last 7 days
  static async calculateXpLast7Days(userId: number): Promise<number> {
    // This would integrate with XP tracking system
    // For now, using a simplified calculation based on current XP
    const [stats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId));

    if (!stats) return 0;

    // Simplified: assume recent activity based on last login
    if (stats.lastActive) {
      const daysSinceActive = Math.floor(
        (Date.now() - new Date(stats.lastActive).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceActive <= 7) {
        // Estimate recent XP based on total (this should be replaced with actual tracking)
        return Math.min(stats.xpPoints || 0, 150); // Cap at 150 for weekly estimate
      }
    }

    return 0;
  }

  // Main function to get all trust scores
  static async getTrustScores(userId: number): Promise<TrustScores> {
    const pulseScore = await this.calculatePulseScore(userId);
    const xpLast7Days = await this.calculateXpLast7Days(userId);
    const signalScore = await this.calculateSignalScore(userId, pulseScore);
    const beaconStatus = this.calculateBeaconStatus(pulseScore, signalScore);

    // Check if user has vault items for recovery suggestions
    const vaultCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(vaultItems)
      .where(eq(vaultItems.userId, userId));
    
    const hasVaultItems = (vaultCount[0]?.count || 0) > 0;
    const nextRecoveryAction = this.getRecoveryAction(pulseScore, signalScore, hasVaultItems);

    let statusMessage = "Trust must be earned — and maintained. But it's always recoverable.";
    
    if (signalScore < pulseScore && pulseScore < 70) {
      statusMessage = "Your Signal is strong — but capped by a low Pulse. Boost your identity to broadcast at full range.";
    } else if (beaconStatus === 'active') {
      statusMessage = "Beacon active! Broadcasting trust globally across FSN.";
    } else if (beaconStatus === 'warming_up') {
      statusMessage = "Beacon warming up. Continue building trust to achieve full activation.";
    }

    return {
      pulseScore,
      signalScore,
      beaconStatus,
      xpLast7Days,
      nextRecoveryAction,
      statusMessage
    };
  }

  // Update user stats with new trust scores
  static async updateTrustScores(userId: number): Promise<TrustScores> {
    const scores = await this.getTrustScores(userId);

    await db
      .update(userStats)
      .set({
        pulseScore: scores.pulseScore,
        signalScore: scores.signalScore,
        beaconStatus: scores.beaconStatus,
        xpLast7Days: scores.xpLast7Days,
        lastActivityCheck: new Date()
      })
      .where(eq(userStats.userId, userId));

    return scores;
  }
}