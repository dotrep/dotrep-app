// Game XP Integration Component - Task 10
// Wrapper component that adds XP triggers to any game component

import React, { useEffect, useState } from 'react';
import { awardPlayGameXP, awardWinGameXP, getCurrentUserId, canAwardXP } from '../lib/gameXP';

interface GameXPIntegrationProps {
  gameName: string;
  children: React.ReactNode;
  onGameStart?: () => void;
  onGameComplete?: (gameData: any) => void;
  onGameWin?: (gameData: any) => void;
  autoAwardPlayXP?: boolean;
}

export const GameXPIntegration: React.FC<GameXPIntegrationProps> = ({
  gameName,
  children,
  onGameStart,
  onGameComplete,
  onGameWin,
  autoAwardPlayXP = true
}) => {
  const [gameSession, setGameSession] = useState<{
    started: boolean;
    startTime: number;
    userId: number | null;
  }>({
    started: false,
    startTime: 0,
    userId: null
  });

  useEffect(() => {
    // Initialize game session when component mounts
    const userId = getCurrentUserId();
    if (userId && canAwardXP()) {
      setGameSession({
        started: false,
        startTime: Date.now(),
        userId
      });
    }
  }, []);

  const handleGameStart = async () => {
    if (!gameSession.userId || gameSession.started) return;
    
    console.log(`🎮 Starting game: ${gameName}`);
    
    // Award play XP automatically if enabled
    if (autoAwardPlayXP) {
      await awardPlayGameXP(gameSession.userId, gameName, {
        startTime: new Date().toISOString(),
        gameMode: 'standard'
      });
    }
    
    setGameSession(prev => ({ ...prev, started: true }));
    
    // Call custom onGameStart callback
    if (onGameStart) {
      onGameStart();
    }
  };

  const handleGameComplete = async (gameData: any = {}) => {
    if (!gameSession.userId || !gameSession.started) return;
    
    const sessionDuration = Date.now() - gameSession.startTime;
    const completeGameData = {
      ...gameData,
      sessionDuration,
      gameName,
      completedAt: new Date().toISOString()
    };
    
    console.log(`🏁 Game completed: ${gameName}`, completeGameData);
    
    // Call custom onGameComplete callback
    if (onGameComplete) {
      onGameComplete(completeGameData);
    }
  };

  const handleGameWin = async (gameData: any = {}) => {
    if (!gameSession.userId || !gameSession.started) return;
    
    const sessionDuration = Date.now() - gameSession.startTime;
    const winGameData = {
      ...gameData,
      sessionDuration,
      gameName,
      wonAt: new Date().toISOString()
    };
    
    console.log(`🏆 Game won: ${gameName}`, winGameData);
    
    // Award win XP
    await awardWinGameXP(gameSession.userId, gameName, winGameData);
    
    // Call custom onGameWin callback
    if (onGameWin) {
      onGameWin(winGameData);
    }
  };

  // Provide game XP methods to child components via context
  const gameXPContext = {
    startGame: handleGameStart,
    completeGame: handleGameComplete,
    winGame: handleGameWin,
    canAwardXP: canAwardXP(),
    userId: gameSession.userId,
    gameName,
    sessionStarted: gameSession.started
  };

  return (
    <div className="game-xp-wrapper">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ...child.props,
            gameXP: gameXPContext
          });
        }
        return child;
      })}
    </div>
  );
};

export default GameXPIntegration;