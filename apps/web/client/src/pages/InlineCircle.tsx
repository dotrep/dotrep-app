import React from 'react';

const InlineCircle: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a202c',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px'
    }}>
      <div style={{
        position: 'relative',
        width: '400px',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Outer glowing ring */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '4px solid #00bcd4',
          boxShadow: '0 0 30px rgba(0, 188, 212, 0.5)',
          animation: 'pulse 2s infinite'
        }} />
        
        {/* Inner circle */}
        <div style={{
          position: 'relative',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          backgroundColor: '#2d3748',
          border: '2px solid #00bcd4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.5)'
        }}>
          {/* XP Badge */}
          <div style={{
            position: 'absolute',
            top: '-60px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '50px',
            fontSize: '18px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
          }}>
            +50 XP
          </div>
          
          {/* FSN Text */}
          <div style={{
            color: 'white',
            fontSize: '80px',
            fontWeight: 'bold',
            letterSpacing: '4px',
            textShadow: '0 0 20px rgba(255, 255, 255, 0.3)'
          }}>
            .fsn
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default InlineCircle;