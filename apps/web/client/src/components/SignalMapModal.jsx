import React, { useState, useEffect, useRef } from 'react';
import { X, Globe, Zap } from 'lucide-react';

const SignalMapModal = ({ isOpen, onClose }) => {
  const canvasRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  
  // Fake signal data for constellation visualization
  const fakeSignals = [
    { name: 'satoshi.fsn', location: 'Japan', signal: true, x: 0.8, y: 0.3 },
    { name: 'vitalik.fsn', location: 'Canada', signal: true, x: 0.2, y: 0.2 },
    { name: 'ada.fsn', location: 'UK', signal: false, x: 0.5, y: 0.25 },
    { name: 'gavin.fsn', location: 'Switzerland', signal: true, x: 0.55, y: 0.3 },
    { name: 'charlie.fsn', location: 'Australia', signal: true, x: 0.85, y: 0.7 },
    { name: 'alice.fsn', location: 'Germany', signal: false, x: 0.52, y: 0.28 },
    { name: 'bob.fsn', location: 'Brazil', signal: true, x: 0.35, y: 0.6 },
    { name: 'jason.fsn', location: 'USA', signal: true, x: 0.25, y: 0.4, isUser: true }
  ];

  useEffect(() => {
    if (!isOpen) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    let animationId;
    const drawMap = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const radius = Math.min(centerX, centerY) * 0.8;
      
      // Draw starfield background
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * rect.width;
        const y = Math.random() * rect.height;
        const alpha = Math.random() * 0.8;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw globe wireframe
      ctx.strokeStyle = 'rgba(0, 188, 212, 0.3)';
      ctx.lineWidth = 1;
      
      // Outer circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Latitude lines
      for (let i = 1; i < 4; i++) {
        const y = centerY + (radius * 0.6 * Math.cos((i * Math.PI) / 4)) * (i % 2 === 0 ? -1 : 1);
        ctx.beginPath();
        ctx.ellipse(centerX, y, radius * 0.9, radius * 0.2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Longitude lines
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 + rotation;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius * Math.abs(Math.cos(angle)), radius, angle, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Draw signal nodes
      fakeSignals.forEach((signal, index) => {
        const nodeX = centerX + (signal.x - 0.5) * radius * 1.6;
        const nodeY = centerY + (signal.y - 0.5) * radius * 1.6;
        
        // Signal pulse animation
        const pulseScale = signal.signal ? 1 + 0.3 * Math.sin(Date.now() * 0.005 + index) : 1;
        const nodeRadius = signal.isUser ? 6 : 4;
        
        // Connection lines to other active signals
        if (signal.signal) {
          fakeSignals.forEach((other, otherIndex) => {
            if (other.signal && otherIndex > index) {
              const otherX = centerX + (other.x - 0.5) * radius * 1.6;
              const otherY = centerY + (other.y - 0.5) * radius * 1.6;
              
              ctx.strokeStyle = 'rgba(0, 188, 212, 0.2)';
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(nodeX, nodeY);
              ctx.lineTo(otherX, otherY);
              ctx.stroke();
            }
          });
        }
        
        // Node glow
        if (signal.signal) {
          const gradient = ctx.createRadialGradient(nodeX, nodeY, 0, nodeX, nodeY, nodeRadius * pulseScale * 3);
          gradient.addColorStop(0, signal.isUser ? 'rgba(255, 215, 0, 0.6)' : 'rgba(0, 188, 212, 0.4)');
          gradient.addColorStop(1, 'rgba(0, 188, 212, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(nodeX, nodeY, nodeRadius * pulseScale * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Node core
        ctx.fillStyle = signal.signal 
          ? (signal.isUser ? '#ffd700' : '#00bcd4')
          : '#666666';
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, nodeRadius * pulseScale, 0, Math.PI * 2);
        ctx.fill();
        
        // User indicator
        if (signal.isUser) {
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(nodeX, nodeY, nodeRadius * pulseScale + 3, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
    };
    
    // Animation loop
    const animate = () => {
      setRotation(prev => prev + 0.005);
      drawMap();
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 20, 40, 0.95) 0%, rgba(0, 30, 60, 0.95) 100%)',
        borderRadius: '20px',
        padding: '32px',
        width: '90%',
        maxWidth: '800px',
        height: '80vh',
        border: '3px solid rgba(0, 188, 212, 0.4)',
        boxShadow: '0 0 50px rgba(0, 188, 212, 0.3)',
        fontFamily: 'Orbitron, sans-serif',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          borderBottom: '2px solid rgba(0, 188, 212, 0.3)',
          paddingBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Globe size={28} color="#00bcd4" />
            <h2 style={{
              color: '#00bcd4',
              margin: 0,
              fontSize: '24px',
              fontWeight: 'bold',
              textShadow: '0 0 15px rgba(0, 188, 212, 0.8)'
            }}>
              FSN Global Signal Map
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.color = '#00bcd4';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'none';
              e.target.style.color = '#ffffff';
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Status Indicators */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'rgba(255, 215, 0, 0.1)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '20px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#ffd700',
              boxShadow: '0 0 10px rgba(255, 215, 0, 0.8)'
            }} />
            <span style={{ color: '#ffd700', fontSize: '12px', fontWeight: 'bold' }}>
              You Are Here: jason.fsn
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'rgba(0, 188, 212, 0.1)',
            border: '1px solid rgba(0, 188, 212, 0.3)',
            borderRadius: '20px'
          }}>
            <Zap size={14} color="#00bcd4" />
            <span style={{ color: '#00bcd4', fontSize: '12px', fontWeight: 'bold' }}>
              Signal Active
            </span>
          </div>
        </div>

        {/* Map Canvas */}
        <div style={{
          flex: 1,
          position: 'relative',
          border: '2px solid rgba(0, 188, 212, 0.2)',
          borderRadius: '12px',
          overflow: 'hidden',
          background: 'radial-gradient(circle at center, rgba(0, 10, 30, 0.8) 0%, rgba(0, 5, 15, 0.95) 100%)'
        }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block'
            }}
          />
        </div>

        {/* Legend and Info */}
        <div style={{
          marginTop: '20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px'
        }}>
          {/* Legend */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(0, 188, 212, 0.2)',
            borderRadius: '8px',
            padding: '12px'
          }}>
            <h4 style={{
              color: '#00bcd4',
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '8px',
              textTransform: 'uppercase'
            }}>
              Legend
            </h4>
            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.4' }}>
              <div>🟡 Your Signal (jason.fsn)</div>
              <div>🔵 Active FSN Nodes</div>
              <div>⚪ Offline Nodes</div>
              <div>▬ Signal Connections</div>
            </div>
          </div>

          {/* Coming Soon Notice */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 165, 0, 0.3)',
            borderRadius: '8px',
            padding: '12px'
          }}>
            <h4 style={{
              color: '#ff9800',
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '8px',
              textTransform: 'uppercase'
            }}>
              Coming Soon
            </h4>
            <div style={{ 
              fontSize: '10px', 
              color: 'rgba(255, 255, 255, 0.7)', 
              lineHeight: '1.4',
              fontStyle: 'italic'
            }}>
              🔭 Real-time constellation tracking<br/>
              📡 Interactive frequency bands<br/>
              🌐 Live broadcast visualization<br/>
              🤝 Direct peer connections
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignalMapModal;