import React, { useState, useEffect } from 'react';
import { useXP } from '../context/XPContext';
import { trackSignalBroadcast } from '../utils/taskTriggers';
import './SignalDial.css';

// Special frequency configurations
const SPECIAL_FREQUENCIES = {
  '13.00': {
    type: 'Secret Broadcast',
    description: 'Distorted robotic voice with cipher',
    message: 'QlJPQURDQVNUIERFVEVDVEVEOiBGU04gU0lHTkFMIFNZU1RFTQ==',
    reward: 50,
    badge: 'Signal Decoder'
  },
  '32.40': {
    type: 'Ambient Noise',
    description: 'Light static with intermittent beeps',
    message: null,
    reward: 0
  },
  '47.77': {
    type: 'Echo Signal',
    description: 'Deep tone with echo and chime',
    message: '🔑 Seek the Beacon of Origin',
    reward: 25,
    badge: 'Echo Hunter'
  },
  '66.66': {
    type: 'Forbidden Zone',
    description: 'Harsh interference noise',
    message: '⛔ Broadcasting here is restricted',
    reward: 0
  },
  '7.30': {
    type: 'FSN Core Channel',
    description: 'Enhanced signal clarity',
    message: 'FSN CORE FREQUENCY DETECTED',
    reward: 15,
    badge: 'Core Listener'
  }
};

// Frequency ranges
const BROADCAST_MAX = 49.99;
const LISTEN_MAX = 99.99;

