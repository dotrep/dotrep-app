import React, { useState, useEffect } from 'react';
import { Lock, Radio, Zap } from 'lucide-react';
import { useXP } from '../context/XPContext';
import { useQuery } from '@tanstack/react-query';

const SignalPanel = () => {
  const [frequency, setFrequency] = useState(9.5);
  const [isLocked, setIsLocked] = useState(true);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const { xpPoints, rewardSignal, xp } = useXP();
  
  // Use actual XP value instead of xpPoints which might be undefined
  const actualXP = xpPoints || xp || 0;
  
  // Check trust verification status
  const [userProgress, setUserProgress] = useState(() => {
    const saved = localStorage.getItem('userProgress');
    return saved ? JSON.parse(saved) : {};
  });
  
  const isVerified = userProgress.trust?.verified === true;
  
  // Get user stats for unlock conditions
  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats'],
    refetchInterval: 5000
  });

  const pulse = userStats?.pulseScore || 55;
  const broadcasts = userStats?.broadcastCount || 0;
  
  // Check unlock conditions - use backend XP value as source of truth
  const backendXP = userStats?.xpPoints || 0;
  const signalUnlocked = backendXP >= 60; // 60 Hz equivalent
  
  // Debug logging
  console.log('Signal Debug:', { 
    contextXP: xpPoints, 
    contextXp: xp, 
    actualXP, 
    backendXP, 
    signalUnlocked, 
    isLocked, 
    threshold: 60,
    userStats 
  });
  
  useEffect(() => {
    console.log('Signal XP Update:', { 
      contextXP: xpPoints, 
      contextXp: xp, 
      actualXP, 
      backendXP, 
      threshold: 60, 
      unlocked: backendXP >= 60 
    });
  }, [xpPoints, xp, actualXP, backendXP]);
  
  // Initialize unlock state based on XP on component mount and when backend data loads
  useEffect(() => {
    if (backendXP >= 60 && isLocked) {
      console.log('Signal unlock triggered!', { backendXP, threshold: 60 });
      setJustUnlocked(true);
      setIsLocked(false);
      setTimeout(() => setJustUnlocked(false), 3000);
    }
  }, [backendXP, isLocked]);
  
  useEffect(() => {
    if (signalUnlocked && isLocked) {
      console.log('Signal unlocking via effect!', { backendXP, signalUnlocked });
      setJustUnlocked(true);
      setIsLocked(false);
      setTimeout(() => setJustUnlocked(false), 3000);
    }
  }, [signalUnlocked, isLocked, backendXP]);

  const handleFrequencyChange = (newFreq) => {
    if (!isLocked) {
      setFrequency(newFreq);
    }
  };

  const handleBroadcast = () => {
    if (!isLocked) {
      // Trigger XP reward for signal broadcasting
      rewardSignal(frequency.toFixed(1), 'broadcast');
    }
  };

  return (
    <div style={{
      position: 'relative',
      width: '320px',
      height: '320px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Signal Panel Container */}
      <div 
        className={`signal-panel ${!isLocked ? 'unlocked' : ''} ${justUnlocked ? 'just-unlocked' : ''} ${isVerified ? 'verified' : ''}`}
        style={{
          width: '280px',
          height: '200px',
          background: 'linear-gradient(135deg, rgba(0, 20, 40, 0.9) 0%, rgba(0, 30, 60, 0.9) 100%)',
          border: `3px solid ${isLocked ? '#666666' : isVerified ? '#00ff88' : '#00bcd4'}`,
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.5s ease',
          opacity: isLocked ? 0.6 : 1
        }}
      >
        {/* Lock Overlay */}
        {isLocked && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '13px',
            zIndex: 10
          }}>
            <Lock 
              size={32} 
              color="#666666"
              className="lock-pulse"
            />
            <div style={{
              fontSize: '11px',
              color: '#666666',
              fontFamily: 'Orbitron, sans-serif',
              textAlign: 'center',
              marginTop: '8px',
              lineHeight: '1.3'
            }}>
              LOCKED<br/>
              Reach {70}Hz + {100} XP
            </div>
          </div>
        )}

        {/* Signal Status */}
        <div style={{
          fontSize: '14px',
          color: isLocked ? '#666666' : '#00bcd4',
          fontFamily: 'Orbitron, sans-serif',
          fontWeight: 'bold',
          marginBottom: '12px',
          textShadow: !isLocked ? '0 0 8px rgba(0, 188, 212, 0.6)' : 'none'
        }}>
          {isLocked ? 'SIGNAL OFFLINE' : 'MODE: READY'}
        </div>

        {/* Frequency Display */}
        <div style={{
          fontSize: '32px',
          color: isLocked ? '#444444' : '#ffffff',
          fontFamily: 'Orbitron, sans-serif',
          fontWeight: 'bold',
          marginBottom: '8px',
          textShadow: !isLocked ? '0 0 15px rgba(255, 255, 255, 0.5)' : 'none'
        }}>
          {frequency.toFixed(1)} MHz
        </div>

        {/* Frequency Controls */}
        <div style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <button
            onClick={() => handleFrequencyChange(Math.max(5.0, frequency - 0.1))}
            disabled={isLocked}
            style={{
              background: isLocked ? '#333333' : 'rgba(0, 188, 212, 0.2)',
              border: `1px solid ${isLocked ? '#666666' : '#00bcd4'}`,
              color: isLocked ? '#666666' : '#00bcd4',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              fontFamily: 'Orbitron, sans-serif',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ◄◄
          </button>
          
          <button
            onClick={() => handleFrequencyChange(Math.min(16.0, frequency + 0.1))}
            disabled={isLocked}
            style={{
              background: isLocked ? '#333333' : 'rgba(0, 188, 212, 0.2)',
              border: `1px solid ${isLocked ? '#666666' : '#00bcd4'}`,
              color: isLocked ? '#666666' : '#00bcd4',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              fontFamily: 'Orbitron, sans-serif',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ►►
          </button>
        </div>

        {/* Signal Strength Bars */}
        <div style={{
          display: 'flex',
          gap: '2px',
          alignItems: 'flex-end',
          height: '20px',
          marginBottom: '12px'
        }}>
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              style={{
                width: '6px',
                height: `${((i + 1) * 20)}%`,
                background: isLocked ? '#333333' : '#00bcd4',
                borderRadius: '1px',
                opacity: isLocked ? 0.3 : (frequency > 7 + i ? 1 : 0.3),
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>

        {/* Broadcast Button */}
        {!isLocked && (
          <button
            onClick={handleBroadcast}
            style={{
              background: 'linear-gradient(135deg, rgba(0, 188, 212, 0.2) 0%, rgba(0, 255, 136, 0.2) 100%)',
              border: '2px solid #00bcd4',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '12px',
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              marginBottom: '8px',
              boxShadow: '0 4px 12px rgba(0, 188, 212, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(135deg, rgba(0, 188, 212, 0.4) 0%, rgba(0, 255, 136, 0.4) 100%)';
              e.target.style.boxShadow = '0 6px 18px rgba(0, 188, 212, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'linear-gradient(135deg, rgba(0, 188, 212, 0.2) 0%, rgba(0, 255, 136, 0.2) 100%)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 188, 212, 0.3)';
            }}
          >
            📡 BROADCAST
          </button>
        )}

        {/* Verification Status & Tooltip */}
        {!isLocked && (
          <div style={{
            position: 'absolute',
            bottom: '-35px',
            fontSize: '10px',
            color: isVerified ? 'rgba(0, 255, 136, 0.8)' : 'rgba(0, 188, 212, 0.8)',
            fontFamily: 'Orbitron, sans-serif',
            textAlign: 'center',
            fontStyle: 'italic'
          }}>
            {isVerified ? 
              '🛡️ Verified Signal Core — Enhanced amplification active' : 
              '🛰️ You\'re now broadcasting to the FSN constellation'
            }
          </div>
        )}
      </div>

      <style>{`
        .signal-panel.unlocked {
          box-shadow: 
            0 0 30px rgba(0, 188, 212, 0.6),
            0 0 60px rgba(0, 188, 212, 0.3);
        }
        
        .signal-panel.verified.unlocked {
          box-shadow: 
            0 0 30px rgba(0, 255, 136, 0.6),
            0 0 60px rgba(0, 255, 136, 0.3),
            0 0 90px rgba(0, 255, 136, 0.1);
        }
        
        .signal-panel.just-unlocked {
          animation: unlockGlow 3s ease-out;
        }
        
        .lock-pulse {
          animation: lockPulse 2s ease-in-out infinite;
        }
        
        @keyframes unlockGlow {
          0% { 
            box-shadow: 0 0 100px rgba(0, 255, 136, 0.8);
            border-color: #00ff88;
          }
          100% { 
            box-shadow: 0 0 30px rgba(0, 188, 212, 0.6);
            border-color: #00bcd4;
          }
        }
        
        @keyframes lockPulse {
          0%, 100% { 
            opacity: 0.5;
            transform: scale(1);
          }
          50% { 
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};

export default SignalPanel;