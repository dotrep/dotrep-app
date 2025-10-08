// Login Streak Management System - Task 7
import { storage } from './storage';
import { XPEngine } from './xpEngine';

export interface LoginStreakResult {
  newStreak: number;
  xpAwarded: number;
  milestoneReached?: number;
  isFirstLogin: boolean;
  streakBroken: boolean;
}

export class LoginStreakManager {
  
  /**
   * Handle user login and update streak with XP rewards
   * @param userId - User ID
   * @returns LoginStreakResult with streak info and XP awarded
   */
  static async handleLoginStreak(userId: number): Promise<LoginStreakResult> {
    try {
      console.log(`🔥 Processing login streak for user ${userId}...`);
      
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
      const lastLoginDate = lastLogin ? new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate()) : null;
      
      const currentStreak = user.streakDays || 0;
      
      // Check if already logged in today
      if (lastLoginDate && lastLoginDate.getTime() === today.getTime()) {
        console.log(`📅 User ${userId} already logged in today. Streak unchanged: ${currentStreak}`);
        return {
          newStreak: currentStreak,
          xpAwarded: 0,
          isFirstLogin: false,
          streakBroken: false
        };
      }
      
      let newStreak = 1;
      let streakBroken = false;
      let isFirstLogin = !lastLogin;
      
      if (lastLoginDate) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastLoginDate.getTime() === yesterday.getTime()) {
          // Consecutive day - continue streak
          newStreak = currentStreak + 1;
          console.log(`✅ Consecutive login detected. Streak: ${currentStreak} → ${newStreak}`);
        } else {
          // Streak broken - reset to 1
          newStreak = 1;
          streakBroken = currentStreak > 1;
          console.log(`💔 Streak broken after ${currentStreak} days. Reset to 1.`);
        }
      } else {
        console.log(`🎉 First login ever for user ${userId}`);
      }
      
      // Update user's streak and last login
      await storage.updateUser(userId, {
        lastLogin: now,
        streakDays: newStreak
      });
      
      // Award XP for login streaks
      let totalXPAwarded = 0;
      let milestoneReached: number | undefined = undefined;
      
      // Daily login XP (every day)
      const dailyResult = await XPEngine.awardXP(userId, 'daily_login', {
        loginDate: now.toISOString(),
        streak: newStreak,
        streakBroken
      });
      
      if (dailyResult.success) {
        totalXPAwarded += dailyResult.xpAwarded;
      }
      
      // Streak milestone XP
      const milestones = [
        { streak: 1, action: 'login_streak_1' },
        { streak: 3, action: 'login_streak_3' },
        { streak: 7, action: 'login_streak_7' },
        { streak: 14, action: 'login_streak_14' },
        { streak: 30, action: 'login_streak_30' }
      ];
      
      for (const milestone of milestones) {
        if (newStreak === milestone.streak) {
          const milestoneResult = await XPEngine.awardXP(userId, milestone.action, {
            streakMilestone: milestone.streak,
            loginDate: now.toISOString(),
            isFirstTime: isFirstLogin && milestone.streak === 1
          });
          
          if (milestoneResult.success) {
            totalXPAwarded += milestoneResult.xpAwarded;
            milestoneReached = milestone.streak;
            console.log(`🎯 Milestone reached! ${milestone.streak}-day streak = +${milestoneResult.xpAwarded} XP`);
          }
          break; // Only award one milestone per login
        }
      }
      
      console.log(`🔥 Login streak complete: User ${userId} | Streak: ${newStreak} | XP: +${totalXPAwarded}`);
      
      return {
        newStreak,
        xpAwarded: totalXPAwarded,
        milestoneReached,
        isFirstLogin,
        streakBroken
      };
      
    } catch (error) {
      console.error('Error handling login streak:', error);
      throw error;
    }
  }
  
  /**
   * Get streak statistics for a user
   * @param userId - User ID
   * @returns Streak statistics
   */
  static async getStreakStats(userId: number): Promise<{
    currentStreak: number;
    lastLogin: Date | null;
    nextMilestone: number | null;
    daysToNextMilestone: number | null;
  }> {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return {
          currentStreak: 0,
          lastLogin: null,
          nextMilestone: null,
          daysToNextMilestone: null
        };
      }
      
      const currentStreak = user.streakDays || 0;
      const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
      
      // Find next milestone
      const milestones = [1, 3, 7, 14, 30, 60, 90, 180, 365];
      const nextMilestone = milestones.find(m => m > currentStreak) || null;
      const daysToNextMilestone = nextMilestone ? nextMilestone - currentStreak : null;
      
      return {
        currentStreak,
        lastLogin,
        nextMilestone,
        daysToNextMilestone
      };
      
    } catch (error) {
      console.error('Error getting streak stats:', error);
      throw error;
    }
  }
  
  /**
   * Check if user needs to login to maintain streak
   * @param userId - User ID
   * @returns True if streak will be broken tomorrow
   */
  static async isStreakAtRisk(userId: number): Promise<boolean> {
    try {
      const user = await storage.getUser(userId);
      if (!user || !user.lastLogin) return false;
      
      const lastLogin = new Date(user.lastLogin);
      const lastLoginDate = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());
      const today = new Date();
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Streak is at risk if last login was not today
      return lastLoginDate.getTime() !== todayDate.getTime();
      
    } catch (error) {
      console.error('Error checking streak risk:', error);
      return false;
    }
  }
}