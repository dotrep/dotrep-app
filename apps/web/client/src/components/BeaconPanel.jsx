import React, { useState, useEffect } from 'react';
import { Radio, Lock, Info } from 'lucide-react';
import { useXP } from '../context/XPContext';
import { useQuery } from '@tanstack/react-query';
import { rewardsEmitter } from '@/hooks/useRewardsListener';

const BeaconPanel = () => {
  const [showTooltip, setShowTooltip] = useState(null);
  const [isRecasting, setIsRecasting] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [recastAnimation, setRecastAnimation] = useState(false);
  const { xpPoints, rewardQuest } = useXP();
  
  // Get user stats for beacon calculations
  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats'],
    refetchInterval: 5000
  });

  const pulse = userStats?.pulseScore || 55;
  const broadcasts = userStats?.signalsSent || 0;
  const loginStreak = userStats?.currentLoginStreak || 5;
  const currentXP = userStats?.xpPoints || xpPoints || 0;
  
  // Signal unlock condition
  const signalUnlocked = pulse >= 70 && currentXP >= 100 && broadcasts >= 1;
  
  // Beacon unlock and tier logic
  const beaconUnlocked = signalUnlocked && loginStreak >= 3;
  
  const getBeaconLevel = () => {
    if (!beaconUnlocked) return 0;
    
    // Phase 0: Simplified beacon levels without trust verification requirement
    if (broadcasts >= 5) return 2;
    return 1;
  };

  const beaconLevel = getBeaconLevel();

  // Check cooldown status on component mount
  useEffect(() => {
    const checkCooldown = async () => {
      try {
        const response = await fetch('/api/beacon/recast/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        const data = await response.json();
        if (data.cooldown_remaining > 0) {
          setCooldownRemaining(data.cooldown_remaining);
        }
      } catch (error) {
        console.log('Could not check cooldown status');
      }
    };
    checkCooldown();
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setInterval(() => {
        setCooldownRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // When countdown reaches zero, show ready message
            rewardQuest('Beacon Ready', 0, '🔦 Beacon recast is now available!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownRemaining, rewardQuest]);

  // Format time for countdown display
  const formatCooldownTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Phase 0 Beacon Recast function with complete implementation
  const handleBeaconRecast = async () => {
    if (isRecasting || cooldownRemaining > 0) return;
    
    setIsRecasting(true);
    
    try {
      const response = await fetch('/api/beacon/recast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.status === 429) {
        // Cooldown active - server returned 429 status
        const cooldownData = await response.json();
        setCooldownRemaining(cooldownData.cooldown_remaining);
        rewardQuest('Beacon Cooldown', 0, `Recast available in ${formatCooldownTime(cooldownData.cooldown_remaining)}`);
        console.log('Beacon recast on cooldown:', cooldownData.cooldown_remaining, 'seconds remaining');
      } else if (response.ok) {
        const data = await response.json();
        if (data.broadcasts_total !== undefined) {
          // Success - Trigger recast animation
          setRecastAnimation(true);
          setTimeout(() => setRecastAnimation(false), 800);
          
          // Show success toast with exact format specified
          rewardQuest('Beacon Recast', data.xp_awarded, `Broadcast sent. +${data.xp_awarded} XP • Streak ${data.streak_days}.`);
          
          // Emit rewards event for Phase 0 rewards system
          rewardsEmitter.emit('beacon/recast/success', {
            xp_awarded: data.xp_awarded,
            streak_days: data.streak_days,
            broadcasts_total: data.broadcasts_total
          });
          
          // Start cooldown - will be managed by server status checks
          setCooldownRemaining(86400); // 24-hour production cooldown
          
          // Emit beacon recast success event for onboarding tracking
          window.dispatchEvent(new CustomEvent('beacon-recast-success', {
            detail: { 
              broadcasts_total: data.broadcasts_total, 
              streak_days: data.streak_days,
              xp_awarded: data.xp_awarded,
              timestamp: new Date().toISOString() 
            }
          }));
          
          console.log('Beacon recast successful:', data);
        }
      } else {
        // Handle other errors
        const errorData = await response.json();
        console.error('Beacon recast failed:', errorData.error || 'Unknown error');
        rewardQuest('Beacon Error', 0, 'Recast failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during beacon recast:', error);
    } finally {
      setIsRecasting(false);
    }
  };
  
  // Phase 0: Simplified tier requirements without trust verification
  const tiers = [
    { 
      level: 1, 
      requirement: "3-day login streak", 
      description: "Basic beacon activation",
      met: loginStreak >= 3 && beaconUnlocked
    },
    { 
      level: 2, 
      requirement: "5 total broadcasts", 
      description: "Enhanced signal range",
      met: broadcasts >= 5 && beaconUnlocked
    }
  ];

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
      {/* Beacon Panel Container */}
      <div 
        className={`beacon-panel ${beaconUnlocked ? 'unlocked' : 'locked'}`}
        style={{
          width: '280px',
          height: '240px',
          background: 'linear-gradient(135deg, rgba(0, 20, 40, 0.9) 0%, rgba(0, 30, 60, 0.9) 100%)',
          border: `3px solid ${beaconUnlocked ? '#00bcd4' : '#666666'}`,
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.5s ease',
          opacity: beaconUnlocked ? 1 : 0.6
        }}
      >
        {/* Lock Overlay */}
        {!beaconUnlocked && (
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
            <Lock size={32} color="#666666" />
            <div style={{
              fontSize: '11px',
              color: '#666666',
              fontFamily: 'Orbitron, sans-serif',
              textAlign: 'center',
              marginTop: '8px',
              lineHeight: '1.3'
            }}>
              LOCKED<br/>
              Signal not yet unlocked
            </div>
          </div>
        )}

        {/* Beacon Status */}
        <div style={{
          fontSize: '14px',
          color: beaconUnlocked ? '#00bcd4' : '#666666',
          fontFamily: 'Orbitron, sans-serif',
          fontWeight: 'bold',
          marginBottom: '16px',
          textShadow: beaconUnlocked ? '0 0 8px rgba(0, 188, 212, 0.6)' : 'none',
          textAlign: 'center'
        }}>
          {!beaconUnlocked ? 'BEACON OFFLINE' : `BEACON LEVEL ${beaconLevel}`}
        </div>

        {/* Signal Strength Bars */}
        <div style={{
          display: 'flex',
          gap: '4px',
          alignItems: 'flex-end',
          height: '60px',
          marginBottom: '20px'
        }}>
          {Array.from({ length: 8 }, (_, i) => {
            const barActive = beaconUnlocked && i < (beaconLevel * 3);
            return (
              <div
                key={i}
                onMouseEnter={() => setShowTooltip(Math.floor(i / 3))}
                onMouseLeave={() => setShowTooltip(null)}
                style={{
                  width: '12px',
                  height: `${12 + (i * 6)}px`,
                  background: barActive ? '#00bcd4' : '#333333',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: barActive ? 1 : 0.3,
                  filter: barActive ? 'drop-shadow(0 0 4px rgba(0, 188, 212, 0.6))' : 'none'
                }}
              />
            );
          })}
        </div>

        {/* Tier Progress */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '12px'
        }}>
          {tiers.map((tier, index) => (
            <div
              key={tier.level}
              onMouseEnter={() => setShowTooltip(`tier-${index}`)}
              onMouseLeave={() => setShowTooltip(null)}
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: tier.met ? '#00bcd4' : '#333333',
                border: `2px solid ${tier.met ? '#00ff88' : '#666666'}`,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: tier.met ? '0 0 8px rgba(0, 188, 212, 0.6)' : 'none'
              }}
            />
          ))}
        </div>

        {/* Recast Button - Only when unlocked */}
        {beaconUnlocked && (
          <button
            onClick={handleBeaconRecast}
            disabled={isRecasting || cooldownRemaining > 0}
            style={{
              background: cooldownRemaining > 0 
                ? 'linear-gradient(135deg, rgba(100, 100, 100, 0.2) 0%, rgba(150, 150, 150, 0.2) 100%)'
                : recastAnimation 
                ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.6) 0%, rgba(0, 188, 212, 0.6) 100%)'
                : 'linear-gradient(135deg, rgba(0, 188, 212, 0.2) 0%, rgba(0, 255, 136, 0.2) 100%)',
              border: `2px solid ${cooldownRemaining > 0 ? '#666666' : '#00bcd4'}`,
              color: cooldownRemaining > 0 ? '#999999' : '#ffffff',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '10px',
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 'bold',
              cursor: cooldownRemaining > 0 || isRecasting ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              marginBottom: '8px',
              boxShadow: recastAnimation 
                ? '0 0 25px rgba(0, 255, 136, 0.8)' 
                : cooldownRemaining > 0 
                ? '0 2px 8px rgba(100, 100, 100, 0.3)'
                : '0 4px 12px rgba(0, 188, 212, 0.3)',
              transform: recastAnimation ? 'scale(1.05)' : 'scale(1)',
              minWidth: '120px'
            }}
            onMouseEnter={(e) => {
              if (cooldownRemaining === 0 && !isRecasting) {
                e.target.style.background = 'linear-gradient(135deg, rgba(0, 188, 212, 0.4) 0%, rgba(0, 255, 136, 0.4) 100%)';
                e.target.style.boxShadow = '0 6px 18px rgba(0, 188, 212, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (cooldownRemaining === 0 && !isRecasting) {
                e.target.style.background = 'linear-gradient(135deg, rgba(0, 188, 212, 0.2) 0%, rgba(0, 255, 136, 0.2) 100%)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 188, 212, 0.3)';
              }
            }}
            title={cooldownRemaining > 0 ? `Recast available in ${formatCooldownTime(cooldownRemaining)}` : "Send one broadcast per day to extend your streak and earn XP"}
          >
            {isRecasting ? '⏳ RECASTING...' : 
             cooldownRemaining > 0 ? `Recast in ${formatCooldownTime(cooldownRemaining)}` : 
             '🔦 RECAST'}
          </button>
        )}

        {/* Status Text */}
        <div style={{
          fontSize: '10px',
          color: beaconUnlocked ? 'rgba(255, 255, 255, 0.7)' : '#666666',
          fontFamily: 'Orbitron, sans-serif',
          textAlign: 'center',
          lineHeight: '1.3'
        }}>
          {beaconUnlocked 
            ? `Streak: ${loginStreak} days • Broadcasts: ${broadcasts}`
            : 'Complete Signal unlock first'
          }
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div style={{
          position: 'absolute',
          bottom: '-60px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 20, 40, 0.95)',
          border: '1px solid #00bcd4',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '10px',
          color: '#ffffff',
          fontFamily: 'Orbitron, sans-serif',
          whiteSpace: 'nowrap',
          zIndex: 20,
          boxShadow: '0 0 15px rgba(0, 188, 212, 0.4)'
        }}>
          {showTooltip && typeof showTooltip === 'string' && showTooltip.startsWith('tier-') ? (
            (() => {
              const tierIndex = parseInt(showTooltip.split('-')[1]);
              const tier = tiers[tierIndex];
              return `${tier.requirement} • ${tier.description}`;
            })()
          ) : (
            'Hover tier indicators for requirements'
          )}
        </div>
      )}

      <style>{`
        .beacon-panel.unlocked {
          box-shadow: 
            0 0 30px rgba(0, 188, 212, 0.4),
            0 0 60px rgba(0, 188, 212, 0.2);
        }
      `}</style>
    </div>
  );
};

export default BeaconPanel;