import React, { useState, useEffect } from 'react';

interface SignalTouchpadProps {
  className?: string;
}

export default function SignalTouchpad({ className }: SignalTouchpadProps) {
  const [frequency, setFrequency] = useState('09.50');
  const [isInputMode, setIsInputMode] = useState(false);
  const [inputBuffer, setInputBuffer] = useState('');
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [signalStatus, setSignalStatus] = useState<'idle' | 'active' | 'locked'>('idle');
  const [signalStrength, setSignalStrength] = useState(0);
  const [mode, setMode] = useState<'listen' | 'broadcast' | 'off'>('off');

  // Simulate signal strength based on frequency and mode
  useEffect(() => {
    if (mode === 'off') {
      setSignalStrength(0);
      return;
    }

    const freq = parseFloat(frequency);
    let baseStrength = 0;

    // Simulate signal strength based on frequency (some frequencies have better reception)
    if (freq === 7.30 || freq === 13.00) {
      baseStrength = 85 + Math.random() * 15; // Special frequencies have strong signals
    } else if (freq >= 8.0 && freq <= 12.0) {
      baseStrength = 60 + Math.random() * 25; // Mid-range frequencies
    } else {
      baseStrength = 30 + Math.random() * 30; // Edge frequencies
    }

    // Broadcasting typically has more consistent signal
    if (mode === 'broadcast') {
      baseStrength = Math.max(baseStrength, 70);
    }

    setSignalStrength(Math.round(baseStrength));

    // Update signal strength periodically
    const interval = setInterval(() => {
      setSignalStrength(prev => {
        const variance = (Math.random() - 0.5) * 10;
        const newStrength = Math.max(0, Math.min(100, prev + variance));
        return Math.round(newStrength);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [frequency, mode]);

  // Handle keypad button presses with full functionality
  const handleKeyPress = (key: string) => {
    setActiveKey(key);
    setTimeout(() => setActiveKey(null), 150);

    // Play button sound effect (simple beep)
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = key === 'OK' ? 800 : key.includes('F') ? 600 : 400;
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Audio not available, continue silently
    }

    if (key === 'OK') {
      if (inputBuffer.length >= 1) {
        const value = parseFloat(inputBuffer);
        if (!isNaN(value) && value >= 5.0 && value <= 16.0) {
          setFrequency(value.toFixed(2));
          setSignalStatus('active');
          console.log(`✅ Signal frequency set to: ${value.toFixed(2)} MHz`);
          
          // Check for special frequencies
          if (value === 7.30 || value === 13.00) {
            setSignalStatus('locked');
            console.log(`🔒 Special frequency locked: ${value.toFixed(2)} MHz`);
          }
          
          // Reset status after 2 seconds
          setTimeout(() => setSignalStatus('idle'), 2000);
        } else {
          console.log('❌ Invalid frequency range. Must be between 5.0 and 16.0 MHz');
        }
      }
      setInputBuffer('');
      setIsInputMode(false);
      return;
    }

    if (key === '<<') {
      if (isInputMode) {
        setInputBuffer(prev => prev.slice(0, -1));
      } else {
        // Exit input mode if not currently inputting
        setIsInputMode(false);
        setInputBuffer('');
      }
      return;
    }

    if (key === 'F1' || key === 'F2') {
      // Quick frequency presets - instant activation
      const presetFreq = key === 'F1' ? '07.30' : '13.00';
      setFrequency(presetFreq);
      console.log(`🎯 Signal preset ${key} activated: ${presetFreq} MHz`);
      setInputBuffer('');
      setIsInputMode(false);
      return;
    }

    // Mode switching buttons
    if (key === 'LISTEN') {
      setMode(mode === 'listen' ? 'off' : 'listen');
      console.log(`📻 ${mode === 'listen' ? 'Stopped listening' : 'Started listening'} on ${frequency} MHz`);
      return;
    }

    if (key === 'BROADCAST') {
      setMode(mode === 'broadcast' ? 'off' : 'broadcast');
      console.log(`📡 ${mode === 'broadcast' ? 'Stopped broadcasting' : 'Started broadcasting'} on ${frequency} MHz`);
      return;
    }

    // Number input - automatically enter input mode
    if ('0123456789.'.includes(key)) {
      if (!isInputMode) {
        setIsInputMode(true);
        setInputBuffer(key);
      } else {
        if (inputBuffer.length < 5) { // Limit to XX.XX format
          // Prevent multiple decimal points
          if (key === '.' && inputBuffer.includes('.')) return;
          setInputBuffer(prev => prev + key);
        }
      }
    }
  };

  // Handle display click to enter input mode
  const handleDisplayClick = () => {
    setIsInputMode(true);
    setInputBuffer('');
  };

  // Keypad button component with TRON-style cyan glow
  const KeypadButton = ({ children, onClick, className: btnClass = '', isSpecial = false }: { 
    children: React.ReactNode; 
    onClick: () => void; 
    className?: string;
    isSpecial?: boolean;
  }) => {
    const isActive = activeKey === children?.toString();
    const baseStyle = isSpecial ? 'from-cyan-400/20 to-cyan-600/20' : 'from-gray-800/80 to-gray-900/80';
    const hoverStyle = isSpecial ? 'hover:from-cyan-300/30 hover:to-cyan-500/30' : 'hover:from-gray-700/80 hover:to-gray-800/80';
    const activeStyle = isActive ? 'from-cyan-300/40 to-cyan-500/40 shadow-cyan-400/50' : '';
    
    return (
      <button
        onClick={onClick}
        style={{
          fontFamily: 'Orbitron, sans-serif',
          background: isActive 
            ? 'linear-gradient(145deg, rgba(0, 240, 255, 0.3), rgba(0, 188, 212, 0.3))'
            : isSpecial 
            ? 'linear-gradient(145deg, rgba(0, 240, 255, 0.15), rgba(0, 188, 212, 0.15))'
            : 'linear-gradient(145deg, rgba(30, 30, 30, 0.8), rgba(10, 10, 10, 0.8))',
          border: `1px solid ${isActive ? '#00f0ff' : isSpecial ? '#00bcd4' : '#333'}`,
          boxShadow: isActive 
            ? '0 0 15px rgba(0, 240, 255, 0.6), inset 0 1px 3px rgba(0, 240, 255, 0.3)'
            : isSpecial
            ? '0 0 8px rgba(0, 188, 212, 0.4), inset 0 1px 2px rgba(0, 188, 212, 0.2)'
            : '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1)',
          color: isSpecial ? '#00f0ff' : '#e0e0e0',
          transition: 'all 0.15s ease',
        }}
        className={`
          w-12 h-10 rounded-sm font-bold text-sm
          ${btnClass}
        `}
      >
        {children}
      </button>
    );
  };

  return (
    <div 
      className={`signal-touchpad ${className}`}
      style={{
        position: 'relative',
        width: '320px',
        height: '420px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Main touchpad device - TRON style */}
      <div 
        style={{
          width: '200px',
          height: '380px',
          background: 'linear-gradient(145deg, rgba(20, 25, 30, 0.95), rgba(10, 15, 20, 0.95))',
          borderRadius: '12px',
          border: '2px solid #00bcd4',
          boxShadow: '0 0 20px rgba(0, 188, 212, 0.3), 0 8px 16px rgba(0,0,0,0.5), inset 0 1px 3px rgba(0, 240, 255, 0.1)',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontFamily: 'Orbitron, sans-serif',
        }}
      >
        {/* Top panel with futuristic elements */}
        <div style={{
          height: '20px',
          background: 'linear-gradient(to bottom, rgba(0, 240, 255, 0.1), rgba(0, 188, 212, 0.05))',
          borderRadius: '6px',
          border: '1px solid rgba(0, 188, 212, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 8px',
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            background: 'radial-gradient(circle, #00f0ff, #00bcd4)',
            borderRadius: '50%',
            boxShadow: '0 0 8px rgba(0, 240, 255, 0.6)',
          }} />
          <div style={{
            width: '6px',
            height: '6px',
            background: 'radial-gradient(circle, #00f0ff, #00bcd4)',
            borderRadius: '50%',
            boxShadow: '0 0 8px rgba(0, 240, 255, 0.6)',
          }} />
        </div>

        {/* LCD Display - TRON style */}
        <div 
          onClick={handleDisplayClick}
          style={{
            height: '90px',
            background: 'linear-gradient(145deg, rgba(0, 0, 0, 0.85), rgba(0, 10, 15, 0.9))',
            border: '2px solid #00bcd4',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-evenly',
            padding: '10px 12px',
            cursor: 'pointer',
            fontFamily: 'Orbitron, sans-serif',
            boxShadow: '0 0 15px rgba(0, 188, 212, 0.4), inset 0 0 10px rgba(0, 240, 255, 0.1)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Scanning line effect */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, #00f0ff, transparent)',
            animation: 'scanLine 3s linear infinite',
            opacity: 0.6,
          }} />
          
          {/* Mode and Signal Status */}
          <div style={{
            color: '#ffffff',
            fontSize: '10px',
            lineHeight: '1.2',
            textShadow: '0 0 8px rgba(0, 240, 255, 1), 0 0 2px rgba(255, 255, 255, 0.8)',
            letterSpacing: '0.5px',
            textAlign: 'center',
            fontWeight: 'bold',
          }}>
            MODE: {mode.toUpperCase()} | SIGNAL: {signalStrength}%
          </div>
          
          {/* Signal Strength Bar */}
          <div style={{
            width: '130px',
            height: '5px',
            backgroundColor: 'rgba(0, 240, 255, 0.4)',
            borderRadius: '3px',
            margin: '0 auto',
            position: 'relative',
            border: '1px solid rgba(0, 240, 255, 0.6)',
          }}>
            <div style={{
              width: `${signalStrength}%`,
              height: '100%',
              backgroundColor: signalStrength > 70 ? '#00ff00' : signalStrength > 40 ? '#ffff00' : '#ff6600',
              borderRadius: '2px',
              transition: 'all 0.5s ease',
              boxShadow: `0 0 8px ${signalStrength > 70 ? '#00ff00' : signalStrength > 40 ? '#ffff00' : '#ff6600'}`,
            }} />
          </div>

          {/* Frequency Presets */}
          <div style={{
            color: '#ffffff',
            fontSize: '10px',
            lineHeight: '1.2',
            textShadow: '0 0 8px rgba(0, 240, 255, 1), 0 0 2px rgba(255, 255, 255, 0.8)',
            letterSpacing: '0.5px',
            textAlign: 'center',
            fontWeight: 'bold',
          }}>
            F1: 07.30  F2: 13.00 MHz
          </div>

          {/* Current Frequency Display */}
          <div style={{
            color: isInputMode ? '#ffff00' : '#ffffff',
            fontSize: '20px',
            fontWeight: 'bold',
            lineHeight: '1.2',
            textShadow: isInputMode 
              ? '0 0 12px rgba(255, 255, 0, 1), 0 0 4px rgba(255, 255, 255, 0.8)' 
              : '0 0 12px rgba(0, 240, 255, 1), 0 0 4px rgba(255, 255, 255, 0.8)',
            letterSpacing: '1px',
            textAlign: 'center',
            transition: 'all 0.3s ease',
          }}>
            {isInputMode ? (inputBuffer || '_') : frequency} MHz
            {isInputMode && (
              <span style={{
                animation: 'blink 1s infinite',
                color: '#ffff00',
                marginLeft: '2px',
              }}>
                |
              </span>
            )}
          </div>
        </div>

        {/* Keypad */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '4px',
          marginTop: '8px',
        }}>
          {/* Row 1 */}
          <KeypadButton onClick={() => handleKeyPress('1')}>1</KeypadButton>
          <KeypadButton onClick={() => handleKeyPress('2')}>2</KeypadButton>
          <KeypadButton onClick={() => handleKeyPress('3')}>3</KeypadButton>
          <KeypadButton onClick={() => handleKeyPress('<<')} isSpecial={true}>{'<<'}</KeypadButton>
          
          {/* Row 2 */}
          <KeypadButton onClick={() => handleKeyPress('4')}>4</KeypadButton>
          <KeypadButton onClick={() => handleKeyPress('5')}>5</KeypadButton>
          <KeypadButton onClick={() => handleKeyPress('6')}>6</KeypadButton>
          <KeypadButton onClick={() => handleKeyPress('F1')} isSpecial={true}>F1</KeypadButton>
          
          {/* Row 3 */}
          <KeypadButton onClick={() => handleKeyPress('7')}>7</KeypadButton>
          <KeypadButton onClick={() => handleKeyPress('8')}>8</KeypadButton>
          <KeypadButton onClick={() => handleKeyPress('9')}>9</KeypadButton>
          <KeypadButton onClick={() => handleKeyPress('F2')} isSpecial={true}>F2</KeypadButton>
          
          {/* Row 4 */}
          <KeypadButton onClick={() => handleKeyPress('.')}>.</KeypadButton>
          <KeypadButton onClick={() => handleKeyPress('0')}>0</KeypadButton>
          <div></div> {/* Empty space to match reference */}
          <KeypadButton onClick={() => handleKeyPress('OK')} isSpecial={true}>OK</KeypadButton>
        </div>

        {/* Mode Control Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '6px', 
          marginTop: '20px',
          justifyContent: 'center',
        }}>
          <button
            onClick={() => handleKeyPress('LISTEN')}
            style={{
              width: '64px',
              height: '28px',
              backgroundColor: mode === 'listen' 
                ? 'rgba(0, 255, 0, 0.3)' 
                : activeKey === 'LISTEN' 
                  ? 'rgba(0, 240, 255, 0.3)' 
                  : 'rgba(0, 240, 255, 0.1)',
              border: `1px solid ${mode === 'listen' ? '#00ff00' : '#00f0ff'}`,
              borderRadius: '3px',
              color: mode === 'listen' ? '#00ff00' : '#00f0ff',
              fontSize: '8px',
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 'bold',
              cursor: 'pointer',
              textShadow: `0 0 6px ${mode === 'listen' ? 'rgba(0, 255, 0, 0.8)' : 'rgba(0, 240, 255, 0.8)'}`,
              transition: 'all 0.15s ease',
              transform: activeKey === 'LISTEN' ? 'scale(0.95)' : 'scale(1)',
            }}
          >
            📻 LISTEN
          </button>
          <button
            onClick={() => handleKeyPress('BROADCAST')}
            style={{
              width: '64px',
              height: '28px',
              backgroundColor: mode === 'broadcast' 
                ? 'rgba(255, 100, 0, 0.3)' 
                : activeKey === 'BROADCAST' 
                  ? 'rgba(0, 240, 255, 0.3)' 
                  : 'rgba(0, 240, 255, 0.1)',
              border: `1px solid ${mode === 'broadcast' ? '#ff6400' : '#00f0ff'}`,
              borderRadius: '3px',
              color: mode === 'broadcast' ? '#ff6400' : '#00f0ff',
              fontSize: '8px',
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 'bold',
              cursor: 'pointer',
              textShadow: `0 0 6px ${mode === 'broadcast' ? 'rgba(255, 100, 0, 0.8)' : 'rgba(0, 240, 255, 0.8)'}`,
              transition: 'all 0.15s ease',
              transform: activeKey === 'BROADCAST' ? 'scale(0.95)' : 'scale(1)',
            }}
          >
            📡 CAST
          </button>
        </div>
      </div>
    </div>
  );
}