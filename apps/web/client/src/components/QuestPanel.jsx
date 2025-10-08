import React, { useState } from 'react';

const QuestPanel = ({ onPlayQuest }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState('idle'); // 'idle', 'hover', 'drop', 'complete'
  // XP integration will be added later

  const handlePlayQuest = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setAnimationPhase('hover');
    onPlayQuest();
    
    // Phase 1: Hover and spin for 1 second
    setTimeout(() => {
      setAnimationPhase('drop');
    }, 1000);
    
    // Phase 2: Arc drop for 2 seconds
    setTimeout(() => {
      setAnimationPhase('complete');
      // Trigger arcade slot flash
      const slotElement = document.querySelector('.arcade-cabinet');
      if (slotElement) {
        slotElement.classList.add('arcade-slot-flash');
        setTimeout(() => {
          slotElement.classList.remove('arcade-slot-flash');
        }, 500);
      }
      
      // Future: Award XP and log activity
      console.log('Quest completed - future XP reward: +5 XP');
    }, 3000);
    
    // Reset everything after total 3.5 seconds
    setTimeout(() => {
      setIsAnimating(false);
      setAnimationPhase('idle');
    }, 3500);
  };

  return (
    <>
      <style>{`
        @keyframes questPulse {
          0%, 100% { 
            box-shadow: 
              0 0 20px rgba(0, 240, 255, 0.4),
              inset 0 0 20px rgba(0, 240, 255, 0.1);
          }
          50% { 
            box-shadow: 
              0 0 30px rgba(0, 240, 255, 0.6),
              inset 0 0 30px rgba(0, 240, 255, 0.2);
          }
        }
        
        @keyframes buttonGlow {
          0%, 100% { 
            box-shadow: 0 0 15px rgba(0, 240, 255, 0.5);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 25px rgba(0, 240, 255, 0.8);
            transform: scale(1.02);
          }
        }
        
        @keyframes coinHover {
          0% {
            transform: translate(-50%, -50%) scale(0.3) rotate(0deg);
            opacity: 0;
            box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
          }
          15% {
            transform: translate(-50%, -50%) scale(1) rotate(45deg);
            opacity: 1;
            box-shadow: 0 0 40px rgba(0, 240, 255, 0.8);
          }
          100% {
            transform: translate(-50%, -50%) scale(1) rotate(360deg);
            opacity: 1;
            box-shadow: 0 0 50px rgba(0, 240, 255, 1);
          }
        }
        
        @keyframes coinArcDrop {
          0% {
            transform: translate(-50%, -50%) scale(1) rotate(360deg);
            opacity: 1;
          }
          25% {
            transform: translate(-40%, -20%) scale(1.1) rotate(450deg);
            opacity: 1;
          }
          50% {
            transform: translate(-30%, 50%) scale(1) rotate(540deg);
            opacity: 1;
          }
          75% {
            transform: translate(-20%, 120%) scale(0.9) rotate(630deg);
            opacity: 1;
          }
          95% {
            transform: translate(-10%, 180%) scale(0.7) rotate(720deg);
            opacity: 0.8;
          }
          100% {
            transform: translate(0%, 200%) scale(0.3) rotate(720deg);
            opacity: 0;
          }
        }
        
        @keyframes glyphShimmer {
          0%, 100% { 
            text-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
            transform: scale(1);
          }
          50% { 
            text-shadow: 
              0 0 20px rgba(0, 240, 255, 1),
              0 0 30px rgba(255, 255, 255, 0.8);
            transform: scale(1.1);
          }
        }
        
        @keyframes arcadeSlotPulse {
          0% { 
            box-shadow: 0 0 0px rgba(0, 240, 255, 0);
          }
          50% { 
            box-shadow: 0 0 30px rgba(0, 240, 255, 0.9);
          }
          100% { 
            box-shadow: 0 0 0px rgba(0, 240, 255, 0);
          }
        }
        
        .quest-panel {
          animation: questPulse 2s ease-in-out infinite;
        }
        
        .quest-button {
          animation: buttonGlow 3s ease-in-out infinite;
        }
        
        .coin-hover {
          animation: coinHover 1s ease-out forwards;
        }
        
        .coin-drop {
          animation: coinArcDrop 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        
        .coin-glyph {
          animation: glyphShimmer 0.5s ease-in-out infinite;
        }
        
        .arcade-slot-flash {
          animation: arcadeSlotPulse 0.5s ease-out;
        }
      `}</style>

      {/* Quest Panel */}
      <div 
        className="quest-panel"
        style={{
          width: '400px',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 20, 40, 0.8) 100%)',
          border: '2px solid rgba(0, 240, 255, 0.5)',
          borderRadius: '15px',
          padding: '25px',
          fontFamily: 'Orbitron, sans-serif',
          margin: '20px auto',
          position: 'relative'
        }}
      >
        {/* Header */}
        <h3 style={{
          margin: '0 0 15px 0',
          fontSize: '18px',
          fontWeight: '700',
          color: '#00f0ff',
          textAlign: 'center',
          letterSpacing: '1px',
          textShadow: '0 0 15px rgba(0, 240, 255, 0.6)'
        }}>
          DAILY VAULT UPLOAD
        </h3>

        {/* Body Text */}
        <p style={{
          margin: '0 0 20px 0',
          fontSize: '14px',
          color: 'rgba(0, 240, 255, 0.8)',
          textAlign: 'center',
          lineHeight: '1.5',
          letterSpacing: '0.5px'
        }}>
          Upload a file to your Vault to earn XP.
        </p>

        {/* Play Quest Button */}
        <button
          className="quest-button"
          onClick={handlePlayQuest}
          disabled={isAnimating}
          style={{
            width: '100%',
            padding: '15px 20px',
            background: isAnimating 
              ? 'linear-gradient(135deg, #666, #333)'
              : 'linear-gradient(135deg, #00f0ff, #0099cc)',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            fontWeight: '700',
            fontSize: '16px',
            fontFamily: 'Orbitron, sans-serif',
            letterSpacing: '1px',
            cursor: isAnimating ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            opacity: isAnimating ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (!isAnimating) {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 240, 255, 0.8)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isAnimating) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.5)';
            }
          }}
        >
          {isAnimating ? 'ACTIVATING...' : 'PLAY QUEST'}
        </button>
      </div>

      {/* Premium Animated Coin */}
      {(animationPhase === 'hover' || animationPhase === 'drop') && (
        <div
          className={animationPhase === 'hover' ? 'coin-hover' : 'coin-drop'}
          style={{
            position: 'fixed',
            left: '50%',
            top: '25%',
            width: '80px',
            height: '80px',
            background: `
              radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8) 0%, transparent 50%),
              radial-gradient(circle, rgba(0, 240, 255, 0.95) 0%, rgba(0, 180, 200, 0.8) 40%, rgba(0, 120, 140, 0.6) 100%)
            `,
            borderRadius: '50%',
            border: '4px solid #00f0ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            boxShadow: `
              0 0 40px rgba(0, 240, 255, 0.9),
              inset 0 0 20px rgba(255, 255, 255, 0.3),
              0 0 80px rgba(0, 240, 255, 0.5)
            `,
            pointerEvents: 'none',
            filter: 'drop-shadow(0 0 15px rgba(0, 240, 255, 0.8))'
          }}
        >
          {/* Premium FSN Glyph in center */}
          <div 
            className="coin-glyph"
            style={{
              width: '50px',
              height: '50px',
              background: 'linear-gradient(135deg, #ffffff 0%, #f0f8ff 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: '900',
              color: '#00f0ff',
              fontFamily: 'Orbitron, sans-serif',
              textShadow: `
                0 0 10px rgba(0, 240, 255, 0.8),
                0 0 20px rgba(0, 240, 255, 0.6),
                0 0 30px rgba(0, 240, 255, 0.4)
              `,
              border: '2px solid rgba(0, 240, 255, 0.3)',
              boxShadow: 'inset 0 0 15px rgba(0, 240, 255, 0.2)'
            }}
          >
            F
          </div>
          
          {/* Radial Glow Halo */}
          <div style={{
            position: 'absolute',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 240, 255, 0.3) 0%, transparent 70%)',
            zIndex: -1,
            animation: 'pulse 1s ease-in-out infinite alternate'
          }} />
        </div>
      )}
    </>
  );
};

export default QuestPanel;