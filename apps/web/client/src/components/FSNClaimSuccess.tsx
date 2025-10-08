import React, { useState, useEffect } from 'react';
import { CheckCircle, Zap, Shield } from 'lucide-react';

interface FSNClaimSuccessProps {
  fsnName: string;
  onContinue: () => void;
}

const FSNClaimSuccess: React.FC<FSNClaimSuccessProps> = ({ fsnName, onContinue }) => {
  const [showContent, setShowContent] = useState(false);
  const [pulseActive, setPulseActive] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showTerminalText, setShowTerminalText] = useState(false);

  useEffect(() => {
    // Start content animation
    setTimeout(() => setShowContent(true), 800);
    
    // Auto-redirect to dashboard after 3 seconds to avoid user getting stuck
    setTimeout(() => {
      onContinue();
    }, 3000);
    
    // Start pulsing effect
    const pulseInterval = setInterval(() => {
      setPulseActive(prev => !prev);
    }, 1500);

    return () => clearInterval(pulseInterval);
  }, [onContinue]);

  const handleEnterNetwork = () => {
    setIsTransitioning(true);
    
    // Show terminal text sequence
    setTimeout(() => setShowTerminalText(true), 500);
    
    // Complete transition
    setTimeout(() => {
      onContinue();
    }, 2800);
  };

  return (
    <div className="fsn-claim-overlay">
      <div className={`fsn-claim-modal ${isTransitioning ? 'transitioning' : ''}`}>
        
        {/* Neon Grid Background */}
        <div className="neon-grid">
          <div className="grid-lines horizontal">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="grid-line" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <div className="grid-lines vertical">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="grid-line" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="fsn-claim-content">
          
          {/* FSN Identity Icon */}
          <div className={`fsn-identity-icon ${pulseActive ? 'pulse-active' : ''}`}>
            <div className="identity-symbol">◆</div>
          </div>

          {/* Success Header */}
          <div className="claim-header">
            <h1 className="claim-title">IDENTITY CLAIMED</h1>
            <div className="fsn-name-display">
              <span className="fsn-name">{fsnName}</span>
              <span className="fsn-extension">.fsn</span>
            </div>
          </div>

          {/* Status Grid */}
          <div className="status-grid">
            <div className="status-card xp-card">
              <div className="status-icon">
                <Zap className="icon" />
              </div>
              <div className="status-info">
                <div className="status-value">+50 XP</div>
                <div className="status-label">Earned</div>
              </div>
            </div>
            
            <div className="status-card security-card">
              <div className="status-icon">
                <Shield className="icon" />
              </div>
              <div className="status-info">
                <div className="status-value">Secured</div>
                <div className="status-label">Soulbound</div>
              </div>
            </div>
          </div>

          {/* Network Access Items */}
          <div className="access-items">
            <div className="access-item">
              <CheckCircle className="access-icon" />
              <span>FSN Network Access</span>
            </div>
            <div className="access-item">
              <CheckCircle className="access-icon" />
              <span>XP System Activated</span>
            </div>
            <div className="access-item">
              <CheckCircle className="access-icon" />
              <span>Identity Verified</span>
            </div>
          </div>

          {/* Enter Network Button */}
          <button className="enter-network-btn" onClick={handleEnterNetwork} disabled={isTransitioning}>
            <span className="btn-text">
              {isTransitioning ? "CONNECTING..." : "ENTER THE NETWORK"}
            </span>
          </button>

        </div>

        {/* Broadcast Waves (adapted from BeaconUnlockModal) */}
        <div className="broadcast-waves">
          <div className="broadcast-wave wave-1"></div>
          <div className="broadcast-wave wave-2"></div>
          <div className="broadcast-wave wave-3"></div>
        </div>

        {/* Network Transition Overlay */}
        {isTransitioning && (
          <div className="network-transition-overlay">
            {/* Accelerated Grid */}
            <div className="accelerated-grid"></div>
            
            {/* Geometric Wipe */}
            <div className="geometric-wipe"></div>
            
            {/* Terminal Text */}
            {showTerminalText && (
              <div className="terminal-overlay">
                <div className="terminal-text">NETWORK ACCESS GRANTED</div>
                <div className="terminal-subtext">Welcome to FSN, {fsnName}.fsn</div>
              </div>
            )}
          </div>
        )}

      </div>

      <style>{`
        .fsn-claim-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: radial-gradient(ellipse at center, #000619 0%, #000000 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
        }

        .fsn-claim-modal {
          position: relative;
          background: rgba(0, 15, 35, 0.85);
          border: 1px solid rgba(0, 255, 255, 0.3);
          border-radius: 16px;
          padding: 60px 50px;
          width: 90%;
          max-width: 520px;
          text-align: center;
          backdrop-filter: blur(20px);
          animation: modalAppear 1.2s ease-out;
          overflow: hidden;
        }

        @keyframes modalAppear {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* Minimal Grid Pattern */
        .neon-grid {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0.15;
          pointer-events: none;
          background-image: 
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 32px 32px;
          animation: gridShift 20s linear infinite;
          transition: all 0.5s ease;
        }

        .fsn-claim-modal.transitioning .neon-grid {
          animation: gridAccelerate 0.8s ease-in-out;
          opacity: 0.4;
        }

        @keyframes gridShift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(32px, 32px); }
        }

        @keyframes gridAccelerate {
          0% { 
            transform: translate(0, 0);
            background-size: 32px 32px;
          }
          50% {
            background-size: 8px 8px;
            opacity: 0.8;
          }
          100% { 
            transform: translate(64px, 64px);
            background-size: 2px 2px;
            opacity: 0;
          }
        }

        .grid-lines.horizontal,
        .grid-lines.vertical {
          display: none;
        }

        /* Main Content */
        .fsn-claim-content {
          position: relative;
          z-index: 1;
        }

        /* Identity Icon - Minimalist Diamond */
        .fsn-identity-icon {
          margin: 0 auto 40px;
          width: 80px;
          height: 80px;
          background: radial-gradient(circle at center, rgba(0, 255, 255, 0.2) 0%, transparent 70%);
          display: flex;
          justify-content: center;
          align-items: center;
          transition: all 0.6s ease;
          position: relative;
          border-radius: 50%;
        }

        .fsn-identity-icon.pulse-active {
          box-shadow: 0 0 40px rgba(0, 255, 255, 0.4);
        }

        .identity-symbol {
          font-size: 32px;
          color: rgba(0, 255, 255, 0.9);
          font-weight: normal;
          text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        }

        /* Clean Typography */
        .claim-header {
          margin-bottom: 50px;
        }

        .claim-title {
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 32px;
          font-weight: 300;
          color: #ffffff;
          margin: 0 0 24px 0;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .fsn-name-display {
          font-family: 'JetBrains Mono', monospace;
          font-size: 24px;
          font-weight: 400;
          margin-bottom: 16px;
          padding: 12px 0;
          border-bottom: 1px solid rgba(0, 255, 255, 0.2);
        }

        .fsn-name {
          color: rgba(0, 255, 255, 0.9);
        }

        .fsn-extension {
          color: rgba(255, 255, 255, 0.6);
        }

        /* Minimal Status Cards */
        .status-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 40px;
        }

        .status-card {
          background: rgba(0, 255, 255, 0.05);
          border: 1px solid rgba(0, 255, 255, 0.15);
          border-radius: 8px;
          padding: 20px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.3s ease;
        }

        .status-card:hover {
          border-color: rgba(0, 255, 255, 0.3);
          background: rgba(0, 255, 255, 0.08);
        }

        .xp-card {
          border-color: rgba(255, 255, 0, 0.15);
          background: rgba(255, 255, 0, 0.05);
        }

        .xp-card:hover {
          border-color: rgba(255, 255, 0, 0.3);
          background: rgba(255, 255, 0, 0.08);
        }

        .status-icon .icon {
          width: 24px;
          height: 24px;
        }

        .xp-card .icon {
          color: rgba(255, 255, 0, 0.8);
        }

        .security-card .icon {
          color: rgba(0, 255, 255, 0.8);
        }

        .status-info {
          text-align: left;
        }

        .status-value {
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          font-weight: 500;
          color: #ffffff;
          margin-bottom: 2px;
        }

        .status-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 400;
        }

        /* Minimal Access Items */
        .access-items {
          margin-bottom: 40px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .access-item {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: rgba(0, 255, 255, 0.7);
          font-size: 14px;
          font-weight: 400;
        }

        .access-icon {
          width: 16px;
          height: 16px;
        }

        /* Minimal Button */
        .enter-network-btn {
          font-family: 'Inter', sans-serif;
          background: rgba(0, 255, 255, 0.1);
          color: rgba(0, 255, 255, 0.9);
          border: 1px solid rgba(0, 255, 255, 0.3);
          padding: 16px 32px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
          position: relative;
          overflow: hidden;
        }

        .enter-network-btn:hover {
          background: rgba(0, 255, 255, 0.15);
          border-color: rgba(0, 255, 255, 0.5);
          transform: translateY(-1px);
        }

        .btn-text {
          position: relative;
          z-index: 1;
        }

        /* Subtle Broadcast Waves */
        .broadcast-waves {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 600px;
          pointer-events: none;
          z-index: -1;
        }

        .broadcast-wave {
          position: absolute;
          border: 1px solid rgba(0, 255, 255, 0.1);
          border-radius: 50%;
          animation: waveExpand 6s ease-out infinite;
        }

        .wave-1 {
          width: 100%;
          height: 100%;
          animation-delay: 0s;
        }

        .wave-2 {
          width: 75%;
          height: 75%;
          top: 12.5%;
          left: 12.5%;
          animation-delay: 2s;
        }

        .wave-3 {
          width: 50%;
          height: 50%;
          top: 25%;
          left: 25%;
          animation-delay: 4s;
        }

        @keyframes waveExpand {
          0% {
            transform: scale(0.5);
            opacity: 0.3;
          }
          50% {
            opacity: 0.1;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }

        /* Network Transition Effects */
        .network-transition-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 100;
          pointer-events: none;
          border-radius: 16px;
          overflow: hidden;
        }

        .accelerated-grid {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            linear-gradient(rgba(0, 255, 255, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.3) 1px, transparent 1px);
          background-size: 16px 16px;
          animation: gridWipeOut 1.2s ease-in-out;
        }

        @keyframes gridWipeOut {
          0% {
            background-size: 32px 32px;
            opacity: 0.2;
          }
          30% {
            background-size: 8px 8px;
            opacity: 0.6;
          }
          60% {
            background-size: 2px 2px;
            opacity: 0.9;
          }
          100% {
            background-size: 1px 1px;
            opacity: 0;
            transform: scale(2);
          }
        }

        .geometric-wipe {
          position: absolute;
          top: 0;
          left: -100%;
          width: 200%;
          height: 100%;
          background: linear-gradient(
            90deg, 
            transparent 0%, 
            rgba(0, 255, 255, 0.1) 45%, 
            rgba(0, 255, 255, 0.3) 50%, 
            rgba(0, 255, 255, 0.1) 55%, 
            transparent 100%
          );
          animation: geometricWipe 1.5s ease-in-out 0.5s;
        }

        @keyframes geometricWipe {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }

        .terminal-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          animation: terminalFadeIn 0.8s ease-out;
        }

        .terminal-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 24px;
          color: rgba(0, 255, 255, 0.9);
          margin-bottom: 8px;
          text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
          animation: terminalType 1s steps(20);
        }

        .terminal-subtext {
          font-family: 'JetBrains Mono', monospace;
          font-size: 16px;
          color: rgba(255, 255, 255, 0.7);
          animation: terminalType 1s steps(20) 0.3s both;
        }

        @keyframes terminalFadeIn {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes terminalType {
          0% {
            width: 0;
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            width: 100%;
            opacity: 1;
          }
        }

        /* Button disabled state */
        .enter-network-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .enter-network-btn:disabled:hover {
          transform: none;
          box-shadow: 
            0 0 30px rgba(0, 255, 255, 0.5),
            0 4px 15px rgba(0, 0, 0, 0.3);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .fsn-claim-modal {
            padding: 40px 30px;
            margin: 20px;
            max-width: 400px;
          }
          
          .claim-title {
            font-size: 24px;
          }
          
          .fsn-name-display {
            font-size: 18px;
          }
          
          .status-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .enter-network-btn {
            width: 100%;
            max-width: 280px;
          }

          .terminal-text {
            font-size: 18px;
          }

          .terminal-subtext {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default FSNClaimSuccess;