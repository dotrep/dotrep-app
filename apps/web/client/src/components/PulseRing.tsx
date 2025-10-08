import React from 'react';

interface PulseRingProps {
  score: number; // 30-100
  isPulsing: boolean;
  onClick: () => void;
}

const PulseRing: React.FC<PulseRingProps> = ({ score, isPulsing, onClick }) => {
  // Calculate ring completion percentage (score - 30) / 70 * 100
  const completionPercentage = Math.max(0, Math.min(100, ((score - 30) / 70) * 100));
  
  // Determine visual state based on score
  const getVisualState = () => {
    if (score >= 80) return 'strong';
    if (score >= 60) return 'stable';
    if (score >= 45) return 'warning';
    return 'critical';
  };

  const visualState = getVisualState();

  const stateColors = {
    strong: {
      primary: 'rgba(77, 208, 225, 0.9)',
      secondary: 'rgba(0, 188, 212, 0.7)',
      glow: 'rgba(77, 208, 225, 0.6)'
    },
    stable: {
      primary: 'rgba(0, 188, 212, 0.8)',
      secondary: 'rgba(0, 150, 168, 0.6)',
      glow: 'rgba(0, 188, 212, 0.5)'
    },
    warning: {
      primary: 'rgba(255, 193, 7, 0.8)',
      secondary: 'rgba(255, 152, 0, 0.6)',
      glow: 'rgba(255, 193, 7, 0.5)'
    },
    critical: {
      primary: 'rgba(244, 67, 54, 0.8)',
      secondary: 'rgba(198, 40, 40, 0.6)',
      glow: 'rgba(244, 67, 54, 0.5)'
    }
  };

  const colors = stateColors[visualState];

  const shouldFlicker = score < 60 && !isPulsing;

  return (
    <div 
      className="relative flex items-center justify-center cursor-pointer group"
      style={{ width: '280px', height: '280px' }}
      onClick={onClick}
    >
      {/* Outer ring with tick marks for speedometer effect */}
      <svg 
        width="260" 
        height="260" 
        className="absolute transform -rotate-90"
      >
        {/* Tick marks around the gauge */}
        {Array.from({ length: 20 }, (_, i) => {
          const angle = (i * 18) - 90; // 20 ticks across 360 degrees
          const isMainTick = i % 5 === 0;
          const tickLength = isMainTick ? 12 : 6;
          const tickWidth = isMainTick ? 2 : 1;
          const radius = 115;
          const x1 = 130 + (radius - tickLength) * Math.cos(angle * Math.PI / 180);
          const y1 = 130 + (radius - tickLength) * Math.sin(angle * Math.PI / 180);
          const x2 = 130 + radius * Math.cos(angle * Math.PI / 180);
          const y2 = 130 + radius * Math.sin(angle * Math.PI / 180);
          
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(0, 188, 212, 0.4)"
              strokeWidth={tickWidth}
              style={{
                filter: `drop-shadow(0 0 2px rgba(0, 188, 212, 0.6))`,
                animation: shouldFlicker ? 'tickFlicker 3s infinite ease-in-out' : undefined
              }}
            />
          );
        })}
        
        {/* Background ring */}
        <circle
          cx="130"
          cy="130"
          r="95"
          fill="none"
          stroke="rgba(64, 164, 188, 0.1)"
          strokeWidth="8"
        />
        
        {/* Progress ring with enhanced glow and gradient */}
        <defs>
          <linearGradient id={`pulseGradient-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
            <stop offset="50%" stopColor={colors.secondary} stopOpacity="0.9" />
            <stop offset="100%" stopColor={colors.primary} stopOpacity="1" />
          </linearGradient>
          <filter id={`pulseGlow-${score}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <circle
          cx="130"
          cy="130"
          r="95"
          fill="none"
          stroke={`url(#pulseGradient-${score})`}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 95}`}
          strokeDashoffset={`${2 * Math.PI * 95 * (1 - completionPercentage / 100)}`}
          filter={`url(#pulseGlow-${score})`}
          style={{
            filter: `drop-shadow(0 0 ${isPulsing ? 30 : 15}px ${colors.glow}) drop-shadow(0 0 ${isPulsing ? 50 : 25}px ${colors.secondary})`,
            transition: 'all 1.5s cubic-bezier(0.25, 0.1, 0.25, 1)',
            animation: shouldFlicker ? 'pulseFlicker 2.5s infinite ease-in-out' : 'gaugeIdle 4s ease-in-out infinite'
          }}
        />
        
        {/* Inner glow ring for depth */}
        <circle
          cx="130"
          cy="130"
          r="85"
          fill="none"
          stroke={colors.glow}
          strokeWidth="2"
          strokeOpacity="0.3"
          style={{
            animation: shouldFlicker ? 'innerFlicker 2s infinite ease-in-out' : 'innerGlow 3s ease-in-out infinite'
          }}
        />
      </svg>

      {/* Center display with cockpit-style layout */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        {/* Main score display */}
        <div 
          className="text-5xl font-bold mb-2"
          style={{ 
            color: colors.primary,
            textShadow: `0 0 ${isPulsing ? 25 : 12}px ${colors.glow}, 0 0 ${isPulsing ? 40 : 20}px ${colors.secondary}`,
            transition: 'all 0.8s ease',
            animation: shouldFlicker ? 'textFlicker 2s infinite ease-in-out' : 'scoreGlow 3s ease-in-out infinite',
            fontFamily: 'monospace'
          }}
        >
          {score}
        </div>
        
        {/* Label */}
        <div 
          className="text-lg font-medium tracking-wider mb-1"
          style={{ 
            color: colors.primary,
            letterSpacing: '3px',
            textShadow: `0 0 8px ${colors.glow}`,
            fontFamily: 'monospace'
          }}
        >
          PULSE
        </div>
        
        {/* Status indicator */}
        <div 
          className="text-xs px-2 py-1 rounded border"
          style={{ 
            color: colors.primary,
            borderColor: colors.glow,
            backgroundColor: `${colors.glow}20`,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontFamily: 'monospace'
          }}
        >
          {visualState}
        </div>
        
        {/* Range indicator */}
        <div 
          className="text-xs opacity-60 mt-2"
          style={{ 
            color: 'rgba(255, 255, 255, 0.5)',
            fontFamily: 'monospace'
          }}
        >
          30-100
        </div>
      </div>

      {/* Enhanced Tooltip */}
      <div className="absolute -bottom-24 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
        <div 
          className="px-4 py-3 rounded-lg text-sm shadow-lg"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            color: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(0, 188, 212, 0.4)',
            backdropFilter: 'blur(12px)',
            maxWidth: '280px'
          }}
        >
          <div className="font-bold text-cyan-400 mb-1">🫀 PULSE GAUGE</div>
          <div className="text-xs leading-relaxed">
            Your Pulse reflects your identity health and stability. 
            {score >= 70 && <span className="text-green-400"> Bright glow - stable ring.</span>}
            {score >= 40 && score < 70 && <span className="text-yellow-400"> Dimmer glow - "STABLE" level.</span>}
            {score < 40 && <span className="text-red-400"> Flickering edges - warning halo - "WEAK" level.</span>}
          </div>
        </div>
      </div>

      {/* Enhanced pulse wave effects */}
      {isPulsing && (
        <>
          <div 
            className="absolute rounded-full border-2"
            style={{
              width: '240px',
              height: '240px',
              borderColor: colors.glow,
              animation: 'pulseWave1 2s ease-out'
            }}
          />
          <div 
            className="absolute rounded-full border"
            style={{
              width: '260px',
              height: '260px',
              borderColor: colors.secondary,
              animation: 'pulseWave2 2s ease-out 0.3s'
            }}
          />
          <div 
            className="absolute rounded-full"
            style={{
              width: '220px',
              height: '220px',
              background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
              animation: 'pulseGlow 2s ease-out',
              opacity: 0.2
            }}
          />
        </>
      )}

      <style>{`
        @keyframes pulseWave1 {
          0% { 
            transform: scale(0.8);
            opacity: 0.8;
          }
          100% { 
            transform: scale(1.5);
            opacity: 0;
          }
        }
        
        @keyframes pulseWave2 {
          0% { 
            transform: scale(0.9);
            opacity: 0.6;
          }
          100% { 
            transform: scale(1.7);
            opacity: 0;
          }
        }
        
        @keyframes pulseGlow {
          0% { 
            transform: scale(0.8);
            opacity: 0.3;
          }
          50% { 
            transform: scale(1.1);
            opacity: 0.1;
          }
          100% { 
            transform: scale(1.3);
            opacity: 0;
          }
        }
        
        @keyframes gaugeIdle {
          0%, 100% { 
            filter: drop-shadow(0 0 15px ${colors.glow}) drop-shadow(0 0 25px ${colors.secondary});
          }
          50% { 
            filter: drop-shadow(0 0 20px ${colors.glow}) drop-shadow(0 0 35px ${colors.secondary});
          }
        }
        
        @keyframes scoreGlow {
          0%, 100% { 
            text-shadow: 0 0 12px ${colors.glow}, 0 0 20px ${colors.secondary};
          }
          50% { 
            text-shadow: 0 0 18px ${colors.glow}, 0 0 30px ${colors.secondary};
          }
        }
        
        @keyframes innerGlow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
        
        @keyframes pulseFlicker {
          0%, 100% { opacity: 0.7; }
          25% { opacity: 0.3; }
          50% { opacity: 0.8; }
          75% { opacity: 0.2; }
        }
        
        @keyframes textFlicker {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.4; }
        }
        
        @keyframes tickFlicker {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.1; }
        }
        
        @keyframes innerFlicker {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.05; }
        }
      `}</style>
    </div>
  );
};

export default PulseRing;