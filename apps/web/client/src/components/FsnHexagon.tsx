import React, { useEffect, useState, useCallback, useRef } from 'react';

interface FsnHexagonProps {
  size?: number;
  className?: string;
}

/**
 * FSN Hex Component - Outlined Hexagon Version
 * Enhanced version with multi-layer glow effects and smooth animations
 * Precisely matches the final specification design
 * Added interactive random pulse effect on click
 */
const FsnHexagon: React.FC<FsnHexagonProps> = ({ 
  size = 320, // Slightly increased from 300px for better visual impact
  className = ''
}) => {
  const [pulseIntensity, setPulseIntensity] = useState(0);
  const [secondaryPulse, setSecondaryPulse] = useState(0);
  const [randomPulse, setRandomPulse] = useState(0);
  const [randomRotation, setRandomRotation] = useState(0);
  const animationRef = useRef<number>(0);
  const isRandomPulseActive = useRef(false);
  
  // Completely enhanced pulse effect with multi-stage animation
  const triggerRandomPulse = useCallback(() => {
    // Cancel any existing random pulse animation
    if (isRandomPulseActive.current) {
      return;
    }
    
    console.log("Hexagon clicked - triggering dramatic pulse");
    isRandomPulseActive.current = true;
    
    // More extreme values for a truly dramatic effect
    const maxRotation = Math.random() * 30 - 15; // -15 to 15 degrees rotation
    const maxScale = 0.3 + Math.random() * 0.3; // Scale between 0.3-0.6
    const flashDuration = 150; // Very quick initial flash
    const pulseDuration = 400; // Faster main pulse
    const totalDuration = flashDuration + pulseDuration;
    const startTime = Date.now();
    
    // Two-stage animation: flash then pulse
    const animateRandomPulse = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      
      if (elapsed <= flashDuration) {
        // Stage 1: Quick flash - very dramatic for visibility
        const flashProgress = elapsed / flashDuration;
        // Cubic easing for sharp initial impact
        const flashValue = 4 * Math.pow(flashProgress, 3);
        
        // Set to maximum values immediately for obvious effect
        setRandomPulse(maxScale);
        setRandomRotation(maxRotation * 0.7); // Reduced rotation on initial flash
        
      } else if (elapsed <= totalDuration) {
        // Stage 2: Easing out pulse
        const pulseElapsed = elapsed - flashDuration;
        const pulseProgress = pulseElapsed / pulseDuration;
        
        // Elastic easing out for bouncy feel
        const t = pulseProgress;
        const elasticValue = Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
        
        // Scale down from max to zero with elastic bounce
        setRandomPulse(maxScale * (1 - elasticValue) * 0.9);
        setRandomRotation(maxRotation * (1 - t));
      } else {
        // Reset to normal state
        setRandomPulse(0);
        setRandomRotation(0);
        isRandomPulseActive.current = false;
        return; // Stop animation
      }
      
      // Continue animation
      animationRef.current = requestAnimationFrame(animateRandomPulse);
    };
    
    // Start the animation with first frame at maximum values
    setRandomPulse(maxScale);
    setRandomRotation(maxRotation * 0.5);
    animateRandomPulse();
  }, []);
  
  // Create sophisticated multi-layer pulsing glow effect
  useEffect(() => {
    let animationFrame: number;
    let startTime = Date.now();
    
    const animate = () => {
      const currentTime = Date.now();
      const elapsed = (currentTime - startTime) / 1000; // seconds
      
      // Primary sine wave oscillation - smoother with optimized frequency
      const intensity = (Math.sin(elapsed * 1.8) + 1) / 2;
      setPulseIntensity(intensity);
      
      // Secondary pulse with offset phase for more dynamic effect
      const secondary = (Math.sin((elapsed + 0.7) * 1.5) + 1) / 2;
      setSecondaryPulse(secondary);
      
      animationFrame = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationFrame);
      // Also cancel any random pulse animation if component unmounts
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  return (
    <div 
      className={className}
      onClick={triggerRandomPulse}
      style={{
        cursor: 'pointer',
        filter: 'none',
        background: 'transparent',
        boxShadow: 'none'
      }}
    >
      <div 
        style={{
          width: `${size}px`,
          height: `${size}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transform: `scale(${1 + randomPulse}) rotate(${randomRotation}deg)`,
          transition: isRandomPulseActive.current ? 'none' : 'transform 0.5s ease-out',
          backgroundColor: 'transparent',
          boxShadow: 'none',
          overflow: 'visible'
        }}
      >
        {/* Removed all outer glowing effects that were causing the square appearance */}
        
        {/* Main outlined hexagon - precisely matching design specifications */}
        <div style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          background: `rgba(0, 240, 255, ${randomPulse * 0.05})`, // Add slight background on click
          border: `2px solid rgba(0, 240, 255, ${0.85 + pulseIntensity * 0.15 + randomPulse * 0.15})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 4,
          filter: `drop-shadow(0 0 ${8 + pulseIntensity * 8}px rgba(0, 240, 255, 0.7))`,
          boxShadow: `inset 0 0 ${10 + pulseIntensity * 8 + randomPulse * 20}px rgba(0, 240, 255, ${0.05 + pulseIntensity * 0.1 + randomPulse * 0.25})`,
          transition: isRandomPulseActive.current ? 'none' : 'box-shadow 0.5s ease-out, border 0.5s ease-out, background 0.5s ease-out, filter 0.5s ease-out',
        }}>
          {/* Inner hexagon - also outlined with subtle glow */}
          <div style={{
            width: '82%',
            height: '82%',
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            background: `rgba(0, 240, 255, ${randomPulse * 0.03})`, // Add slight background on click
            border: `1px solid rgba(0, 240, 255, ${0.7 + secondaryPulse * 0.2 + randomPulse * 0.2})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `inset 0 0 ${5 + secondaryPulse * 5 + randomPulse * 15}px rgba(0, 240, 255, ${0.05 + secondaryPulse * 0.05 + randomPulse * 0.2})`,
            transition: isRandomPulseActive.current ? 'none' : 'box-shadow 0.5s ease-out, border 0.5s ease-out, background 0.5s ease-out',
          }}>
            {/* Third inner hexagon - with subtle background glow */}
            <div style={{
              width: '70%',
              height: '70%',
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              background: `rgba(0, 240, 255, ${0.02 + pulseIntensity * 0.02 + randomPulse * 0.08})`, // Enhanced glow on click
              border: `1px solid rgba(0, 240, 255, ${0.5 + pulseIntensity * 0.2 + randomPulse * 0.3})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `inset 0 0 ${5 + pulseIntensity * 10 + randomPulse * 25}px rgba(0, 240, 255, ${0.1 + pulseIntensity * 0.15 + randomPulse * 0.3})`,
              transition: isRandomPulseActive.current ? 'none' : 'box-shadow 0.5s ease-out, border 0.5s ease-out, background 0.5s ease-out',
            }}>
              {/* FSN text with dramatic flash effect on click */}
              <span style={{
                fontSize: '3rem',
                fontWeight: 700,
                color: randomPulse > 0.1 ? '#ffffff' : '#00f0ff', // Flash to pure white on click
                textShadow: `0 0 ${8 + pulseIntensity * 12 + randomPulse * 40}px rgba(${randomPulse > 0.2 ? '255, 255, 255' : '0, 240, 255'}, ${0.6 + pulseIntensity * 0.4 + randomPulse * 0.4})`,
                letterSpacing: '-0.02em',
                filter: `brightness(${0.9 + pulseIntensity * 0.2 + randomPulse * 1.5})`, // Dramatically brighter on click
                transform: `scale(${1 + randomPulse * 0.3})`, // More noticeable scale effect
                transition: isRandomPulseActive.current ? 'none' : 'all 0.3s ease',
                position: 'relative', // For the flash overlay
              }}>
                {/* Flash overlay effect */}
                {randomPulse > 0.05 && (
                  <div style={{
                    position: 'absolute',
                    top: '-20%',
                    left: '-20%',
                    width: '140%',
                    height: '140%',
                    background: `radial-gradient(circle, rgba(255, 255, 255, ${0.7 * randomPulse}) 0%, rgba(0, 240, 255, ${0.5 * randomPulse}) 50%, transparent 70%)`,
                    zIndex: -1,
                    borderRadius: '50%',
                    filter: 'blur(5px)',
                  }} />
                )}
                .fsn
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FsnHexagon;