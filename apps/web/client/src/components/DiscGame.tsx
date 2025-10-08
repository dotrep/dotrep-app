import React, { useEffect, useRef, useState } from 'react';
import { awardPlayGameXP, awardWinGameXP, awardGameMilestoneXP, getCurrentUserId } from '../lib/gameXP';

interface DiscGameProps {
  onExit: () => void;
}

const DiscGame: React.FC<DiscGameProps> = ({ onExit }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    // Award XP for starting the game
    if (isLoaded && !gameStarted) {
      const userId = getCurrentUserId();
      if (userId) {
        awardPlayGameXP(userId, 'disc_game', {
          gameMode: 'arcade',
          startTime: new Date().toISOString()
        });
        setGameStarted(true);
      }
    }
  }, [isLoaded, gameStarted]);

  useEffect(() => {
    // Listen for messages from the game iframe
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'exitGame') {
        onExit();
      }
      
      // Handle game completion events from iframe
      if (event.data?.type === 'gameComplete') {
        const userId = getCurrentUserId();
        if (userId) {
          const { score, hits, accuracy, timeElapsed } = event.data.gameData || {};
          
          console.log('🎯 DISC Game completed:', { score, hits, accuracy, timeElapsed });
          
          // Award win XP for good performance
          if (score && score >= 100) {
            await awardWinGameXP(userId, 'disc_game', {
              score,
              hits,
              accuracy,
              timeElapsed,
              performance: 'excellent'
            });
          }
          
          // Award milestone XP for exceptional performance
          if (accuracy && accuracy >= 90) {
            await awardGameMilestoneXP(userId, 'disc_game', 'marksman', {
              accuracy,
              score,
              hits
            });
          }
        }
      }
      
      // Handle high score achievements
      if (event.data?.type === 'highScore') {
        const userId = getCurrentUserId();
        if (userId) {
          await awardGameMilestoneXP(userId, 'disc_game', 'high_score', {
            newRecord: event.data.score,
            previousBest: event.data.previousScore
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onExit]);

  const handleIframeLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {!isLoaded && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#00ffff',
          fontSize: '24px',
          fontFamily: 'monospace',
          textShadow: '0 0 20px #00ffff'
        }}>
          Loading DISC Game...
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src="/games/disc/index.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
        title="DISC Game"
        onLoad={handleIframeLoad}
      />
      
      <button
        onClick={onExit}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '12px 20px',
          background: 'rgba(255, 0, 100, 0.2)',
          border: '2px solid #ff0064',
          color: '#ff0064',
          fontFamily: 'monospace',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          borderRadius: '4px',
          textShadow: '0 0 8px #ff0064',
          boxShadow: '0 0 15px rgba(255, 0, 100, 0.3)',
          transition: 'all 0.2s ease',
          zIndex: 2001
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 0, 100, 0.4)';
          e.currentTarget.style.boxShadow = '0 0 25px rgba(255, 0, 100, 0.6)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 0, 100, 0.2)';
          e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 0, 100, 0.3)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        ↩ Exit Game
      </button>
    </div>
  );
};

export default DiscGame;