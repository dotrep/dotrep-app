import React, { useState, useEffect } from 'react';
import './SignalUnlockModal.css';

const SignalUnlockModal = ({ pulseHz, onClose, onBroadcast }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [glowPulse, setGlowPulse] = useState(false);

  useEffect(() => {
    // Trigger confetti effect on modal open
    setShowConfetti(true);
    
    // Start glow pulse animation
    const pulseInterval = setInterval(() => {
      setGlowPulse(prev => !prev);
    }, 1000);

    // Play unlock sound effect
    try {
      const audio = new Audio('/sounds/signal-unlocked.mp3');
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Audio play failed (expected on some browsers):', e));
    } catch (e) {
      console.log('Audio not available');
    }

    // Cleanup
    return () => {
      clearInterval(pulseInterval);
      setShowConfetti(false);
    };
  }, []);

  const handleBroadcast = () => {
    if (onBroadcast) {
      onBroadcast();
    } else {
      onClose();
    }
  };

  return (
    <div className="signal-unlock-overlay">
      <div className="signal-unlock-modal">
        
        {/* Confetti Background Effect */}
        {showConfetti && (
          <div className="confetti-container">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="confetti-particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  backgroundColor: Math.random() > 0.5 ? '#00ffff' : '#00aaff'
                }}
              />
            ))}
          </div>
        )}

        {/* Main Modal Content */}
        <div className="signal-unlock-content">
          
          {/* Animated Signal Glyph with Enhanced Glow */}
          <div className="glyph-glow">
            <div className={`signal-glyph pulse-aura ${glowPulse ? 'pulse-active' : ''}`}>
              <div className="signal-icon">📶</div>
            </div>
          </div>

          {/* Achievement Header */}
          <div className="achievement-header">
            <h1 className="pulse-achievement">{pulseHz} Hz Reached!</h1>
            <div className="unlock-subtitle">🎉 You've unlocked your FSN Signal</div>
          </div>

          {/* Achievement Message */}
          <div className="achievement-message">
            <p>You've reached the Signal threshold.</p>
            <p>Broadcast your identity to the network now.</p>
          </div>

          {/* Action Buttons */}
          <div className="modal-actions">
            <button 
              className="activate-btn"
              onClick={handleBroadcast}
              title="Emit your presence to the FSN Network"
            >
              Activate Signal
            </button>
            <button 
              className="close-button"
              onClick={onClose}
              style={{ 
                position: 'absolute', 
                top: '15px', 
                right: '15px', 
                background: 'transparent',
                border: 'none',
                color: '#00ffff',
                fontSize: '24px',
                cursor: 'pointer',
                width: '30px',
                height: '30px'
              }}
            >
              ×
            </button>
          </div>

        </div>

        {/* Animated Background Rings */}
        <div className="signal-rings">
          <div className="signal-ring ring-1"></div>
          <div className="signal-ring ring-2"></div>
          <div className="signal-ring ring-3"></div>
        </div>

      </div>
    </div>
  );
};

export default SignalUnlockModal;