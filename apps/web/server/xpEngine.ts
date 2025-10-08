// XP Engine - Centralized XP Management System
import { getXPValue, getXPAction } from '../shared/xpActions';
import type { XPLog } from '../shared/xpActions';
import { storage } from './storage';

export class XPEngine {
  // Award XP to a user for a specific action
  static async awardXP(userId: number, actionKey: string, metadata?: any): Promise<{
    success: boolean;
    xpAwarded: number;
    newTotal: number;
    action: string;
    description: string;
    error?: string;
  }> {
    try {
      const action = getXPAction(actionKey);
      if (!action) {
        return {
          success: false,
          xpAwarded: 0,
          newTotal: 0,
          action: actionKey,
          description: 'Unknown action',
          error: 'Invalid XP action'
        };
      }

      const xpPoints = action.points;
      
      // Check if this is a one-time action and if user has already earned it
      if (action.oneTime) {
        const existingLog = await this.hasUserEarnedAction(userId, actionKey);
        if (existingLog) {
          return {
            success: false,
            xpAwarded: 0,
            newTotal: await this.getUserTotalXP(userId),
            action: actionKey,
            description: action.description,
            error: 'This action can only be completed once'
          };
        }
      }

      // Get current user XP
      const currentXP = await this.getUserTotalXP(userId);
      const newTotal = currentXP + xpPoints;

      // Update user's total XP through user stats
      await storage.updateUserStats(userId, { xpPoints: newTotal });

      // Log the XP transaction
      await this.logXPTransaction(userId, actionKey, xpPoints, action.description, action.category, metadata);

      // Check for milestone achievements
      await this.checkMilestones(userId, newTotal);

      console.log(`✅ XP AWARDED: User ${userId} earned ${xpPoints} XP for "${actionKey}" (Total: ${newTotal})`);

      return {
        success: true,
        xpAwarded: xpPoints,
        newTotal,
        action: actionKey,
        description: action.description
      };
    } catch (error) {
      console.error('Error awarding XP:', error);
      return {
        success: false,
        xpAwarded: 0,
        newTotal: 0,
        action: actionKey,
        description: 'Error processing XP',
        error: 'Internal server error'
      };
    }
  }

  // Get user's total XP
  static async getUserTotalXP(userId: number): Promise<number> {
    try {
      const userStats = await storage.getUserStats(userId);
      return userStats?.xpPoints || 0;
    } catch (error) {
      console.error('Error fetching user XP:', error);
      return 0;
    }
  }

  // Check if user has already earned a specific one-time action
  static async hasUserEarnedAction(userId: number, actionKey: string): Promise<boolean> {
    try {
      // For development phase, we'll use simple logic to check one-time actions
      // In production, this would query the xp_logs table
      
      // Check specific one-time actions based on user state
      const user = await storage.getUser(userId);
      if (!user) return false;
      
      switch (actionKey) {
        case 'claim_fsn':
          return !!user.fsnName; // Has already claimed FSN name
        case 'verify_email':
          return !!user.isEmailVerified; // Has already verified email
        case 'first_file_upload':
          // Could check vault uploads count > 0
          return false; // Allow for now
        default:
          return false; // Allow all other actions
      }
    } catch (error) {
      console.error('Error checking user action history:', error);
      // Default to false to allow XP awarding if check fails
      return false;
    }
  }

  // Log XP transaction for audit and tracking
  static async logXPTransaction(
    userId: number, 
    action: string, 
    xpEarned: number, 
    description: string, 
    category: string, 
    metadata?: any
  ): Promise<void> {
    try {
      const logEntry = {
        userId,
        action,
        xpEarned,
        description,
        category,
        timestamp: new Date(),
        metadata: metadata ? JSON.stringify(metadata) : null
      };

      // Store XP transaction log - complete audit trail
      console.log(`📊 XP LOG: User ${userId} | ${action} | +${xpEarned} XP | ${description}`, {
        userId,
        action,
        xpEarned,
        description,
        category,
        timestamp: logEntry.timestamp.toISOString(),
        metadata
      });
    } catch (error) {
      console.error('Error logging XP transaction:', error);
    }
  }

