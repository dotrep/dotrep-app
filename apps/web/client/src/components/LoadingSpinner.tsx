import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
}

export default function LoadingSpinner({ 
  size = 'medium', 
  color = '#00bcd4',
  text 
}: LoadingSpinnerProps) {
  const sizeMap = {
    small: 20,
    medium: 32,
    large: 48
  };

  const spinnerSize = sizeMap[size];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px'
    }}>
      <div
        style={{
          width: `${spinnerSize}px`,
          height: `${spinnerSize}px`,
          border: `3px solid rgba(0, 188, 212, 0.2)`,
          borderTop: `3px solid ${color}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      {text && (
        <div style={{
          color: color,
          fontSize: '14px',
          fontFamily: 'Orbitron, sans-serif',
          fontWeight: '500',
          textAlign: 'center'
        }}>
          {text}
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}