import React, { useState, useEffect } from 'react';
import './BeaconUnlockModal.css';

const BeaconUnlockModal = ({ onClose, onBeaconUnlocked }) => {
  const [showGlobe, setShowGlobe] = useState(false);
  const [beaconPulse, setBeaconPulse] = useState(false);

  useEffect(() => {
    // Trigger globe animation on modal open
    setShowGlobe(true);
    
    // Start beacon pulse animation
    const pulseInterval = setInterval(() => {
      setBeaconPulse(prev => !prev);
    }, 1500);

    // Cleanup
    return () => {
      clearInterval(pulseInterval);
    };
  }, []);

  const handleBeaconActivation = () => {
    if (onBeaconUnlocked) {
      onBeaconUnlocked();
    }
    onClose();
  };

  return (
    <div className="beacon-unlock-overlay">
      <div className="beacon-unlock-modal">
        
        {/* Animated Globe Background */}
        {showGlobe && (
          <div className="globe-container">
            <div className="globe-sphere"></div>
            <div className="globe-rings">
              <div className="globe-ring ring-1"></div>
              <div className="globe-ring ring-2"></div>
              <div className="globe-ring ring-3"></div>
            </div>
          </div>
        )}

        {/* Main Modal Content */}
        <div className="beacon-unlock-content">
          
          {/* Beacon Glyph */}
          <div className={`beacon-glyph ${beaconPulse ? 'beacon-pulse-active' : ''}`}>
            <div className="beacon-icon">🌐</div>
          </div>

          {/* Achievement Header */}
          <div className="beacon-header">
            <h1 className="beacon-achievement">Beacon Access Unlocked!</h1>
            <div className="beacon-subtitle">You've maintained full Pulse and active Signal for 3 days</div>
          </div>

          {/* Achievement Message */}
          <div className="beacon-message">
            <p>Prepare to broadcast across the global FSN map.</p>
            <p><strong>Beacon goes live in Phase 1.</strong></p>
          </div>

          {/* Beacon Stats */}
          <div className="beacon-stats">
            <div className="beacon-stat">
              <span className="stat-label">Pulse Status</span>
              <span className="stat-value">🟢 100Hz</span>
            </div>
            <div className="beacon-stat">
              <span className="stat-label">Signal Active</span>
              <span className="stat-value">✅ 3+ Days</span>
            </div>
            <div className="beacon-stat">
              <span className="stat-label">Global Range</span>
              <span className="stat-value">🌍 Worldwide</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="beacon-actions">
            <button 
              className="preview-button"
              onClick={handleBeaconActivation}
            >
              Preview Beacon
            </button>
            <button 
              className="close-button"
              onClick={onClose}
            >
              Continue
            </button>
          </div>

        </div>

        {/* Animated Broadcast Waves */}
        <div className="broadcast-waves">
          <div className="broadcast-wave wave-1"></div>
          <div className="broadcast-wave wave-2"></div>
          <div className="broadcast-wave wave-3"></div>
        </div>

      </div>
    </div>
  );
};

export default BeaconUnlockModal;