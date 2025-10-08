import React, { useState, useEffect } from 'react';
import { useXP } from '../context/XPContext';
import { useQuery } from '@tanstack/react-query';

const PulseGauge = ({ onScoreUpdate, pulseScore = 55, isTabActive = true }) => {
  const { rewardAction } = useXP();
  const [animatedScore, setAnimatedScore] = useState(pulseScore);
  const [isAnimating, setIsAnimating] = useState(false);

  // Get user stats for pulse calculations
  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats'],
    refetchInterval: 5000
  });

  const pulse = userStats?.pulseScore || 55;

  useEffect(() => {
    if (isTabActive && animatedScore !== pulse) {
      setIsAnimating(true);
      const duration = 1000;
      const steps = 30;
      const stepValue = (pulse - animatedScore) / steps;
      
      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        setAnimatedScore(prev => {
          const newValue = prev + stepValue;
          if (currentStep >= steps) {
            clearInterval(interval);
            setIsAnimating(false);
            return pulse;
          }
          return newValue;
        });
      }, duration / steps);

      return () => clearInterval(interval);
    }
  }, [pulse, isTabActive, animatedScore]);

  const displayScore = Math.round(animatedScore);
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative'
    }}>
      {/* Gauge Container */}
      <div style={{
        position: 'relative',
        width: '280px',
        height: '280px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Outer Ring Background */}
        <div style={{
          position: 'absolute',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, rgba(0, 255, 255, 0.1) 0%, rgba(0, 255, 255, 0.05) 100%)',
          border: '2px solid rgba(0, 255, 255, 0.2)'
        }} />
        
        {/* Progress Ring */}
        <svg
          width="240"
          height="240"
          style={{
            position: 'absolute',
            transform: 'rotate(-90deg)'
          }}
        >
          <circle
            cx="120"
            cy="120"
            r="110"
            fill="none"
            stroke="rgba(0, 255, 255, 0.1)"
            strokeWidth="8"
          />
          <circle
            cx="120"
            cy="120"
            r="110"
            fill="none"
            stroke="#00ffff"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 110}`}
            strokeDashoffset={`${2 * Math.PI * 110 * (1 - displayScore / 100)}`}
            style={{
              transition: isAnimating ? 'stroke-dashoffset 0.1s ease' : 'stroke-dashoffset 1s ease',
              filter: 'drop-shadow(0 0 8px rgba(0, 255, 255, 0.6))'
            }}
          />
        </svg>

        {/* Center Content */}
        <div style={{
          position: 'absolute',
          textAlign: 'center',
          color: '#00ffff',
          fontFamily: 'Orbitron, sans-serif'
        }}>
          <div style={{
            fontSize: '32px',
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
            marginBottom: '4px'
          }}>
            {displayScore}
          </div>
          <div style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.7)',
            letterSpacing: '1px'
          }}>
            Hz
          </div>
        </div>
      </div>

      {/* Label */}
      <div style={{
        marginTop: '20px',
        fontSize: '18px',
        color: '#00bcd4',
        fontWeight: '500',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        fontFamily: 'Orbitron, sans-serif'
      }}>
        PULSE
      </div>
    </div>
  );
};

export default PulseGauge;