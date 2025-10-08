import React, { useEffect, useState } from 'react';
import { useXP } from '../context/XPContext';
import { copyToClipboard, downloadPNG } from '../utils/clipboard';

interface BeaconMeterProps {
  beaconScore: number;
  isBeaconOn: boolean;
  pulseHz?: number;
  isCasting?: boolean;
}

interface CastData {
  id: number;
  time: string;
  signalStrength: number;
  xpEarned: number;
  frequency: number;
}

export const BeaconMeter: React.FC<BeaconMeterProps> = ({ 
  beaconScore, 
  isBeaconOn, 
  pulseHz = 50, 
  isCasting = false 
}) => {
  const [animationTick, setAnimationTick] = useState(0);
  const [selectedBar, setSelectedBar] = useState<number | null>(null);
  const [castHistory, setCastHistory] = useState<CastData[]>([]);
  const [totalBroadcasts, setTotalBroadcasts] = useState(17);
  const [showTooltip, setShowTooltip] = useState(false);
  const [castAnimation, setCastAnimation] = useState(false);
  const [showBoostEffect, setShowBoostEffect] = useState(false);
  const [radarPulse, setRadarPulse] = useState(false);
  const [boostSparkle, setBoostSparkle] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showRecastSuccess, setShowRecastSuccess] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const { addXP, currentFreq, signalMode, logXP } = useXP();

  useEffect(() => {
    if (!isBeaconOn) return;
    
    const interval = setInterval(() => {
      setAnimationTick(prev => prev + 1);
    }, 100);

    return () => clearInterval(interval);
  }, [isBeaconOn]);

  // Trigger cast animation when signal is casting
  useEffect(() => {
    if (isCasting || signalMode === 'CAST') {
      setCastAnimation(true);
      setRadarPulse(true);
      handleNewCast();
      setTimeout(() => {
        setCastAnimation(false);
        setRadarPulse(false);
      }, 2000);
    }
  }, [isCasting, signalMode]);

  const handleNewCast = () => {
    const isBoost = Math.random() < 0.1; // 10% chance for boost
    const baseXP = 10;
    const xpGained = isBoost ? baseXP * 2 : baseXP;
    
    const newCast: CastData = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      signalStrength: pulseHz,
      xpEarned: xpGained,
      frequency: currentFreq || 13.37
    };
    
    setCastHistory(prev => [newCast, ...prev.slice(0, 4)]); // Keep last 5 casts
    setTotalBroadcasts(prev => {
      const newCount = prev + 1;
      setTimeout(() => animateBroadcastCount(), 100); // Animate after state update
      return newCount;
    });
    
    if (addXP) {
      addXP(xpGained);
    }
    
    if (isBoost) {
      setShowBoostEffect(true);
      setBoostSparkle(true);
      setTimeout(() => {
        setShowBoostEffect(false);
        setBoostSparkle(false);
      }, 3000);
    }
  };

  const handleBarClick = (barIndex: number) => {
    setSelectedBar(barIndex);
    setShowTooltip(true);
    setTimeout(() => {
      setShowTooltip(false);
      setSelectedBar(null);
    }, 3000);
  };

  const handleRecast = () => {
    const now = new Date();
    addXP(10); // XP reward for recast
    logXP(`+10 XP – Recast to ${currentFreq.toFixed(2)} MHz`);
    animateBeaconBars(); // trigger Beacon animation
    handleNewCast(); // Add new cast data
    setShowRecastSuccess(true);
    setTimeout(() => setShowRecastSuccess(false), 2000);
    setShowTooltip(false);
    setSelectedBar(null);
  };

  const animateBeaconBars = () => {
    const bars = document.querySelectorAll('.beacon-bar');
    bars.forEach((bar, index) => {
      bar.classList.add('pulse-wave');
      setTimeout(() => bar.classList.remove('pulse-wave'), 500);
    });
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleCopyLink = async () => {
    const shareUrl = `https://fsn.network/signal/${currentFreq.toFixed(2)}`;
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    }
    setShowShareModal(false);
  };

  const handleDownloadPNG = async () => {
    const success = await downloadPNG('beacon-card', `fsn_beacon_${currentFreq.toFixed(2)}`);
    if (success) {
      alert('Beacon card downloaded!');
    }
    setShowShareModal(false);
  };

  // Animate total broadcasts counter
  const animateBroadcastCount = () => {
    const counter = document.querySelector('.broadcast-count');
    if (counter) {
      counter.classList.add('broadcast-count-animate');
      setTimeout(() => counter.classList.remove('broadcast-count-animate'), 600);
    }
  };

  // Generate 10 bars for the equalizer - mapped to pulseHz (0-100)
  const generateBars = () => {
    const bars = [];
    const totalBars = 10;
    const activeBars = Math.max(1, Math.floor(pulseHz / 10)); // 10 Hz = 1 bar, 100 Hz = 10 bars
    
    for (let i = 0; i < totalBars; i++) {
      const isActive = i < activeBars;
      const isCenterBar = i === Math.floor(totalBars / 2);
      
      // Base height based on position (center highest)
      const distanceFromCenter = Math.abs(i - Math.floor(totalBars / 2));
      const baseHeight = Math.max(2, 8 - distanceFromCenter);
      
      // Animation: enhanced pulsing for active bars
      const pulsePhase = (animationTick * 0.2 + i * 0.3) % (Math.PI * 2);
      let pulseMultiplier = 1;
      
      if (isBeaconOn && isActive) {
        pulseMultiplier = 1 + Math.sin(pulsePhase) * 0.3;
        
        // Cast animation wave effect
        if (castAnimation) {
          const waveDelay = Math.abs(i - Math.floor(totalBars / 2)) * 100;
          const wavePhase = ((Date.now() - waveDelay) / 200) % (Math.PI * 2);
          pulseMultiplier += Math.sin(wavePhase) * 0.5;
        }
      }
      
      const finalHeight = Math.max(1, baseHeight * pulseMultiplier);
      const isHovered = selectedBar === i;
      
      bars.push(
        <button
          key={i}
          className="beacon-bar"
          data-frequency={currentFreq.toFixed(2)}
          data-timestamp={castHistory[0]?.time || new Date().toLocaleTimeString()}
          onClick={() => handleBarClick(i)}
          onMouseEnter={() => setSelectedBar(i)}
          onMouseLeave={() => !showTooltip && setSelectedBar(null)}
          style={{
            width: '15px',
            height: `${finalHeight * 18}px`,
            backgroundColor: isActive ? '#00FFFF' : '#113344',
            borderRadius: '2px',
            border: 'none',
            opacity: isActive ? (isHovered ? 1 : 0.8) : 0.3,
            boxShadow: isActive ? 
              `0 0 ${isHovered ? 15 : finalHeight * 3}px #00FFFF, 0 0 ${isHovered ? 25 : finalHeight * 6}px rgba(0, 255, 255, ${isHovered ? 0.8 : 0.4})` : 
              'none',
            transition: 'all 0.2s ease-out',
            alignSelf: 'flex-end',
            cursor: 'pointer',
            position: 'relative',
            transform: isHovered ? 'scale(1.1) scaleY(1.1)' : 'scale(1)',
            filter: castAnimation && isCenterBar ? 'brightness(1.5)' : 'brightness(1)'
          }}
        >
          {/* Bar glow overlay for cast animation */}
          {castAnimation && isCenterBar && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to top, rgba(0, 255, 255, 0.8), rgba(0, 255, 255, 0.2))',
                borderRadius: '2px',
                animation: 'beacon-pulse 2s ease-out'
              }}
            />
          )}
        </button>
      );
    }
    return bars;
  };

  return (
    <div style={{
      position: 'relative',
      width: '320px',
      height: '320px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Orbitron", monospace'
    }}>
      
      {/* Radar Pulse Animation */}
      {radarPulse && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '200px',
          height: '200px',
          border: '2px solid rgba(0, 255, 255, 0.8)',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'radar-pulse 2s ease-out',
          pointerEvents: 'none',
          zIndex: 5
        }} />
      )}
      
      {/* Boost Sparkle Effect */}
      {boostSparkle && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '100%',
          height: '100%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'sparkle-burst 1.5s ease-out',
          pointerEvents: 'none',
          zIndex: 15
        }} />
      )}
      
      {/* Boost Effect */}
      {showBoostEffect && (
        <div style={{
          position: 'absolute',
          top: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #ffd700, #ff8800)',
          color: '#000',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '10px',
          fontWeight: '700',
          animation: 'boost-sparkle 3s ease-out forwards',
          zIndex: 20
        }}>
          ✨ BROADCAST BOOST! +20 XP ✨
        </div>
      )}

      {/* Recast Success Feedback */}
      {showRecastSuccess && (
        <div style={{
          position: 'absolute',
          top: '-60px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #00ff88, #00cc66)',
          color: '#000',
          padding: '6px 16px',
          borderRadius: '8px',
          fontSize: '11px',
          fontWeight: 'bold',
          animation: 'success-fade 2s ease-out forwards',
          zIndex: 30,
          fontFamily: '"Orbitron", monospace'
        }}>
          ✅ Recast Successful!
        </div>
      )}

      {/* Copy Success Feedback */}
      {showCopySuccess && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #00FFFF, #0099cc)',
          color: '#000',
          padding: '12px 20px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 'bold',
          animation: 'success-slide 2s ease-out forwards',
          zIndex: 1001,
          fontFamily: '"Orbitron", monospace',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.6)'
        }}>
          📋 Copied to Clipboard!
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 30, 60, 0.95), rgba(0, 20, 40, 0.95))',
            border: '2px solid #00FFFF',
            borderRadius: '12px',
            padding: '24px',
            fontSize: '12px',
            color: '#00FFFF',
            fontFamily: '"Orbitron", monospace',
            boxShadow: '0 0 30px rgba(0, 255, 255, 0.6)',
            minWidth: '300px',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '16px', fontWeight: 'bold', fontSize: '14px' }}>
              📡 Share Broadcast Data
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={handleCopyLink}
                style={{
                  background: 'linear-gradient(135deg, #00FFFF, #0099cc)',
                  color: '#000',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontFamily: '"Orbitron", monospace',
                  boxShadow: '0 0 15px rgba(0, 255, 255, 0.4)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 0 25px rgba(0, 255, 255, 0.8)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.4)';
                }}
              >
                📋 Copy Link
              </button>
              
              <button 
                onClick={handleDownloadPNG}
                style={{
                  background: 'transparent',
                  color: '#00FFFF',
                  border: '1px solid #00FFFF',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontFamily: '"Orbitron", monospace',
                  boxShadow: '0 0 8px rgba(0, 255, 255, 0.2)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(0, 255, 255, 0.1)';
                  e.target.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.6)';
                  e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.boxShadow = '0 0 8px rgba(0, 255, 255, 0.2)';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                🖼 Download Card
              </button>
            </div>
            
            <button 
              onClick={() => setShowShareModal(false)}
              style={{
                marginTop: '16px',
                background: 'transparent',
                color: 'rgba(255, 255, 255, 0.6)',
                border: 'none',
                fontSize: '10px',
                cursor: 'pointer',
                fontFamily: '"Orbitron", monospace'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Tooltip Modal */}
      {showTooltip && selectedBar !== null && (
        <div style={{
          position: 'absolute',
          top: '-120px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, rgba(0, 30, 60, 0.95), rgba(0, 20, 40, 0.95))',
          border: '2px solid #00FFFF',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '11px',
          color: '#00FFFF',
          zIndex: 25,
          minWidth: '220px',
          maxWidth: '280px',
          boxShadow: '0 0 30px rgba(0, 255, 255, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          fontFamily: '"Orbitron", monospace',
          animation: 'tooltip-appear 0.3s ease-out'
        }}>
          {/* Close Button */}
          <button
            onClick={() => {setShowTooltip(false); setSelectedBar(null);}}
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              background: 'transparent',
              border: 'none',
              color: '#00FFFF',
              fontSize: '16px',
              cursor: 'pointer',
              fontFamily: '"Orbitron", monospace',
              lineHeight: '1',
              padding: '2px 6px'
            }}
          >
            ×
          </button>

          <div style={{ marginBottom: '12px', fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}>
            📡 Broadcast Data
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>📡 Frequency:</span>
              <span style={{ color: '#4fffe2' }}>{currentFreq.toFixed(2)} MHz</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>🕒 Last Cast:</span>
              <span style={{ color: '#4fffe2' }}>{new Date().toLocaleDateString()} @ {castHistory[0]?.time || new Date().toLocaleTimeString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>💠 XP Gained:</span>
              <span style={{ color: '#ffd700' }}>+{castHistory[0]?.xpEarned || 25} XP</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>⚡ Signal Strength:</span>
              <span style={{ color: '#4fffe2' }}>{pulseHz} Hz</span>
            </div>
          </div>
          
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button 
              onClick={handleRecast}
              style={{
                background: 'linear-gradient(135deg, #00FFFF, #0099cc)',
                color: '#000',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '9px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontFamily: '"Orbitron", monospace',
                boxShadow: '0 0 10px rgba(0, 255, 255, 0.4)'
              }}
            >
              RECAST
            </button>
            <button 
              onClick={handleShare}
              style={{
                background: 'transparent',
                color: '#00FFFF',
                border: '1px solid #00FFFF',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '9px',
                cursor: 'pointer',
                fontFamily: '"Orbitron", monospace',
                boxShadow: '0 0 8px rgba(0, 255, 255, 0.2)'
              }}>
              SHARE
            </button>
          </div>
        </div>
      )}

      {/* Main equalizer container - wrapped with beacon-card ID for PNG export */}
      <div id="beacon-card" style={{
        position: 'relative',
        width: '340px',
        height: '240px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>

        {/* Signal Strength Scale - Left axis */}
        <div style={{
          position: 'absolute',
          left: '0px',
          top: '0px',
          height: '180px',
          width: '40px',
          display: 'flex',
          flexDirection: 'column-reverse',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          paddingRight: '10px',
          fontSize: '12px',
          color: 'rgba(0, 255, 255, 0.9)',
          fontFamily: '"Orbitron", monospace',
          fontWeight: 'bold'
        }}>
          <div style={{ textShadow: '0 0 4px rgba(0, 255, 255, 0.8)' }}>1</div>
          <div style={{ textShadow: '0 0 4px rgba(0, 255, 255, 0.8)' }}>2</div>
          <div style={{ textShadow: '0 0 4px rgba(0, 255, 255, 0.8)' }}>4</div>
          <div style={{ textShadow: '0 0 4px rgba(0, 255, 255, 0.8)' }}>6</div>
          <div style={{ textShadow: '0 0 4px rgba(0, 255, 255, 0.8)' }}>8</div>
        </div>

        {/* Horizontal reference grid lines */}
        <div style={{
          position: 'absolute',
          left: '45px',
          top: '30px',
          width: '250px',
          height: '144px',
          pointerEvents: 'none'
        }}>
          {[0, 1, 2, 3, 4].map(level => (
            <div key={level} style={{
              position: 'absolute',
              bottom: `${level * 36}px`,
              width: '100%',
              height: '1px',
              background: level === 2 ? 'rgba(0, 255, 255, 0.3)' : 'rgba(0, 255, 255, 0.15)'
            }} />
          ))}
        </div>

        {/* Cast animation radar pulse */}
        {castAnimation && (
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '300px',
            height: '300px',
            border: '2px solid rgba(0, 255, 255, 0.6)',
            borderRadius: '50%',
            animation: 'radar-pulse 2s ease-out'
          }} />
        )}

        {/* Animated Equalizer Bars */}
        <div style={{
          position: 'absolute',
          left: '65px',
          bottom: '30px',
          width: '210px',
          height: '144px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: '8px',
        }}>
          {generateBars()}
        </div>

        {/* Total Broadcasts Counter - Fixed positioning */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '12px',
          color: '#4fffe2',
          fontFamily: '"Orbitron", monospace',
          fontWeight: '400',
          textAlign: 'center',
          textShadow: '0 0 4px rgba(79, 255, 226, 0.6)'
        }}>
          📡 Total Broadcasts: <span className="broadcast-count" style={{ color: '#ffd700' }}>{totalBroadcasts}</span>
        </div>

      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes beacon-pulse {
          0% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0.8; transform: scale(1); }
        }
        
        @keyframes radar-pulse {
          0% { opacity: 0.8; transform: translate(-50%, -50%) scale(0.5); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
        }
        
        @keyframes boost-sparkle {
          0% { transform: translateX(-50%) translateY(0) scale(0.8); opacity: 0; }
          20% { transform: translateX(-50%) translateY(-10px) scale(1.1); opacity: 1; }
          80% { transform: translateX(-50%) translateY(-15px) scale(1); opacity: 1; }
          100% { transform: translateX(-50%) translateY(-20px) scale(0.9); opacity: 0; }
        }
        
        @keyframes tooltip-appear {
          0% { opacity: 0; transform: translateX(-50%) scale(0.8); }
          100% { opacity: 1; transform: translateX(-50%) scale(1); }
        }
        
        @keyframes broadcast-pulse {
          0% { opacity: 1; transform: scale(1); border-color: #00FFFF; }
          100% { opacity: 0; transform: scale(3); border-color: rgba(0, 255, 255, 0.1); }
        }
        
        @keyframes bar-rise {
          0% { opacity: 0; transform: scaleY(0); }
          100% { opacity: 1; transform: scaleY(1); }
        }
        
        .beacon-bar:hover {
          opacity: 1.0 !important;
          transform: scaleY(1.1) !important;
        }
        
        @keyframes pulse-wave {
          0%   { transform: scaleY(1); opacity: 1; }
          50%  { transform: scaleY(1.3); opacity: 1; }
          100% { transform: scaleY(1); opacity: 1; }
        }
        
        .pulse-wave {
          animation: pulse-wave 0.5s ease-in-out;
        }
        
        @keyframes success-fade {
          0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          20% { opacity: 1; transform: translateX(-50%) translateY(0px); }
          80% { opacity: 1; transform: translateX(-50%) translateY(0px); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        }
        
        @keyframes success-slide {
          0% { opacity: 0; transform: translateX(100px); }
          15% { opacity: 1; transform: translateX(0px); }
          85% { opacity: 1; transform: translateX(0px); }
          100% { opacity: 0; transform: translateX(100px); }
        }
        
        .broadcast-count-animate {
          animation: broadcast-count-pulse 0.6s ease-out;
        }
        
        @keyframes broadcast-count-pulse {
          0% { transform: scale(1); color: #ffd700; }
          50% { transform: scale(1.3); color: #00ff88; }
          100% { transform: scale(1); color: #ffd700; }
        }
      `}</style>
    </div>
  );
};