import React, { useState, useEffect } from 'react';
import '../fsn-styles.css';
import SharedNetworkAnimation from '@/components/SharedNetworkAnimation';
import fsnLogoImage from "@assets/ChatGPT Image Jun 12, 2025, 11_46_43 PM_1749787174472.png";

const PerfectCircle: React.FC = () => {
  const [isPulsing, setIsPulsing] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsPulsing(true);
      setPulseCount(prev => prev + 1);
      setTimeout(() => setIsPulsing(false), 2000);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  const triggerPulse = () => {
    setIsPulsing(true);
    setPulseCount(prev => prev + 1);
    setTimeout(() => setIsPulsing(false), 2000);
  };

  return (
    <section className="hero mobile-friendly-hero">
      <SharedNetworkAnimation className="network-background" />
      
      {/* Main Circle Container */}
      <div 
        style={{
          position: 'relative',
          width: '400px',
          height: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10,
          margin: 'auto'
        }}
        onClick={triggerPulse}
      >
        
        {/* BEACON Ring - Outermost */}
        <div style={{
          position: 'absolute',
          width: '120%',
          height: '120%',
          borderRadius: '50%',
          border: '3px solid #4dd0e1',
          opacity: isPulsing ? 0.05 : 0.8,
          transform: isPulsing ? 'scale3d(1.28, 1.28, 1)' : 'scale3d(1, 1, 1)',
          transition: 'all 2.2s cubic-bezier(0.25, 0.1, 0.25, 1)',
          transitionDelay: '0.6s',
          boxShadow: isPulsing ? '0 0 100px rgba(77, 208, 225, 0.2)' : '0 0 40px rgba(77, 208, 225, 0.6)',
          filter: isPulsing ? 'drop-shadow(0 0 50px rgba(77, 208, 225, 0.3))' : 'drop-shadow(0 0 15px rgba(77, 208, 225, 0.4))',
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d'
        }} />
        
        {/* SIGNAL Ring - Middle */}
        <div style={{
          position: 'absolute',
          width: '110%',
          height: '110%',
          borderRadius: '50%',
          border: '2px solid #26c6da',
          opacity: isPulsing ? 0.1 : 0.9,
          transform: isPulsing ? 'scale3d(1.18, 1.18, 1)' : 'scale3d(1, 1, 1)',
          transition: 'all 2.0s cubic-bezier(0.25, 0.1, 0.25, 1)',
          transitionDelay: '0.3s',
          boxShadow: isPulsing ? '0 0 70px rgba(38, 198, 218, 0.3)' : '0 0 30px rgba(38, 198, 218, 0.5)',
          filter: isPulsing ? 'drop-shadow(0 0 35px rgba(38, 198, 218, 0.5))' : 'drop-shadow(0 0 10px rgba(38, 198, 218, 0.5))',
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d'
        }} />
        
        {/* PULSE Ring - Innermost */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '4px solid #00bcd4',
          opacity: isPulsing ? 0.2 : 1,
          transform: isPulsing ? 'scale3d(1.08, 1.08, 1)' : 'scale3d(1, 1, 1)',
          transition: 'all 1.8s cubic-bezier(0.25, 0.1, 0.25, 1)',
          transitionDelay: '0s',
          boxShadow: isPulsing ? '0 0 80px rgba(0, 188, 212, 0.6)' : '0 0 50px rgba(0, 188, 212, 0.8)',
          filter: isPulsing ? 'drop-shadow(0 0 40px rgba(0, 188, 212, 0.7))' : 'drop-shadow(0 0 20px rgba(0, 188, 212, 0.9))',
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d'
        }} />

        {/* Main Circle Body */}
        <div style={{
          position: 'relative',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(0, 188, 212, 0.15) 0%, rgba(0, 0, 0, 0.4) 50%, rgba(0, 188, 212, 0.1) 100%)',
          border: '2px solid rgba(0, 188, 212, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `
            0 0 60px rgba(0, 188, 212, 0.4),
            inset 0 0 40px rgba(0, 0, 0, 0.4),
            inset 0 0 80px rgba(0, 188, 212, 0.1)
          `,
          overflow: 'hidden'
        }}>
          
          {/* Outer inner ring */}
          <div style={{
            position: 'absolute',
            width: '290px',
            height: '290px',
            borderRadius: '50%',
            border: '1px solid rgba(0, 188, 212, 0.4)',
            transform: isPulsing ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 2s ease-in-out'
          }} />
          
          {/* Mid inner ring */}
          <div style={{
            position: 'absolute',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            border: '1px solid rgba(0, 188, 212, 0.25)',
            transform: isPulsing ? 'rotate(-120deg)' : 'rotate(0deg)',
            transition: 'transform 1.8s ease-in-out',
            transitionDelay: '0.2s'
          }} />
          
          {/* Inner inner ring */}
          <div style={{
            position: 'absolute',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            border: '1px solid rgba(0, 188, 212, 0.15)',
            transform: isPulsing ? 'rotate(60deg)' : 'rotate(0deg)',
            transition: 'transform 1.2s ease-in-out',
            transitionDelay: '0.4s'
          }} />

          {/* XP Badge */}
          <div style={{
            position: 'absolute',
            top: '-60px',
            left: '50%',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%)',
            color: 'white',
            padding: '14px 28px',
            borderRadius: '50px',
            fontSize: '18px',
            fontWeight: 'bold',
            boxShadow: `
              0 8px 25px rgba(59, 130, 246, 0.5),
              0 0 20px rgba(59, 130, 246, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2)
            `,
            border: '1px solid rgba(59, 130, 246, 0.3)',
            zIndex: 10,
            transform: isPulsing ? 'translateX(-50%) scale(1.1)' : 'translateX(-50%) scale(1)',
            transition: 'transform 0.5s ease-out'
          }}>
            +50 XP
          </div>
          
          {/* FSN Logo */}
          <div style={{
            position: 'relative',
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '90px',
            height: '90px'
          }}>
            {/* Logo stays completely fixed - only glow changes */}
            <img 
              src={fsnLogoImage}
              alt="FSN Logo"
              style={{
                width: '90px',
                height: '90px',
                minWidth: '90px',
                maxWidth: '90px',
                minHeight: '90px',
                maxHeight: '90px',
                filter: `
                  drop-shadow(0 0 ${isPulsing ? 35 : 12}px rgba(0, 150, 168, ${isPulsing ? 0.8 : 0.4}))
                  drop-shadow(0 0 ${isPulsing ? 50 : 20}px rgba(0, 188, 212, ${isPulsing ? 0.6 : 0.3}))
                  drop-shadow(0 0 ${isPulsing ? 70 : 28}px rgba(64, 164, 188, ${isPulsing ? 0.5 : 0.2}))
                  brightness(${isPulsing ? 1.3 : 1.0})
                  contrast(${isPulsing ? 1.2 : 1.0})
                  saturate(${isPulsing ? 1.6 : 1.2})
                  hue-rotate(${isPulsing ? 5 : 0}deg)
                `,
                transition: 'filter 1.5s cubic-bezier(0.25, 0.1, 0.25, 1)',
                objectFit: 'contain',
                background: 'transparent',
                position: 'relative',
                zIndex: 10,
                transform: 'none'
              }}
            />
          </div>

          {/* Ambient inner glow */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            right: '20px',
            bottom: '20px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 188, 212, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
        </div>

        {/* Ambient outer glow */}
        <div style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 188, 212, 0.15) 0%, rgba(0, 188, 212, 0.05) 50%, transparent 70%)',
          pointerEvents: 'none',
          opacity: isPulsing ? 0.8 : 0.4,
          transition: 'opacity 1s ease-out'
        }} />
      </div>

      {/* Pulse counter */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '14px',
        fontWeight: '500'
      }}>
        Pulses: {pulseCount}
      </div>
    </section>
  );
};

export default PerfectCircle;