import React from 'react';
import { useLocation } from 'wouter';

export function Footer() {
  const [, setLocation] = useLocation();

  return (
    <footer style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      padding: '16px',
      background: 'rgba(10, 14, 39, 0.9)',
      borderTop: '1px solid rgba(51, 65, 85, 0.3)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '20px',
      fontSize: '14px',
      color: '#94a3b8',
      zIndex: 50,
    }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        background: 'rgba(0, 82, 255, 0.1)',
        border: '1px solid rgba(0, 82, 255, 0.3)',
        borderRadius: '6px',
      }}>
        <span style={{ fontSize: '12px' }}>⚡</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0052ff' }}>
          Built on Base
        </span>
      </div>
      
      <button
        onClick={() => setLocation('/privacy')}
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          fontSize: '14px',
          cursor: 'pointer',
          padding: '4px 8px',
        }}
      >
        Privacy
      </button>
      
      <button
        onClick={() => setLocation('/terms')}
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          fontSize: '14px',
          cursor: 'pointer',
          padding: '4px 8px',
        }}
      >
        Terms
      </button>
    </footer>
  );
}
