// useGameXP Hook - Task 10
// React hook for easy game XP integration

import { useState, useCallback, useEffect } from 'react';
import { 
  awardPlayGameXP, 
  awardWinGameXP, 
  awardGameMilestoneXP, 
  getCurrentUserId, 
  canAwardXP 
} from '../lib/gameXP';

interface GameSession {
  userId: number | null;
  gameName: string;
  startTime: number;
  isActive: boolean;
  xpAwarded: number;
}

interface UseGameXPOptions {
  gameName: string;
  autoStartXP?: boolean;
}

export const useGameXP = ({ gameName, autoStartXP = true }: UseGameXPOptions) => {
  const [session, setSession] = useState<GameSession>({
    userId: getCurrentUserId(),
    gameName,
    startTime: 0,
    isActive: false,
    xpAwarded: 0
  });

  const [xpHistory, setXpHistory] = useState<Array<{
    action: string;
    xp: number;
    timestamp: number;
  }>>([]);

  // Initialize session
  useEffect(() => {
    const userId = getCurrentUserId();
    setSession(prev => ({
      ...prev,
      userId,
      gameName
    }));
  }, [gameName]);

  // Start game and award initial XP
  const startGame = useCallback(async (gameData: Record<string, any> = {}) => {
    if (!session.userId || session.isActive) return null;
    
    console.log(`🎮 Starting ${gameName} with XP tracking`);
    
    setSession(prev => ({
      ...prev,
      startTime: Date.now(),
      isActive: true
    }));

    if (autoStartXP && canAwardXP()) {
      const result = await awardPlayGameXP(session.userId, gameName, {
        startTime: new Date().toISOString(),
        ...gameData
      });
      
      if (result.success) {
        setSession(prev => ({
          ...prev,
          xpAwarded: prev.xpAwarded + result.xpAwarded
        }));
        
        setXpHistory(prev => [...prev, {
          action: 'play_game',
          xp: result.xpAwarded,
          timestamp: Date.now()
        }]);
      }
      
      return result;
    }
    
    return null;
  }, [session.userId, session.isActive, gameName, autoStartXP]);

  // Award win XP
  const winGame = useCallback(async (gameData: Record<string, any> = {}) => {
    if (!session.userId || !session.isActive) return null;
    
    console.log(`🏆 ${gameName} won with XP reward`);
    
    const sessionDuration = Date.now() - session.startTime;
    const result = await awardWinGameXP(session.userId, gameName, {
      sessionDuration,
      wonAt: new Date().toISOString(),
      ...gameData
    });
    
    if (result.success) {
      setSession(prev => ({
        ...prev,
        xpAwarded: prev.xpAwarded + result.xpAwarded
      }));
      
      setXpHistory(prev => [...prev, {
        action: 'win_game',
        xp: result.xpAwarded,
        timestamp: Date.now()
      }]);
    }
    
    return result;
  }, [session.userId, session.isActive, session.startTime, gameName]);

  // Award milestone XP
  const achieveMilestone = useCallback(async (
    milestone: string, 
    gameData: Record<string, any> = {}
  ) => {
    if (!session.userId || !session.isActive) return null;
    
    console.log(`🎯 ${gameName} milestone achieved: ${milestone}`);
    
    const result = await awardGameMilestoneXP(session.userId, gameName, milestone, {
      sessionDuration: Date.now() - session.startTime,
      achievedAt: new Date().toISOString(),
      ...gameData
    });
    
    if (result.success) {
      setSession(prev => ({
        ...prev,
        xpAwarded: prev.xpAwarded + result.xpAwarded
      }));
      
      setXpHistory(prev => [...prev, {
        action: 'game_milestone',
        xp: result.xpAwarded,
        timestamp: Date.now()
      }]);
    }
    
    return result;
  }, [session.userId, session.isActive, session.startTime, gameName]);

  // End game session
  const endGame = useCallback((gameData: Record<string, any> = {}) => {
    if (!session.isActive) return;
    
    console.log(`🏁 ${gameName} session ended`, {
      duration: Date.now() - session.startTime,
      totalXP: session.xpAwarded,
      ...gameData
    });
    
    setSession(prev => ({
      ...prev,
      isActive: false
    }));
  }, [session.isActive, session.startTime, session.xpAwarded, gameName]);

  // Reset session
  const resetSession = useCallback(() => {
    setSession(prev => ({
      ...prev,
      startTime: 0,
      isActive: false,
      xpAwarded: 0
    }));
    setXpHistory([]);
  }, []);

  return {
    // Session info
    session,
    xpHistory,
    canAwardXP: canAwardXP(),
    
    // Actions
    startGame,
    winGame,
    achieveMilestone,
    endGame,
    resetSession,
    
    // Computed values
    sessionDuration: session.isActive ? Date.now() - session.startTime : 0,
    totalSessionXP: session.xpAwarded,
    isGameActive: session.isActive
  };
};

export default useGameXP;