import React, { useState, useEffect } from 'react';
import '../fsn-styles.css';
import SharedNetworkAnimation from '@/components/SharedNetworkAnimation';

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
          opacity: isPulsing ? 0 : 0.8,
          transform: isPulsing ? 'scale3d(1.4, 1.4, 1)' : 'scale3d(1, 1, 1)',
          transition: 'all 2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          boxShadow: '0 0 40px rgba(77, 208, 225, 0.6)',
          filter: 'drop-shadow(0 0 15px rgba(77, 208, 225, 0.4))',
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
          opacity: isPulsing ? 0 : 0.9,
          transform: isPulsing ? 'scale3d(1.25, 1.25, 1)' : 'scale3d(1, 1, 1)',
          transition: 'all 1.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          transitionDelay: '0.3s',
          boxShadow: '0 0 30px rgba(38, 198, 218, 0.5)',
          filter: 'drop-shadow(0 0 10px rgba(38, 198, 218, 0.5))',
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
          opacity: isPulsing ? 0 : 1,
          transform: isPulsing ? 'scale3d(1.1, 1.1, 1)' : 'scale3d(1, 1, 1)',
          transition: 'all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          transitionDelay: '0.6s',
          boxShadow: '0 0 50px rgba(0, 188, 212, 0.8)',
          filter: 'drop-shadow(0 0 20px rgba(0, 188, 212, 0.9))',
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
          
          {/* FSN Text */}
          <div style={{
            color: 'white',
            fontSize: '72px',
            fontWeight: '900',
            letterSpacing: '2px',
            fontFamily: 'Inter, sans-serif',
            textShadow: `
              0 0 20px rgba(255, 255, 255, 0.5),
              0 0 40px rgba(0, 188, 212, 0.3),
              2px 2px 4px rgba(0, 0, 0, 0.5)
            `,
            position: 'relative',
            zIndex: 5,
            transform: isPulsing ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.8s ease-out'
          }}>
            .fsn
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