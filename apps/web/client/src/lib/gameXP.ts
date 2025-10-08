// Game XP Reward System - Task 10
// Centralized XP awarding for game actions using the XP Engine from Task 6

interface GameXPResult {
  success: boolean;
  xpAwarded: number;
  action: string;
  error?: string;
}

/**
 * Award XP for game actions using the centralized XP Engine
 * @param userId - User ID to award XP to
 * @param action - XP action key from xpActions.ts
 * @param gameMetadata - Additional game-specific metadata
 * @returns Promise with award result
 */
export const awardGameXP = async (
  userId: number, 
  action: string, 
  gameMetadata: Record<string, any> = {}
): Promise<GameXPResult> => {
  try {
    console.log(`🎮 Awarding game XP: User ${userId}, Action: ${action}`, gameMetadata);
    
    const response = await fetch('/api/xp/award', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        action,
        metadata: {
          source: 'game_center',
          timestamp: new Date().toISOString(),
          ...gameMetadata
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to award XP');
    }

    const result = await response.json();
    
    console.log(`✅ Game XP awarded successfully:`, result);
    
    return {
      success: true,
      xpAwarded: result.xpAwarded,
      action: result.action
    };
    
  } catch (error) {
    console.error('❌ Failed to award game XP:', error);
    return {
      success: false,
      xpAwarded: 0,
      action,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Award XP for playing a game (participation bonus)
 * @param userId - User ID
 * @param gameName - Name of the game played
 * @param gameData - Game-specific data (score, time, etc.)
 */
export const awardPlayGameXP = async (
  userId: number, 
  gameName: string, 
  gameData: Record<string, any> = {}
): Promise<GameXPResult> => {
  return awardGameXP(userId, 'play_game', {
    gameName,
    ...gameData
  });
};

/**
 * Award XP for winning a game (performance bonus)
 * @param userId - User ID
 * @param gameName - Name of the game won
 * @param gameData - Game-specific data (score, time, etc.)
 */
export const awardWinGameXP = async (
  userId: number, 
  gameName: string, 
  gameData: Record<string, any> = {}
): Promise<GameXPResult> => {
  return awardGameXP(userId, 'win_game', {
    gameName,
    victory: true,
    ...gameData
  });
};

/**
 * Award XP for achieving high scores or milestones
 * @param userId - User ID
 * @param gameName - Name of the game
 * @param milestone - Milestone achieved
 * @param gameData - Game-specific data
 */
export const awardGameMilestoneXP = async (
  userId: number, 
  gameName: string, 
  milestone: string,
  gameData: Record<string, any> = {}
): Promise<GameXPResult> => {
  return awardGameXP(userId, 'game_milestone', {
    gameName,
    milestone,
    ...gameData
  });
};

/**
 * Get current user ID from localStorage or session
 * @returns User ID or null if not logged in
 */
export const getCurrentUserId = (): number | null => {
  const userId = localStorage.getItem('userId');
  return userId ? parseInt(userId) : null;
};

/**
 * Check if user is logged in for XP awarding
 * @returns Boolean indicating if user can receive XP
 */
export const canAwardXP = (): boolean => {
  return getCurrentUserId() !== null;
};

// Game-specific XP award helpers
export const GameXPTriggers = {
  
  /**
   * Memory Game XP Logic
   * Awards play XP when game starts, win XP when completed successfully
   */
  memoryGame: {
    onGameStart: async (userId: number, difficulty: string = 'normal') => {
      return awardPlayGameXP(userId, 'memory_game', { 
        difficulty,
        gameStarted: true 
      });
    },
    
    onGameWin: async (userId: number, moves: number, timeSeconds: number, difficulty: string = 'normal') => {
      const result = await awardWinGameXP(userId, 'memory_game', {
        difficulty,
        moves,
        timeSeconds,
        efficiency: moves < 20 ? 'excellent' : moves < 30 ? 'good' : 'average'
      });
      
      // Bonus XP for exceptional performance
      if (moves < 15 && timeSeconds < 60) {
        await awardGameMilestoneXP(userId, 'memory_game', 'perfect_game', {
          moves,
          timeSeconds
        });
      }
      
      return result;
    }
  },

  /**
   * Click Speed Game XP Logic
   * Awards XP based on performance thresholds
   */
  clickSpeedGame: {
    onGameComplete: async (userId: number, clicks: number, timeSeconds: number = 10) => {
      const cps = clicks / timeSeconds;
      
      // Award play XP for participation
      await awardPlayGameXP(userId, 'click_speed_game', {
        clicks,
        timeSeconds,
        clicksPerSecond: cps
      });
      
      // Award win XP for good performance (30+ clicks in 10 seconds)
      if (clicks >= 30) {
        return awardWinGameXP(userId, 'click_speed_game', {
          clicks,
          timeSeconds,
          clicksPerSecond: cps,
          performance: 'excellent'
        });
      }
      
      // Award milestone XP for exceptional performance (50+ clicks)
      if (clicks >= 50) {
        await awardGameMilestoneXP(userId, 'click_speed_game', 'speed_demon', {
          clicks,
          clicksPerSecond: cps
        });
      }
      
      return { success: true, xpAwarded: 0, action: 'participation_only' };
    }
  },

  /**
   * Reaction Time Game XP Logic
   */
  reactionGame: {
    onGameComplete: async (userId: number, reactionTimeMs: number, attempts: number) => {
      // Award play XP for participation
      await awardPlayGameXP(userId, 'reaction_game', {
        reactionTimeMs,
        attempts
      });
      
      // Award win XP for fast reactions (under 300ms)
      if (reactionTimeMs < 300) {
        return awardWinGameXP(userId, 'reaction_game', {
          reactionTimeMs,
          attempts,
          performance: 'lightning_fast'
        });
      }
      
      // Award milestone XP for superhuman reactions (under 200ms)
      if (reactionTimeMs < 200) {
        await awardGameMilestoneXP(userId, 'reaction_game', 'superhuman_reflexes', {
          reactionTimeMs
        });
      }
      
      return { success: true, xpAwarded: 0, action: 'participation_only' };
    }
  }
};