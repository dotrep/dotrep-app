import React, { useState, useEffect } from 'react';

interface PulseMeterProps {
  pulseStrength?: number;
}

const TOTAL_SEGMENTS = 12; // More segments for smoother appearance
const MAX_VALUE = 100; // Scale goes 0-100

const PulseMeter: React.FC<PulseMeterProps> = ({ pulseStrength = 42 }) => {
  const [currentValue, setCurrentValue] = useState(0);
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);

  // Animate to target value on mount and when pulseStrength changes
  useEffect(() => {
    const targetValue = Math.min(pulseStrength, MAX_VALUE);
    
    // Smooth animation to target value
    const duration = 2000; // 2 seconds
    const startTime = Date.now();
    const startValue = currentValue;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for realistic gauge movement
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const newValue = startValue + (targetValue - startValue) * easeOut;
      
      setCurrentValue(newValue);
      setAnimatedValue(newValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [pulseStrength]);

  // Continuous pulsing animation
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 800);
    }, 2000);

    return () => clearInterval(pulseInterval);
  }, []);

  // Calculate needle rotation (0-100 = 0° to 270° clockwise from top)
  const needleRotation = (animatedValue / MAX_VALUE) * 270;
  
  // Calculate how many segments should be active
  const activeSegments = Math.round((animatedValue / MAX_VALUE) * TOTAL_SEGMENTS);

  // 7-segment display patterns for digits 0-9
  const SEGMENT_PATTERNS: { [key: string]: number[] } = {
    '0': [1, 1, 1, 1, 1, 1, 0], // top, top-right, bottom-right, bottom, bottom-left, top-left, middle
    '1': [0, 1, 1, 0, 0, 0, 0],
    '2': [1, 1, 0, 1, 1, 0, 1],
    '3': [1, 1, 1, 1, 0, 0, 1],
    '4': [0, 1, 1, 0, 0, 1, 1],
    '5': [1, 0, 1, 1, 0, 1, 1],
    '6': [1, 0, 1, 1, 1, 1, 1],
    '7': [1, 1, 1, 0, 0, 0, 0],
    '8': [1, 1, 1, 1, 1, 1, 1],
    '9': [1, 1, 1, 1, 0, 1, 1],
  };

  const renderDigitalNumber = (number: number, centerX: number, centerY: number) => {
    const numStr = number.toString();
    const digitWidth = 20;
    const digitSpacing = 8;
    const totalWidth = numStr.length * digitWidth + (numStr.length - 1) * digitSpacing;
    const startX = centerX - totalWidth / 2;

    return numStr.split('').map((digit, index) => {
      const digitX = startX + index * (digitWidth + digitSpacing) + digitWidth/2;
      return renderDigit(digit, digitX, centerY, index);
    });
  };

  const renderDigit = (digit: string, x: number, y: number, key: number) => {
    const pattern = SEGMENT_PATTERNS[digit] || [0, 0, 0, 0, 0, 0, 0];
    const segmentLength = 12;
    const segmentThickness = 3;
    const halfHeight = segmentLength / 2;
    
    const segments = [
      // Top horizontal
      { 
        x: x - segmentLength/2, 
        y: y - halfHeight, 
        width: segmentLength, 
        height: segmentThickness 
      },
      // Top-right vertical
      { 
        x: x + segmentLength/2 - segmentThickness, 
        y: y - halfHeight, 
        width: segmentThickness, 
        height: halfHeight 
      },
      // Bottom-right vertical
      { 
        x: x + segmentLength/2 - segmentThickness, 
        y: y, 
        width: segmentThickness, 
        height: halfHeight 
      },
      // Bottom horizontal
      { 
        x: x - segmentLength/2, 
        y: y + halfHeight - segmentThickness, 
        width: segmentLength, 
        height: segmentThickness 
      },
      // Bottom-left vertical
      { 
        x: x - segmentLength/2, 
        y: y, 
        width: segmentThickness, 
        height: halfHeight 
      },
      // Top-left vertical
      { 
        x: x - segmentLength/2, 
        y: y - halfHeight, 
        width: segmentThickness, 
        height: halfHeight 
      },
      // Middle horizontal
      { 
        x: x - segmentLength/2, 
        y: y - segmentThickness/2, 
        width: segmentLength, 
        height: segmentThickness 
      },
    ];

    return (
      <g key={key}>
        {segments.map((segment, i) => (
          <rect
            key={i}
            x={segment.x}
            y={segment.y}
            width={segment.width}
            height={segment.height}
            fill={pattern[i] ? '#00f0ff' : 'transparent'}
            rx="1"
            ry="1"
          />
        ))}
      </g>
    );
  };

  return (
    <div style={{
      position: 'relative',
      width: '280px',
      height: '280px',
      color: '#00f0ff',
      fontFamily: 'Audiowide, "Orbitron", sans-serif'
    }}>
      <svg 
        viewBox="0 0 200 200" 
        style={{
          width: '280px',
          height: '280px',
          overflow: 'visible'
        }}
      >
        {/* Outer ring - no glow effects */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke={isPulsing ? '#4dd0e1' : '#00f0ff'}
          strokeWidth={isPulsing ? '3' : '2'}
          style={{
            opacity: isPulsing ? 1 : 0.8,
            transition: 'all 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)',
            transform: isPulsing ? 'scale(1.02)' : 'scale(1)',
            transformOrigin: '100px 100px'
          }}
        />
        
        {/* Additional pulse rings - simplified without drop shadows */}
        {isPulsing && (
          <>
            <circle
              cx="100"
              cy="100"
              r="95"
              fill="none"
              stroke="rgba(77, 208, 225, 0.4)"
              strokeWidth="1"
              style={{
                opacity: 0.4,
                animation: 'pulseExpand 0.8s ease-out'
              }}
            />
            <circle
              cx="100"
              cy="100"
              r="100"
              fill="none"
              stroke="rgba(77, 208, 225, 0.2)"
              strokeWidth="1"
              style={{
                opacity: 0.3,
                animation: 'pulseExpand 0.8s ease-out 0.1s'
              }}
            />
          </>
        )}
        
        {/* Transparent center - no background circle */}

        {/* Animated chunky segment bars around the circle - 3/4 circle (270 degrees) */}
        {Array.from({ length: TOTAL_SEGMENTS }, (_, i) => {
          // Start from top (0°) and go 270° clockwise
          const segmentAngle = (270 / TOTAL_SEGMENTS); // degrees per segment
          const startAngle = (i * segmentAngle) - 135; // Start from top, offset by -135° to center the 270° arc
          const endAngle = startAngle + segmentAngle - 4; // Bigger gap between segments for chunkier look
          
          const isActive = i < activeSegments;
          const animationDelay = i * 50; // Stagger animation for wave effect
          
          return (
            <path
              key={i}
              d={createThickArcPath(100, 100, 78, 58, startAngle, endAngle)}
              fill={isActive 
                ? (isPulsing ? '#4dd0e1' : '#00f0ff')
                : 'rgba(0, 188, 212, 0.15)'
              }
              stroke="none"
              style={{
                transition: `all 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)`,
                transitionDelay: `${animationDelay}ms`,
                opacity: isActive ? (isPulsing ? 1 : 0.9) : 0.3,
                transform: isPulsing && isActive ? 'scale(1.02)' : 'scale(1)',
                transformOrigin: '100px 100px'
              }}
            />
          );
        })}



        {/* Large center text display */}
        <text
          x="100"
          y="90"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={isPulsing ? '#4dd0e1' : '#00f0ff'}
          fontSize="32"
          fontWeight="bold"
          fontFamily="Audiowide, Orbitron, monospace"
          style={{
            transition: 'all 0.8s ease'
          }}
        >
          {Math.round(animatedValue)}
        </text>
        
        <text
          x="100"
          y="120"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={isPulsing ? '#4dd0e1' : '#00f0ff'}
          fontSize="18"
          fontWeight="bold"
          fontFamily="Audiowide, Orbitron, monospace"
          style={{
            transition: 'all 0.8s ease'
          }}
        >
          Hz
        </text>
      </svg>


    </div>
  );
};

// Helper function to create thick arc segments
function createThickArcPath(centerX: number, centerY: number, outerRadius: number, innerRadius: number, startAngle: number, endAngle: number) {
  const outerStart = polarToCartesian(centerX, centerY, outerRadius, startAngle);
  const outerEnd = polarToCartesian(centerX, centerY, outerRadius, endAngle);
  const innerStart = polarToCartesian(centerX, centerY, innerRadius, startAngle);
  const innerEnd = polarToCartesian(centerX, centerY, innerRadius, endAngle);
  
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  
  return [
    "M", outerStart.x, outerStart.y,
    "A", outerRadius, outerRadius, 0, largeArcFlag, 1, outerEnd.x, outerEnd.y,
    "L", innerEnd.x, innerEnd.y,
    "A", innerRadius, innerRadius, 0, largeArcFlag, 0, innerStart.x, innerStart.y,
    "Z"
  ].join(" ");
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}



export default PulseMeter;