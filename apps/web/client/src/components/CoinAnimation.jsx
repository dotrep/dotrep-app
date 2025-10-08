import React from 'react';

const CoinAnimation = ({ isAnimating, onComplete }) => {
  if (!isAnimating) return null;

  return (
    <>
      <style>{`
        @keyframes tokenFlyToSlot {
          0% {
            transform: translate(-50%, -50%) scale(1) rotateY(0deg) rotateX(10deg);
            opacity: 1;
            filter: drop-shadow(0 0 25px rgba(0, 240, 255, 0.8));
          }
          15% {
            transform: translate(-50%, -50%) scale(1.4) rotateY(120deg) rotateX(25deg);
            opacity: 1;
            filter: drop-shadow(0 0 35px rgba(0, 240, 255, 1));
          }
          30% {
            transform: translate(-30%, -30%) scale(1.3) rotateY(240deg) rotateX(45deg);
            opacity: 1;
            filter: drop-shadow(0 0 30px rgba(0, 240, 255, 0.9));
          }
          45% {
            transform: translate(-15%, -15%) scale(1.1) rotateY(360deg) rotateX(65deg);
            opacity: 1;
            filter: drop-shadow(0 0 25px rgba(0, 240, 255, 0.8));
          }
          60% {
            transform: translate(0%, 0%) scale(0.9) rotateY(480deg) rotateX(85deg);
            opacity: 1;
            filter: drop-shadow(0 0 20px rgba(0, 240, 255, 0.7));
          }
          75% {
            transform: translate(15%, 15%) scale(0.7) rotateY(600deg) rotateX(105deg);
            opacity: 0.9;
            filter: drop-shadow(0 0 15px rgba(0, 240, 255, 0.6));
          }
          90% {
            transform: translate(25%, 25%) scale(0.4) rotateY(720deg) rotateX(125deg);
            opacity: 0.6;
            filter: drop-shadow(0 0 10px rgba(0, 240, 255, 0.4));
          }
          100% {
            transform: translate(35%, 35%) scale(0.1) rotateY(900deg) rotateX(180deg);
            opacity: 0;
            filter: drop-shadow(0 0 5px rgba(0, 240, 255, 0.2));
          }
        }
        
        .flying-token {
          animation: tokenFlyToSlot 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>

      <div
        className="flying-token"
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          width: '120px',
          height: '120px',
          zIndex: 2000,
          pointerEvents: 'none',
          transformStyle: 'preserve-3d'
        }}
        onAnimationEnd={onComplete}
      >
        {/* Authentic FSN Coin - Flying Animation */}
        <svg 
          width="120" 
          height="120" 
          viewBox="0 0 120 120" 
          style={{
            filter: 'drop-shadow(0 0 25px rgba(0, 240, 255, 0.8))',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Definitions for gradients and patterns */}
          <defs>
            <radialGradient id="flyingOuterGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0, 240, 255, 0.4)" />
              <stop offset="70%" stopColor="rgba(0, 240, 255, 0.2)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            
            <radialGradient id="flyingCoinBg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(20, 50, 80, 0.95)" />
              <stop offset="60%" stopColor="rgba(10, 30, 50, 0.98)" />
              <stop offset="100%" stopColor="rgba(5, 15, 25, 1)" />
            </radialGradient>
            
            <pattern id="flyingHatch" patternUnits="userSpaceOnUse" width="3" height="3">
              <path d="M 0,3 l 3,-3 M -0.5,0.5 l 1,-1 M 2.5,3.5 l 1,-1" 
                    stroke="rgba(0, 240, 255, 0.25)" 
                    strokeWidth="0.4" />
            </pattern>
          </defs>
          
          {/* Outer Glow */}
          <circle 
            cx="60" 
            cy="60" 
            r="55" 
            fill="url(#flyingOuterGlow)" 
            opacity="0.9"
          />
          
          {/* Main Coin Body */}
          <circle 
            cx="60" 
            cy="60" 
            r="50" 
            fill="url(#flyingCoinBg)"
            stroke="#00f0ff" 
            strokeWidth="2.5"
            style={{
              filter: 'drop-shadow(0 0 12px rgba(0, 240, 255, 0.9))'
            }}
          />
          
          {/* Inner Ring */}
          <circle 
            cx="60" 
            cy="60" 
            r="44" 
            fill="none"
            stroke="rgba(0, 240, 255, 0.7)" 
            strokeWidth="1.5"
          />
          
          {/* Diagonal Hatching Ring */}
          <circle 
            cx="60" 
            cy="60" 
            r="38" 
            fill="url(#flyingHatch)"
            stroke="rgba(0, 240, 255, 0.5)" 
            strokeWidth="1"
            opacity="0.8"
          />
          
          {/* FSN Chevron Symbol */}
          <g transform="translate(60, 60)">
            {/* Main Chevron Body */}
            <path 
              d="M -12 -6 L -4 -6 L 6 0 L -4 6 L -12 6 L -4 0 Z" 
              fill="#00f0ff"
              stroke="#00f0ff"
              strokeWidth="0.8"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(0, 240, 255, 1)) drop-shadow(0 0 15px rgba(0, 240, 255, 0.8))'
              }}
            />
            
            {/* Inner Chevron Detail */}
            <path 
              d="M -6 -3 L -1 -3 L 3 0 L -1 3 L -6 3 L -1 0 Z" 
              fill="rgba(255, 255, 255, 0.95)"
              style={{
                filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.9))'
              }}
            />
          </g>
        </svg>
      </div>
    </>
  );
};

export default CoinAnimation;