const SignalDial = () => {
  const { 
    signalMode, setSignalMode, currentFreq, setCurrentFreq, addXP, logXP, incrementCasts,
    selectedFrequencies, setSelectedFrequencies, foundFreq, checkFrequency, trustTier, xpLog
  } = useXP();
  const [isSignalOn, setIsSignalOn] = useState(true);
  const [isMulticast, setIsMulticast] = useState(false);
  const [lockedStations, setLockedStations] = useState([]);
  const [freqInput, setFreqInput] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [activeMode, setActiveMode] = useState('');
  const [xpGain, setXpGain] = useState(null);
  const [showSpecialMessage, setShowSpecialMessage] = useState('');
  const [showPulseRing, setShowPulseRing] = useState(false);
  const [multiChannels, setMultiChannels] = useState([null, null, null]); // F1, F2, F3
  const [showFrequencyHint, setShowFrequencyHint] = useState(false);
  const [selectedChannelCount, setSelectedChannelCount] = useState(0);
  const [showMaxChannelsWarning, setShowMaxChannelsWarning] = useState(false);
  const [listeningStatus, setListeningStatus] = useState('');
  const [signalType, setSignalType] = useState('');
  const [canBroadcast, setCanBroadcast] = useState(true);
  const [showDecodeModal, setShowDecodeModal] = useState(false);
  const [currentSpecialFreq, setCurrentSpecialFreq] = useState(null);

  // Load saved state on component mount
  useEffect(() => {
    const savedMode = localStorage.getItem('fsn_signal_mode');
    const savedFreq = localStorage.getItem('fsn_signal_freq');
    const savedPower = localStorage.getItem('fsn_signal_power');
    
    if (savedMode && savedMode !== 'OFF') {
      setActiveMode(savedMode);
      setSignalMode(savedMode);
    }
    if (savedFreq) {
      setCurrentFreq(parseFloat(savedFreq));
    }
    if (savedPower !== null) {
      setIsSignalOn(savedPower === 'true');
    }
  }, [setSignalMode, setCurrentFreq]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('fsn_signal_mode', activeMode || 'OFF');
    localStorage.setItem('fsn_signal_freq', currentFreq.toString());
    localStorage.setItem('fsn_signal_power', isSignalOn.toString());
  }, [activeMode, currentFreq, isSignalOn]);

  const showXPGain = async (amount, reason) => {
    setXpGain({ amount, reason });
    
    // Award XP through server validation instead of client-side manipulation
    try {
      const response = await fetch('/api/xp/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'special_frequency', 
          metadata: { amount, reason, frequency: currentFreq } 
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`Server-validated XP awarded: ${result.xpAwarded}`);
      } else {
        console.warn('XP award failed:', await response.text());
      }
    } catch (error) {
      console.error('Error awarding XP:', error);
    }
    
    setTimeout(() => setXpGain(null), 2000);
  };

  const checkSpecialFrequency = (freq) => {
    const freqStr = freq.toFixed(2);
    const special = SPECIAL_FREQUENCIES[freqStr];
    
    if (special) {
      setSignalType(special.type);
      setCurrentSpecialFreq(special);
      if (special.reward > 0) {
        showXPGain(special.reward, special.badge);
      }
      if (special.message) {
        setShowSpecialMessage(special.message);
        setTimeout(() => setShowSpecialMessage(''), 4000);
      }
    } else {
      setSignalType('');
      setCurrentSpecialFreq(null);
    }
    
    // Check broadcast capability
    setCanBroadcast(freq <= BROADCAST_MAX);
  };

  const handleCast = () => {
    if (!canBroadcast) {
      setShowSpecialMessage('Cannot broadcast to protected spectrum.');
      setTimeout(() => setShowSpecialMessage(''), 3000);
      return;
    }
    
    if (isSignalOn && !isLocked) {
      const wasInactive = activeMode !== "CAST";
      setSignalMode("CAST");
      setActiveMode("CAST");
      
      // Trigger broadcast pulse ring animation
      setShowPulseRing(true);
      setTimeout(() => setShowPulseRing(false), 500);
      
      // Apply frequency if user has been typing
      if (freqInput) {
        const freq = parseFloat(freqInput);
        if (freq >= 0 && freq <= 99.99) {
          setCurrentFreq(freq);
          checkSpecialFrequency(freq);
        }
        setFreqInput('');
      }
      
      // Handle MULTI mode casting
      if (activeMode === "MULTI" && selectedFrequencies.length > 0) {
        const totalXP = 25 * selectedFrequencies.length;
        showXPGain(totalXP, `Multi Signal Broadcast`);
        logXP(`+${totalXP} XP – Multi Signal Broadcast`);
        incrementCasts();
        // Trigger task completion for broadcasting signals
        trackSignalBroadcast();
        
        // Reset multi selections after cast
        setSelectedFrequencies([]);
        setMultiChannels([null, null, null]);
      } else {
        // Standard single frequency cast
        if (wasInactive) {
          showXPGain(25, 'BROADCAST CAST');
          logXP('+25 XP – Signal Cast');
          incrementCasts();
          // Trigger task completion for broadcasting a signal
          trackSignalBroadcast();
        }
      }
    }
  };

  const handleListen = () => {
    if (isSignalOn && !isLocked) {
      const wasInactive = activeMode !== "LISTEN";
      setSignalMode("LISTEN");
      setActiveMode("LISTEN");
      
      // Apply frequency if user has been typing
      if (freqInput) {
        const freq = parseFloat(freqInput);
        if (freq >= 0 && freq <= 99.99) {
          setCurrentFreq(freq);
          
          // Check for hidden frequency in LISTEN mode
          const foundHidden = checkFrequency(freq);
          if (foundHidden) {
            setShowSpecialMessage('🎧 You\'ve locked into a hidden FSN channel!');
            setTimeout(() => setShowSpecialMessage(''), 3000);
          } else {
            checkSpecialFrequency(freq);
          }
        }
        setFreqInput('');
      }
      
      // XP gain for first time listening
      if (wasInactive) {
        showXPGain(1, 'Signal Listen');
        logXP('+1 XP – Signal Listen');
      }
      
      // Show frequency hint for LISTEN mode
      if (wasInactive) {
        setShowFrequencyHint(true);
        setTimeout(() => setShowFrequencyHint(false), 5000);
      }
      
      // Update listening status
      updateListeningStatus(currentFreq);
    }
  };

  const updateListeningStatus = (freq) => {
    const freqStr = freq.toFixed(2);
    const special = SPECIAL_FREQUENCIES[freqStr];
    
    if (special) {
      setListeningStatus(`Listening to: ${freqStr} MHz`);
      setSignalType(`Signal: ${special.type}`);
    } else {
      setListeningStatus(`Listening to: ${freqStr} MHz`);
      setSignalType('Signal: None Detected');
    }
  };

  // Add decode functionality for special frequencies
  const handleDecodeMessage = () => {
    if (currentSpecialFreq && currentSpecialFreq.message === 'QlJPQURDQVNUIERFVEVDVEVEOiBGU04gU0lHTkFMIFNZU1RFTQ==') {
      // This is base64 encoded "BROADCAST DETECTED: FSN SIGNAL SYSTEM"
      const decoded = atob(currentSpecialFreq.message);
      setShowSpecialMessage(`🔓 DECODED: ${decoded}`);
      showXPGain(currentSpecialFreq.reward, 'Message Decoded');
      setTimeout(() => setShowSpecialMessage(''), 5000);
    }
    setShowDecodeModal(false);
  };

  const handleTogglePower = () => {
    const newPowerState = !isSignalOn;
    setIsSignalOn(newPowerState);
    if (!newPowerState) {
      setSignalMode("OFF");
      setActiveMode("");
      setFreqInput('');
      setIsMulticast(false);
      setIsLocked(false);
      setLockedStations([]);
    } else {
      // When turning back on, apply any pending frequency input
      if (freqInput) {
        const freq = parseFloat(freqInput);
        if (freq >= 0 && freq <= 99.99) {
          setCurrentFreq(freq);
        }
        setFreqInput('');
      }
    }
  };

  const handleKeypadNumber = (num) => {
    if (!isSignalOn || isLocked) return;
    
    const newInput = freqInput + num.toString();
    const freq = parseFloat(newInput);
    
    // Allow input up to 99.99
    if (freq <= 99.99 && newInput.length <= 5) {
      setFreqInput(newInput);
      // Update display in real-time
      if (freq >= 0) {
        setCurrentFreq(freq);
      }
    }
  };

  const handleDecimalPoint = () => {
    if (!isSignalOn || isLocked || freqInput.includes('.')) return;
    const newInput = freqInput + '.';
    setFreqInput(newInput);
  };

  const handleClearInput = () => {
    if (!isSignalOn || isLocked) return;
    setFreqInput('');
  };

  const setPresetFreq = (freq) => {
    if (!isSignalOn || isLocked) return;
    setCurrentFreq(freq);
    setFreqInput('');
    checkSpecialFrequency(freq);
  };

  const handleFreqBack = () => {
    if (!isSignalOn || isLocked) return;
    setCurrentFreq(prev => Math.max(0, +(prev - 0.1).toFixed(2)));
    setFreqInput('');
  };

  const handleFreqForward = () => {
    if (!isSignalOn || isLocked) return;
    setCurrentFreq(prev => Math.min(99.99, +(prev + 0.1).toFixed(2)));
    setFreqInput('');
  };

  const handleMulticast = () => {
    if (!isSignalOn || isLocked) return;
    const newMulticast = !isMulticast;
    setIsMulticast(newMulticast);
    if (newMulticast && lockedStations.length === 0) {
      // Auto-lock current frequency when enabling multicast
      setLockedStations([currentFreq]);
    } else if (!newMulticast) {
      setLockedStations([]);
    }
  };

  const handleLockStation = () => {
    if (!isSignalOn || !isMulticast || lockedStations.length >= 3) return;
    
    if (!lockedStations.includes(currentFreq)) {
      setLockedStations([...lockedStations, currentFreq]);
    }
    
    // Lock the entire interface when station is locked
    setIsLocked(true);
    showXPGain(3, 'Station Locked');
  };

  const handleUnlock = () => {
    setIsLocked(false);
    showXPGain(1, 'Signal Unlocked');
  };
  
  const handleMultiMode = () => {
    if (!isSignalOn || isLocked) return;
    const wasInactive = activeMode !== "MULTI";
    setSignalMode("MULTI");
    setActiveMode("MULTI");
    
    if (wasInactive) {
      showXPGain(2, 'Multi Mode Activated');
      logXP('+2 XP – Multi Mode Activated');
    }
  };
  
  const selectChannel = (channelIndex) => {
    if (!isSignalOn || isLocked) return;
    
    if (selectedFrequencies.length >= 3) {
      setShowMaxChannelsWarning(true);
      setTimeout(() => setShowMaxChannelsWarning(false), 2000);
      return;
    }
    
    const newChannels = [...multiChannels];
    const currentFrequency = freqInput ? parseFloat(freqInput) : currentFreq;
    
    if (newChannels[channelIndex] === null) {
      newChannels[channelIndex] = currentFrequency;
      setMultiChannels(newChannels);
      setSelectedFrequencies([...selectedFrequencies, currentFrequency]);
      setSelectedChannelCount(selectedChannelCount + 1);
      setFreqInput('');
    }
  };
  
  const clearChannel = (channelIndex) => {
    const newChannels = [...multiChannels];
    const removedFreq = newChannels[channelIndex];
    newChannels[channelIndex] = null;
    setMultiChannels(newChannels);
    setSelectedFrequencies(selectedFrequencies.filter(f => f !== removedFreq));
    setSelectedChannelCount(selectedChannelCount - 1);
  };

  const getDisplayStatus = () => {
    if (!isSignalOn) return "OFFLINE";
    if (isLocked) return "LOCKED";
    if (isMulticast && lockedStations.length > 0) {
      return `MULTICAST (${lockedStations.length}/3)`;
    }
    return activeMode || "READY";
  };

  const getSpecialFreqMessage = () => {
    if (currentFreq === 7.3 || currentFreq === 13.0 || currentFreq === 13.37) {
      return " ✦ SPECIAL FREQUENCY";
    }
    return "";
  };

  const getDisplayFreq = () => {
    if (freqInput) {
      return freqInput.padEnd(5, '0');
    }
    return currentFreq.toFixed(2);
  };

  return (
    <div className={`signal-touchpad ${activeMode ? `mode-${activeMode.toLowerCase()}` : ''} ${isLocked ? 'locked' : ''} ${isSignalOn && activeMode ? 'active' : ''}`}>
      {/* Broadcast Pulse Ring */}
      {showPulseRing && (
        <div className="broadcast-pulse-ring" />
      )}
      
      {/* XP Gain Popup */}
      {xpGain && (
        <div className="xp-gain-popup">
          +{xpGain.amount} XP
          <span className="xp-reason">{xpGain.reason}</span>
        </div>
      )}
      
      {/* Special Frequency Message */}
      {showSpecialMessage && (
        <div className="special-message">
          {showSpecialMessage}
        </div>
      )}
      
      {/* Max Channels Warning */}
      {showMaxChannelsWarning && (
        <div className="max-channels-warning">
          ⚠️ Max 3 channels active
        </div>
      )}

      <div className="touchpad-screen">
        {/* Oscilloscope Wave Background - only show during active modes */}
        {(activeMode === 'LISTEN' || activeMode === 'CAST') && (
          <div className="oscilloscope-background">
            <svg className="wave-display" viewBox="0 0 200 60" preserveAspectRatio="none">
              <path 
                className="wave-line"
                d="M0,30 Q10,15 20,30 T40,30 Q50,45 60,30 T80,30 Q90,15 100,30 T120,30 Q130,45 140,30 T160,30 Q170,15 180,30 T200,30"
                fill="none"
                stroke="#00f0ff"
                strokeWidth="1"
                opacity="0.4"
              />
              <path 
                className="wave-line wave-secondary"
                d="M0,35 Q15,20 30,35 T60,35 Q75,50 90,35 T120,35 Q135,20 150,35 T180,35 Q195,50 200,35"
                fill="none"
                stroke="#00f0ff"
                strokeWidth="0.5"
                opacity="0.2"
              />
              <path 
                className="wave-line wave-tertiary"
                d="M0,25 Q8,10 16,25 T32,25 Q40,40 48,25 T64,25 Q72,10 80,25 T96,25 Q104,40 112,25 T128,25 Q136,10 144,25 T160,25 Q168,40 176,25 T192,25 Q200,10 200,25"
                fill="none"
                stroke="#00f0ff"
                strokeWidth="0.8"
                opacity="0.3"
              />
            </svg>
          </div>
        )}
        
        <div className="screen-line">
          <span>MODE: {getDisplayStatus()}</span>
        </div>
        <div className="screen-line">
          <span className={freqInput ? 'freq-typing' : ''}>
            FREQUENCY: {getDisplayFreq()} MHz{getSpecialFreqMessage()}
          </span>
        </div>
        
        {/* Enhanced listening status display */}
        {activeMode === 'LISTEN' && (listeningStatus || signalType) && (
          <div className="screen-line listening-status">
            {listeningStatus && <span style={{color: '#00ff88', fontSize: '9px'}}>{listeningStatus}</span>}
            {signalType && <span style={{color: '#ffaa00', fontSize: '9px', display: 'block'}}>{signalType}</span>}
            
            {/* Visual signal equalizer */}
            {signalType !== 'Signal: None Detected' && (
              <div className="signal-equalizer">
                <div className="eq-bar"></div>
                <div className="eq-bar"></div>
                <div className="eq-bar"></div>
                <div className="eq-bar"></div>
                <div className="eq-bar"></div>
                <div className="eq-bar"></div>
                <div className="eq-bar"></div>
                <div className="eq-bar"></div>
              </div>
            )}
            
            {currentSpecialFreq && currentSpecialFreq.message && currentSpecialFreq.type === 'Secret Broadcast' && (
              <button 
                onClick={() => setShowDecodeModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
                  border: '1px solid #ffd700',
                  color: '#000',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '8px',
                  fontFamily: 'Orbitron',
                  cursor: 'pointer',
                  marginTop: '2px'
                }}
              >
                🔍 DECODE
              </button>
            )}
          </div>
        )}
        
        {/* Broadcast restriction warning */}
        {!canBroadcast && currentFreq > BROADCAST_MAX && (
          <div className="screen-line broadcast-warning">
            <span style={{color: '#ff4444', fontSize: '9px'}}>Listen-only frequency. Broadcasting disabled.</span>
          </div>
        )}
        {isLocked && lockedStations.length > 0 && (
          <div className="screen-line locked-info">
            <span style={{color: '#d35fff'}}>🔒 Locked at: {lockedStations.map(f => f.toFixed(1)).join(', ')} MHz</span>
          </div>
        )}
        {showFrequencyHint && activeMode === "LISTEN" && (
          <div className="screen-line frequency-hint">
            <span style={{color: '#ffd700', animation: 'freq-flicker 1s ease-in-out infinite'}}>
              🔍 Searching for hidden channels...
            </span>
          </div>
        )}
        {foundFreq && (
          <div className="screen-line found-freq">
            <span style={{color: '#00ff00', fontWeight: 'bold'}}>
              ✅ HIDDEN CHANNEL FOUND!
            </span>
          </div>
        )}
        
        {/* Multi-Channel Selection UI */}
        {activeMode === "MULTI" && (
          <div className="screen-line multi-channel-section">
            <div style={{width: '100%'}}>
              <span style={{color: '#ff6600', fontSize: '10px', display: 'block', marginBottom: '4px'}}>Select up to 3 channels:</span>
              <div className="channel-buttons">
                {multiChannels.map((freq, index) => (
                  <button
                    key={index}
                    className={`channel-btn ${freq !== null ? 'selected' : ''}`}
                    onClick={() => freq !== null ? clearChannel(index) : selectChannel(index)}
                    disabled={!isSignalOn || isLocked || (freq === null && selectedFrequencies.length >= 3)}
                    style={{
                      background: freq !== null ? 'linear-gradient(135deg, #ff6600, #ff3300)' : 'rgba(0, 0, 0, 0.6)',
                      border: freq !== null ? '2px solid #ff6600' : '1px solid rgba(255, 102, 0, 0.4)',
                      color: freq !== null ? '#fff' : '#ff6600',
                      padding: '3px 6px',
                      margin: '1px',
                      borderRadius: '3px',
                      fontSize: '8px',
                      fontFamily: '"Orbitron", monospace',
                      cursor: freq === null && selectedFrequencies.length >= 3 ? 'not-allowed' : 'pointer',
                      minWidth: '35px',
                      textAlign: 'center',
                      boxShadow: freq !== null ? '0 0 8px rgba(255, 102, 0, 0.6)' : 'none',
                      opacity: freq === null && selectedFrequencies.length >= 3 ? '0.3' : '1',
                      transition: 'all 0.2s ease',
                      animation: freq !== null ? 'channel-pulse 1s ease-in-out infinite' : 'none'
                    }}
                  >
                    {freq !== null ? `${freq.toFixed(1)}` : `F${index + 1}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={`touchpad-keypad ${isLocked ? 'keypad-locked' : ''}`}>
        <div className="keypad-row">
          <button className="keypad-btn" onClick={() => handleKeypadNumber(1)} disabled={!isSignalOn || isLocked}>1</button>
          <button className="keypad-btn" onClick={() => handleKeypadNumber(2)} disabled={!isSignalOn || isLocked}>2</button>
          <button className="keypad-btn" onClick={() => handleKeypadNumber(3)} disabled={!isSignalOn || isLocked}>3</button>
          <button className="keypad-btn freq-adjust" onClick={handleFreqBack} disabled={!isSignalOn || isLocked}>◄◄</button>
        </div>
        <div className="keypad-row">
          <button className="keypad-btn" onClick={() => handleKeypadNumber(4)} disabled={!isSignalOn || isLocked}>4</button>
          <button className="keypad-btn" onClick={() => handleKeypadNumber(5)} disabled={!isSignalOn || isLocked}>5</button>
          <button className="keypad-btn" onClick={() => handleKeypadNumber(6)} disabled={!isSignalOn || isLocked}>6</button>
          <button 
            className={`keypad-btn preset-btn ${currentFreq === 7.3 && isSignalOn ? 'active' : ''}`}
            onClick={() => setPresetFreq(7.3)}
            disabled={!isSignalOn || isLocked}
          >
            F1
          </button>
        </div>
        <div className="keypad-row">
          <button className="keypad-btn" onClick={() => handleKeypadNumber(7)} disabled={!isSignalOn || isLocked}>7</button>
          <button className="keypad-btn" onClick={() => handleKeypadNumber(8)} disabled={!isSignalOn || isLocked}>8</button>
          <button className="keypad-btn" onClick={() => handleKeypadNumber(9)} disabled={!isSignalOn || isLocked}>9</button>
          <button 
            className={`keypad-btn preset-btn ${currentFreq === 13.0 && isSignalOn ? 'active' : ''}`}
            onClick={() => setPresetFreq(13.0)}
            disabled={!isSignalOn || isLocked}
          >
            F2
          </button>
        </div>
        <div className="keypad-row">
          <button className="keypad-btn" onClick={() => handleKeypadNumber(0)} disabled={!isSignalOn || isLocked}>0</button>
          <button className="keypad-btn" onClick={handleDecimalPoint} disabled={!isSignalOn || isLocked}>.</button>
          <button className="keypad-btn freq-adjust" onClick={handleFreqForward} disabled={!isSignalOn || isLocked}>►►</button>
          <button 
            className={`keypad-btn power-btn ${isSignalOn ? 'on' : 'off'}`}
            onClick={handleTogglePower}
          >
            {isSignalOn ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="touchpad-actions">
        <button 
          className={`touchpad-action-btn listen-btn ${activeMode === "LISTEN" && isSignalOn ? "active" : ""}`} 
          onClick={handleListen}
          disabled={!isSignalOn || isLocked}
        >
          🎧 LISTEN
        </button>
        <button 
          className={`touchpad-action-btn cast-btn ${activeMode === "CAST" && isSignalOn ? "active" : ""} ${!canBroadcast ? 'disabled-broadcast' : ''}`} 
          onClick={handleCast}
          disabled={!isSignalOn || isLocked || !canBroadcast}
          title={!canBroadcast ? 'Broadcasting disabled on this channel' : ''}
        >
          📡 {activeMode === "MULTI" && selectedFrequencies.length > 0 ? `CAST ${selectedFrequencies.length}x` : 'CAST'}
        </button>
        <button 
          className={`touchpad-action-btn multicast-btn ${activeMode === "MULTI" ? "active" : ""}`} 
          onClick={handleMultiMode}
          disabled={!isSignalOn || isLocked}
        >
          📡 MULTI
        </button>
        {isLocked ? (
          <button 
            className="touchpad-action-btn unlock-btn" 
            onClick={handleUnlock}
          >
            🔓 UNLOCK
          </button>
        ) : (
          <button 
            className="touchpad-action-btn lock-btn" 
            onClick={handleLockStation}
            disabled={!isSignalOn || !isMulticast || lockedStations.length >= 3 || lockedStations.includes(currentFreq)}
          >
            🔒 LOCK
          </button>
        )}
      </div>
      
      {/* Decode Modal for Secret Broadcasts */}
      {showDecodeModal && currentSpecialFreq && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 20, 40, 0.9) 100%)',
          border: '2px solid #ffd700',
          borderRadius: '8px',
          padding: '20px',
          fontFamily: 'Orbitron',
          color: '#ffd700',
          textAlign: 'center',
          zIndex: 1000,
          minWidth: '300px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 0 20px rgba(255, 215, 0, 0.6)'
        }}>
          <h3 style={{margin: '0 0 15px 0', fontSize: '16px'}}>🔐 ENCRYPTED TRANSMISSION</h3>
          <div style={{
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '15px',
            fontFamily: 'monospace',
            fontSize: '10px',
            letterSpacing: '1px',
            wordBreak: 'break-all'
          }}>
            {currentSpecialFreq.message}
          </div>
          <p style={{fontSize: '12px', margin: '0 0 15px 0', color: '#ffaa00'}}>
            {currentSpecialFreq.description}
          </p>
          <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
            <button 
              onClick={handleDecodeMessage}
              style={{
                background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
                border: '1px solid #ffd700',
                color: '#000',
                padding: '8px 16px',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'Orbitron',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔓 DECODE ({currentSpecialFreq.reward} XP)
            </button>
            <button 
              onClick={() => setShowDecodeModal(false)}
              style={{
                background: 'rgba(100, 100, 100, 0.6)',
                border: '1px solid #666',
                color: '#ccc',
                padding: '8px 16px',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'Orbitron',
                cursor: 'pointer'
              }}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignalDial;