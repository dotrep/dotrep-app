import React, { useState, useRef, useEffect } from 'react';

interface SignalDialProps {
  className?: string;
}

export function SignalDial({ className = '' }: SignalDialProps) {
  const [frequency, setFrequency] = useState(9.5);
  const [isDragging, setIsDragging] = useState(false);
  const knobRef = useRef<HTMLDivElement>(null);

  const frequencyToAngle = (freq: number) => {
    return (freq / 16) * 180 - 90;
  };

  const angleToFrequency = (angle: number) => {
    const clampedAngle = Math.max(-90, Math.min(90, angle));
    return ((clampedAngle + 90) / 180) * 16;
  };

  const handleKnobInteraction = (clientX: number, clientY: number) => {
    if (!knobRef.current) return;
    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    if (angle > 90) angle = 90;
    else if (angle < -90) angle = -90;
    const newFreq = angleToFrequency(angle);
    setFrequency(newFreq);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleKnobInteraction(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      handleKnobInteraction(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    handleKnobInteraction(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging && e.touches[0]) {
      e.preventDefault();
      const touch = e.touches[0];
      handleKnobInteraction(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  const needleAngle = frequencyToAngle(frequency);

  return (
    <div 
      className={`signal-gauge-fixed ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px'
      }}
    >
      {/* Main Gauge Container */}
      <div style={{
        position: 'relative',
        background: 'rgba(5, 25, 40, 0.95)',
        border: '2px solid #00f0ff',
        borderRadius: '140px 140px 20px 20px',
        padding: '20px 20px 40px 20px',
        boxShadow: '0 0 25px rgba(0, 240, 255, 0.5)',
        width: '280px',
        height: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        
        <svg width="240" height="140" viewBox="0 0 240 140" style={{ display: 'block' }}>
          {/* Outer semicircle */}
          <path
            d="M 20 120 A 100 100 0 0 1 220 120"
            fill="none"
            stroke="#00f0ff"
            strokeWidth="3"
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 8px #00f0ff)' }}
          />

          {/* Inner semicircle */}
          <path
            d="M 60 120 A 60 60 0 0 1 180 120"
            fill="none"
            stroke="#00f0ff"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 6px #00f0ff)' }}
          />

          {/* Major tick marks on outer arc */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 16].map((value, i) => {
            const angle = ((value === 16 ? 11 : value - 1) / 10) * 180 - 90;
            const radian = (angle * Math.PI) / 180;
            const tickX1 = 120 + 88 * Math.cos(radian);
            const tickY1 = 120 + 88 * Math.sin(radian);
            const tickX2 = 120 + 96 * Math.cos(radian);
            const tickY2 = 120 + 96 * Math.sin(radian);
            
            return (
              <line 
                key={`major-tick-${value}`}
                x1={tickX1} y1={tickY1} 
                x2={tickX2} y2={tickY2} 
                stroke="#00f0ff" 
                strokeWidth="2"
                style={{ filter: 'drop-shadow(0 0 3px #00f0ff)' }}
              />
            );
          })}

          {/* Minor tick marks */}
          {Array.from({ length: 32 }, (_, i) => {
            const angle = (i / 31) * 180 - 90;
            const radian = (angle * Math.PI) / 180;
            const isMajor = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 16].some(major => 
              Math.abs(angle - (((major === 16 ? 11 : major - 1) / 10) * 180 - 90)) < 4
            );
            if (isMajor) return null;
            
            const tickX1 = 120 + 90 * Math.cos(radian);
            const tickY1 = 120 + 90 * Math.sin(radian);
            const tickX2 = 120 + 96 * Math.cos(radian);
            const tickY2 = 120 + 96 * Math.sin(radian);
            
            return (
              <line 
                key={`minor-tick-${i}`}
                x1={tickX1} y1={tickY1} 
                x2={tickX2} y2={tickY2} 
                stroke="rgba(0, 240, 255, 0.5)" 
                strokeWidth="1"
              />
            );
          })}

          {/* Inner arc tick marks */}
          {Array.from({ length: 16 }, (_, i) => {
            const angle = (i / 15) * 180 - 90;
            const radian = (angle * Math.PI) / 180;
            const tickX1 = 120 + 55 * Math.cos(radian);
            const tickY1 = 120 + 55 * Math.sin(radian);
            const tickX2 = 120 + 62 * Math.cos(radian);
            const tickY2 = 120 + 62 * Math.sin(radian);
            
            return (
              <line 
                key={`inner-tick-${i}`}
                x1={tickX1} y1={tickY1} 
                x2={tickX2} y2={tickY2} 
                stroke="rgba(0, 240, 255, 0.6)" 
                strokeWidth="1"
              />
            );
          })}

          {/* Outer numbers - positioned to match reference exactly */}
          <text x="25" y="115" textAnchor="middle" fill="#00f0ff" fontSize="16" fontFamily="Orbitron, monospace" fontWeight="bold" style={{ filter: 'drop-shadow(0 0 4px #00f0ff)' }}>1</text>
          <text x="45" y="90" textAnchor="middle" fill="#00f0ff" fontSize="16" fontFamily="Orbitron, monospace" fontWeight="bold" style={{ filter: 'drop-shadow(0 0 4px #00f0ff)' }}>2</text>
          <text x="70" y="70" textAnchor="middle" fill="#00f0ff" fontSize="16" fontFamily="Orbitron, monospace" fontWeight="bold" style={{ filter: 'drop-shadow(0 0 4px #00f0ff)' }}>3</text>
          <text x="95" y="55" textAnchor="middle" fill="#00f0ff" fontSize="16" fontFamily="Orbitron, monospace" fontWeight="bold" style={{ filter: 'drop-shadow(0 0 4px #00f0ff)' }}>4</text>
          <text x="120" y="45" textAnchor="middle" fill="#00f0ff" fontSize="16" fontFamily="Orbitron, monospace" fontWeight="bold" style={{ filter: 'drop-shadow(0 0 4px #00f0ff)' }}>5</text>
          <text x="145" y="55" textAnchor="middle" fill="#00f0ff" fontSize="16" fontFamily="Orbitron, monospace" fontWeight="bold" style={{ filter: 'drop-shadow(0 0 4px #00f0ff)' }}>6</text>
          <text x="170" y="70" textAnchor="middle" fill="#00f0ff" fontSize="16" fontFamily="Orbitron, monospace" fontWeight="bold" style={{ filter: 'drop-shadow(0 0 4px #00f0ff)' }}>7</text>
          <text x="195" y="90" textAnchor="middle" fill="#00f0ff" fontSize="16" fontFamily="Orbitron, monospace" fontWeight="bold" style={{ filter: 'drop-shadow(0 0 4px #00f0ff)' }}>8</text>
          <text x="215" y="115" textAnchor="middle" fill="#00f0ff" fontSize="16" fontFamily="Orbitron, monospace" fontWeight="bold" style={{ filter: 'drop-shadow(0 0 4px #00f0ff)' }}>9</text>
          <text x="210" y="125" textAnchor="middle" fill="#00f0ff" fontSize="16" fontFamily="Orbitron, monospace" fontWeight="bold" style={{ filter: 'drop-shadow(0 0 4px #00f0ff)' }}>10</text>
          <text x="225" y="125" textAnchor="middle" fill="#00f0ff" fontSize="16" fontFamily="Orbitron, monospace" fontWeight="bold" style={{ filter: 'drop-shadow(0 0 4px #00f0ff)' }}>16</text>

          {/* Inner decimal numbers */}
          <text x="85" y="85" textAnchor="middle" fill="#00f0ff" fontSize="12" fontFamily="Orbitron, monospace" fontWeight="bold" style={{ filter: 'drop-shadow(0 0 3px #00f0ff)' }}>3,5</text>
          <text x="155" y="85" textAnchor="middle" fill="#00f0ff" fontSize="12" fontFamily="Orbitron, monospace" fontWeight="bold" style={{ filter: 'drop-shadow(0 0 3px #00f0ff)' }}>5,5</text>
          <text x="75" y="100" textAnchor="middle" fill="#00f0ff" fontSize="12" fontFamily="Orbitron, monospace" fontWeight="bold" style={{ filter: 'drop-shadow(0 0 3px #00f0ff)' }}>3,5</text>
          <text x="165" y="100" textAnchor="middle" fill="#00f0ff" fontSize="12" fontFamily="Orbitron, monospace" fontWeight="bold" style={{ filter: 'drop-shadow(0 0 3px #00f0ff)' }}>5,5</text>

          {/* Yellow needle */}
          <g transform={`rotate(${needleAngle} 120 120)`}>
            <line
              x1="120" y1="120"
              x2="120" y2="50"
              stroke="#ffdd00"
              strokeWidth="4"
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 10px #ffdd00)' }}
            />
            <polygon
              points="120,50 116,58 124,58"
              fill="#ffdd00"
              style={{ filter: 'drop-shadow(0 0 6px #ffdd00)' }}
            />
          </g>

          {/* Center hub */}
          <circle cx="120" cy="120" r="8" fill="rgba(5, 25, 40, 0.9)" stroke="#00f0ff" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 4px #00f0ff)' }} />
          <circle cx="120" cy="120" r="4" fill="#00f0ff" style={{ filter: 'drop-shadow(0 0 3px #00f0ff)' }} />
        </svg>

        {/* Digital readout - positioned over SVG */}
        <div style={{
          position: 'absolute',
          top: '85px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 20, 40, 0.95)',
          border: '2px solid #00f0ff',
          borderRadius: '6px',
          padding: '4px 8px',
          boxShadow: 'inset 0 0 8px rgba(0, 240, 255, 0.4), 0 0 12px rgba(0, 240, 255, 0.7)',
          zIndex: 5
        }}>
          <div style={{
            fontSize: '16px',
            color: '#00f0ff',
            fontFamily: 'Orbitron, sans-serif',
            fontWeight: 'bold',
            textShadow: '0 0 6px #00f0ff',
            lineHeight: '1'
          }}>
            {frequency.toFixed(1)}
          </div>
        </div>

        {/* Radio chassis with enhanced grille */}
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '240px',
          height: '50px',
          background: 'linear-gradient(to bottom, rgba(0, 30, 60, 0.9), rgba(0, 20, 40, 0.9))',
          border: '2px solid #00f0ff',
          borderRadius: '0 0 15px 15px',
          boxShadow: 'inset 0 0 15px rgba(0, 240, 255, 0.3), 0 0 10px rgba(0, 240, 255, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          overflow: 'hidden'
        }}>
          {/* Enhanced grille pattern */}
          {Array.from({ length: 15 }, (_, i) => (
            <div key={i} style={{
              width: '1px',
              height: '35px',
              background: `linear-gradient(to bottom, transparent, rgba(0, 240, 255, ${0.3 + (i % 3) * 0.2}), transparent)`,
              borderRadius: '0.5px',
              boxShadow: '0 0 1px rgba(0, 240, 255, 0.5)'
            }} />
          ))}
          
          {/* Interactive control knob */}
          <div 
            ref={knobRef}
            style={{
              position: 'absolute',
              right: '15px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: isDragging 
                ? 'radial-gradient(circle at 35% 35%, #5a6578, #3d4758, #2a3040)'
                : 'radial-gradient(circle at 35% 35%, #4a5568, #2d3748, #1a202c)',
              border: `2px solid ${isDragging ? '#00f0ff' : 'rgba(0, 240, 255, 0.9)'}`,
              boxShadow: isDragging 
                ? '0 0 20px rgba(0, 240, 255, 1), inset 0 0 10px rgba(0, 240, 255, 0.3)'
                : '0 0 12px rgba(0, 240, 255, 0.8), inset 0 0 8px rgba(0, 240, 255, 0.2)',
              cursor: isDragging ? 'grabbing' : 'grab',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {/* Knob indicator dots */}
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: '2px',
                height: '2px',
                background: 'rgba(0, 240, 255, 0.8)',
                borderRadius: '50%',
                transform: `rotate(${i * 60}deg) translateY(-10px)`,
                boxShadow: '0 0 2px rgba(0, 240, 255, 0.6)'
              }} />
            ))}
            {/* Center dot */}
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#00f0ff',
              boxShadow: '0 0 6px #00f0ff',
              border: '1px solid rgba(0, 240, 255, 0.5)'
            }} />
          </div>
        </div>
      </div>

      {/* SIGNAL label */}
      <div style={{
        background: 'rgba(0, 26, 51, 0.9)',
        border: '2px solid #00f0ff',
        borderRadius: '10px',
        padding: '8px 20px',
        boxShadow: '0 0 15px rgba(0, 240, 255, 0.5)'
      }}>
        <div style={{
          fontSize: '18px',
          color: '#00f0ff',
          fontFamily: 'Orbitron, sans-serif',
          fontWeight: 'bold',
          letterSpacing: '0.2em',
          textShadow: '0 0 8px #00f0ff'
        }}>
          SIGNAL
        </div>
      </div>
    </div>
  );
}

export default SignalDial;