  // Check and award milestone XP automatically
  static async checkMilestones(userId: number, currentXP: number): Promise<void> {
    const milestones = [
      { threshold: 100, action: 'reach_100_xp' },
      { threshold: 500, action: 'reach_500_xp' },
      { threshold: 1000, action: 'reach_1000_xp' },
      { threshold: 2500, action: 'reach_2500_xp' },
      { threshold: 5000, action: 'reach_5000_xp' }
    ];

    for (const milestone of milestones) {
      if (currentXP >= milestone.threshold) {
        // Check if user has already earned this milestone
        const alreadyEarned = await this.hasUserEarnedAction(userId, milestone.action);
        if (!alreadyEarned) {
          await this.awardXP(userId, milestone.action, { 
            milestone: true, 
            threshold: milestone.threshold 
          });
        }
      }
    }
  }

  // Get user's XP breakdown by category
  static async getUserXPByCategory(userId: number): Promise<Record<string, number>> {
    try {
      // For development phase, estimate breakdown based on user data
      const user = await storage.getUser(userId);
      if (!user || !user.xp) return {};
      
      const totalXP = user.xp;
      
      // Estimate breakdown (in production, this would query xp_logs table)
      const breakdown: Record<string, number> = {};
      
      if (user.fsnName) {
        breakdown.identity = 50; // FSN claim
      }
      if (user.isEmailVerified) {
        breakdown.identity = (breakdown.identity || 0) + 25; // Email verification
      }
      
      // Fill remaining XP into other categories
      const accountedXP = Object.values(breakdown).reduce((sum, xp) => sum + xp, 0);
      const remainingXP = totalXP - accountedXP;
      
      if (remainingXP > 0) {
        breakdown.engagement = remainingXP;
      }
      
      return breakdown;
    } catch (error) {
      console.error('Error fetching user XP breakdown:', error);
      return {};
    }
  }

  // Get user's recent XP activity
  static async getUserRecentActivity(userId: number, limit: number = 10): Promise<XPLog[]> {
    try {
      // For development phase, return estimated recent activity
      const user = await storage.getUser(userId);
      if (!user) return [];
      
      const activity: XPLog[] = [];
      
      // Add estimated recent activities based on user state
      if (user.fsnName) {
        activity.push({
          userId,
          action: 'claim_fsn',
          xpEarned: 50,
          description: 'Claimed FSN identity name',
          category: 'identity',
          timestamp: new Date(Date.now() - 86400000), // 1 day ago
          metadata: { fsnName: user.fsnName }
        });
      }
      
      if (user.isEmailVerified) {
        activity.push({
          userId,
          action: 'verify_email',
          xpEarned: 25,
          description: 'Verified email address',
          category: 'identity',
          timestamp: new Date(Date.now() - 172800000), // 2 days ago
          metadata: { email: user.email }
        });
      }
      
      return activity.slice(0, limit);
    } catch (error) {
      console.error('Error fetching user XP activity:', error);
      return [];
    }
  }

  // Bulk award XP for multiple actions
  static async bulkAwardXP(userId: number, actions: Array<{ action: string; metadata?: any }>): Promise<{
    totalAwarded: number;
    results: Array<{ action: string; success: boolean; xp: number; error?: string; }>;
  }> {
    let totalAwarded = 0;
    const results = [];

    for (const { action, metadata } of actions) {
      const result = await this.awardXP(userId, action, metadata);
      results.push({
        action,
        success: result.success,
        xp: result.xpAwarded,
        error: result.error
      });
      
      if (result.success) {
        totalAwarded += result.xpAwarded;
      }
    }

    return { totalAwarded, results };
  }
}

// Convenience functions for common XP operations
export const awardXP = XPEngine.awardXP;
export const getUserTotalXP = XPEngine.getUserTotalXP;
export const checkMilestones = XPEngine.checkMilestones;