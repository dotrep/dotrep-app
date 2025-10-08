import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useXP } from '../context/XPContext';
import { getUserLevel } from '../utils/xpGating';
import TrustBadge from './TrustBadge';

interface XpIndicatorProps {
  onXpClick?: () => void;
}

export default function XpIndicator({ onXpClick }: XpIndicatorProps) {
  const [isPulsing, setIsPulsing] = useState(false);
  const [previousXP, setPreviousXP] = useState(0);
  const [xpGlow, setXpGlow] = useState(false);
  const [xpGainAmount, setXpGainAmount] = useState<number | null>(null);
  const { xp, trustTier, totalCasts, currentLevel, nextLevelXP } = useXP();

  // Fetch user stats including XP
  const { data: userStats, isLoading } = useQuery({
    queryKey: ['/api/user/stats'],
    refetchInterval: 5000, // Refresh every 5 seconds to show XP updates
  });

  const currentXP = Math.max((userStats as any)?.xpPoints || 0, xp);
  const displayLevel = getUserLevel(currentXP);

  // Watch for XP changes and trigger glow effect
  useEffect(() => {
    if (currentXP > 0 && currentXP !== previousXP) {
      if (previousXP > 0) { // Don't animate on first load
        const gain = currentXP - previousXP;
        setXpGainAmount(gain);
        setXpGlow(true);
        setIsPulsing(true);
        
        setTimeout(() => {
          setXpGlow(false);
          setIsPulsing(false);
          setXpGainAmount(null);
        }, 3000);
      }
      setPreviousXP(currentXP);
    }
  }, [currentXP, previousXP]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!xpGlow) { // Only pulse normally when not glowing from XP gain
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 1000);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [xpGlow]);

  if (isLoading) {
    return (
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(0, 20, 40, 0.8)',
        padding: '8px 16px',
        borderRadius: '20px',
        border: '1px solid rgba(0, 188, 212, 0.3)',
        zIndex: 1000
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#00bcd4',
          opacity: 0.5
        }} />
        <span style={{ color: '#00bcd4', fontSize: '14px', fontWeight: '500' }}>...</span>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>XP</span>
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '8px',
    }}>
      {/* Trust Badge */}
      <TrustBadge tier={trustTier} xp={currentXP} totalCasts={totalCasts} />
      
      {/* XP Indicator */}
      <div 
        onClick={onXpClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: xpGlow ? 'rgba(255, 215, 0, 0.2)' : 'rgba(0, 20, 40, 0.8)',
          padding: '8px 16px',
          borderRadius: '20px',
          border: xpGlow ? '2px solid #ffd700' : '1px solid rgba(0, 188, 212, 0.3)',
          zIndex: 1000,
          cursor: onXpClick ? 'pointer' : 'default',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(8px)',
          boxShadow: xpGlow ? '0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.4)' : 'none',
          transform: xpGlow ? 'scale(1.05)' : 'scale(1)'
        }}
        onMouseEnter={(e) => {
          if (onXpClick) {
            e.currentTarget.style.background = 'rgba(0, 188, 212, 0.2)';
            e.currentTarget.style.border = '2px solid rgba(0, 188, 212, 0.8)';
            e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 188, 212, 0.6), inset 0 0 15px rgba(0, 188, 212, 0.2)';
            e.currentTarget.style.transform = 'scale(1.08)';
          }
        }}
        onMouseLeave={(e) => {
          if (onXpClick && !xpGlow) {
            e.currentTarget.style.background = 'rgba(0, 20, 40, 0.8)';
            e.currentTarget.style.border = '1px solid rgba(0, 188, 212, 0.3)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
      >
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#00bcd4',
          animation: isPulsing ? 'pulse 1s ease-in-out' : 'none',
          opacity: isPulsing ? 1 : 0.7,
          transition: 'opacity 0.3s ease',
          boxShadow: isPulsing ? '0 0 8px #00bcd4' : 'none'
        }} />
        <span style={{ 
          color: xpGlow ? '#ffd700' : '#00bcd4', 
          fontSize: '14px', 
          fontWeight: '500',
          minWidth: '70px',
          textAlign: 'right',
          textShadow: xpGlow ? '0 0 15px rgba(255, 215, 0, 1)' : '0 0 8px rgba(0, 188, 212, 0.6)',
          transition: 'all 0.3s ease'
        }}
        title={`Next level at ${nextLevelXP} XP`}
        >
          Lvl {displayLevel} • {currentXP.toLocaleString()}
        </span>
        
        {/* XP Gain Animation */}
        {xpGainAmount && xpGlow && (
          <div style={{
            position: 'absolute',
            top: '-25px',
            right: '10px',
            color: '#ffd700',
            fontSize: '12px',
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(255, 215, 0, 1)',
            animation: 'xp-gain-float 3s ease-out forwards',
            pointerEvents: 'none'
          }}>
            +{xpGainAmount}
          </div>
        )}
        <span style={{ 
          color: 'rgba(255,255,255,0.7)', 
          fontSize: '10px', 
          textTransform: 'uppercase', 
          letterSpacing: '1px' 
        }}>
          XP
        </span>

        <style>{`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1); opacity: 0.7; }
          }
          @keyframes xp-gain-float {
            0% {
              transform: translateY(0) scale(0.8);
              opacity: 1;
            }
            100% {
              transform: translateY(-30px) scale(1.2);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
}