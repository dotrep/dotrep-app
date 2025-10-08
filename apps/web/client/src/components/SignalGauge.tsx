import React, { useState, useEffect, useRef } from 'react';

interface SignalGaugeProps {
  className?: string;
}

export function SignalGauge({ className = '' }: SignalGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentValue, setCurrentValue] = useState(9.5);
  const [isDragging, setIsDragging] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const pendingValueRef = useRef<number | null>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas size and center - moved down for proper alignment
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + 25; // Move center down 25px
    const outerRadius = 145; // Increased for larger canvas
    const innerRadius = 105; // Increased for larger canvas

    // Draw main outer arc - clean without bright glow
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, Math.PI, 0); // 180 degree arc
    ctx.lineWidth = 8; // Much thinner arc to reduce brightness
    ctx.strokeStyle = '#00CCCC'; // Dimmer cyan color
    ctx.lineCap = 'round';
    ctx.stroke();

    // Draw inner arc for decimal numbers - no glow
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, Math.PI, 0);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00CCCC';
    ctx.stroke();

    // Draw outer scale numbers (1-16) properly spaced around the arc
    for (let i = 1; i <= 16; i++) {
      const angle = Math.PI + ((i - 1) / 15) * Math.PI; // 180 degrees span  
      const labelRadius = outerRadius + 35; // Increased distance from arc
      const labelX = centerX + labelRadius * Math.cos(angle);
      const labelY = centerY + labelRadius * Math.sin(angle);

      // Draw compact number with high contrast
      ctx.fillStyle = '#00FFFF';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Add text shadow for better readability
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      ctx.fillText(i.toString(), labelX, labelY);
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    // Draw inner decimal numbers (3.5, 5.5, etc.) - no glow
    const innerDecimals = [1.5, 3.5, 5.5, 7.5, 9.5, 11.5, 13.5, 15.5];
    innerDecimals.forEach((value, index) => {
      const angle = Math.PI + ((value - 1) / 15) * Math.PI;
      const labelRadius = innerRadius - 20;
      const labelX = centerX + labelRadius * Math.cos(angle);
      const labelY = centerY + labelRadius * Math.sin(angle);

      ctx.fillStyle = '#00CCCC';
      ctx.font = 'bold 10px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(value.toString(), labelX, labelY);
    });

    // Draw tick marks (only for positions 1-16)
    for (let i = 1; i <= 16; i++) {
      const angle = Math.PI + ((i - 1) / 15) * Math.PI;
      const tickOuterRadius = outerRadius + 20;
      const tickInnerRadius = outerRadius - 20;
      
      const tickOuterX = centerX + tickOuterRadius * Math.cos(angle);
      const tickOuterY = centerY + tickOuterRadius * Math.sin(angle);
      const tickInnerX = centerX + tickInnerRadius * Math.cos(angle);
      const tickInnerY = centerY + tickInnerRadius * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(tickOuterX, tickOuterY);
      ctx.lineTo(tickInnerX, tickInnerY);
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Draw red arrow pointing outward - connected to center knob
    const needleAngle = Math.PI + ((currentValue - 1) / 15) * Math.PI;
    const arrowLength = outerRadius - 15;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(needleAngle - Math.PI / 2);
    
    // Draw arrow shaft from center (knob position) to outer edge
    ctx.beginPath();
    ctx.moveTo(-3, 0); // Start from center where knob is
    ctx.lineTo(-3, arrowLength - 15);
    ctx.lineTo(3, arrowLength - 15);
    ctx.lineTo(3, 0); // End at center where knob is
    ctx.closePath();
    ctx.fillStyle = '#FF0000';
    ctx.fill();
    
    // Draw arrow head pointing outward
    ctx.beginPath();
    ctx.moveTo(-10, arrowLength - 15);
    ctx.lineTo(0, arrowLength);
    ctx.lineTo(10, arrowLength - 15);
    ctx.closePath();
    ctx.fillStyle = '#FF0000';
    ctx.fill();
    
    // Draw center hub connecting to knob
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#FF0000';
    ctx.fill();
    ctx.strokeStyle = '#FF4444';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();

  }, [currentValue]);

  // Ultra-responsive knob interaction with immediate feedback
  const handleKnobInteraction = (clientX: number, clientY: number) => {
    if (!knobRef.current) return;
    
    // Optimized rect calculation with fixed values
    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + 36; // Fixed 72px knob / 2
    const centerY = rect.top + 36;
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    
    // Ultra-fast angle calculation
    let angle = Math.atan2(deltaY, deltaX) * 57.29577951308232; // Pre-calculated 180/PI
    
    // Optimized normalization
    angle += 90;
    if (angle < 0) angle += 360;
    if (angle > 180) angle = angle > 270 ? 0 : 180;
    
    // Hyper-responsive dial movement
    const newValue = Math.max(1, Math.min(16, 1 + (angle * 0.25000000000))); // Extreme sensitivity for instant response
    
    // Instant update for maximum responsiveness
    setCurrentValue(newValue);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleKnobInteraction(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      handleKnobInteraction(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
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

  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Ultra-fast wheel support
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1.2 : -1.2; // Maximum wheel sensitivity for ultra-responsive scrolling
    const newValue = Math.max(1, Math.min(16, currentValue + delta));
    
    // Instant wheel update for maximum responsiveness
    setCurrentValue(newValue);
  };

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

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div 
      className={`signal-gauge ${className}`}
      style={{
        position: 'relative',
        width: '320px',
        height: '320px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',

      }}
    >
      {/* Main gauge canvas - clean without neon container */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%'
      }}>
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          style={{
            background: 'transparent',
            display: 'block',
            margin: '10px auto 0'
          }}
        />

        {/* Interactive control knob - positioned over red dial center */}
        <div 
          ref={knobRef}
          style={{
            position: 'absolute',
            top: '240px', // Positioned for larger gauge
            left: '200px', // Half of 400px width  
            transform: 'translate(-50%, -50%)', // Center the knob itself
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: isDragging 
              ? 'linear-gradient(145deg, #8B6914, #D4AF37, #B8860B, #654321)'
              : 'linear-gradient(145deg, #D4AF37, #B8860B, #8B6914, #654321)',
            border: '3px solid #2C2C2C',
            boxShadow: isDragging 
              ? 'inset 0 3px 12px rgba(0,0,0,0.6), 0 0 0 2px rgba(0,188,212,0.3), 0 4px 16px rgba(0,0,0,0.8)'
              : 'inset 0 3px 8px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.6), inset 0 -2px 4px rgba(255,255,255,0.1)',
            cursor: isDragging ? 'grabbing' : 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: isDragging ? 'none' : 'all 0.1s ease-out',
            zIndex: 10
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onWheel={handleWheel}
        >
          {/* Realistic knob indicator line */}
          <div style={{
            position: 'absolute',
            width: '3px',
            height: '24px',
            background: 'linear-gradient(to bottom, #FFFFFF, #E0E0E0)',
            borderRadius: '2px',
            top: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.4)'
          }} />
          
          {/* Knob texture ridges */}
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: '1px',
              height: '60px',
              background: 'rgba(0,0,0,0.2)',
              transform: `rotate(${i * 45}deg)`,
              transformOrigin: 'center'
            }} />
          ))}
        </div>

        {/* Digital display - centered below the knob with transparent background */}
        <div style={{
          position: 'absolute',
          top: '280px', // Positioned between knob and SIGNAL label
          left: '200px', // Aligned with knob center position
          transform: 'translateX(-50%)',
          padding: '8px 16px'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#00FFFF',
            fontFamily: 'Orbitron, sans-serif',
            textAlign: 'center',
            minWidth: '70px',
            textShadow: '0 0 10px #00FFFF, 0 0 20px #00FFFF, 0 0 30px #00FFFF'
          }}>
            {currentValue.toFixed(1)}
          </div>
        </div>
      </div>


    </div>
  );
}

export default SignalGauge;