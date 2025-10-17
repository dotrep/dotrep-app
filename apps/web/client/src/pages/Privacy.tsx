import React from 'react';
import { useLocation } from 'wouter';

export default function Privacy() {
  const [, setLocation] = useLocation();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
      padding: '40px 20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <div style={{
        maxWidth: '800px',
        background: 'rgba(30, 41, 59, 0.5)',
        border: '2px solid #334155',
        borderRadius: '16px',
        padding: '40px',
      }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 700,
          color: '#f1f5f9',
          marginBottom: '24px',
        }}>
          Privacy Policy
        </h1>
        
        <div style={{
          fontSize: '16px',
          color: '#94a3b8',
          lineHeight: '1.8',
          marginBottom: '32px',
        }}>
          <p style={{ marginBottom: '16px' }}>
            Your privacy is important to us. This privacy policy explains how .rep Platform collects, uses, and protects your personal information.
          </p>
          
          <h2 style={{ fontSize: '24px', color: '#f1f5f9', marginTop: '24px', marginBottom: '12px' }}>
            Information We Collect
          </h2>
          <p style={{ marginBottom: '16px' }}>
            We collect wallet addresses and blockchain transaction data necessary to provide our services.
          </p>
          
          <h2 style={{ fontSize: '24px', color: '#f1f5f9', marginTop: '24px', marginBottom: '12px' }}>
            How We Use Your Information
          </h2>
          <p style={{ marginBottom: '16px' }}>
            Your information is used solely to provide and improve our platform services.
          </p>
        </div>

        <button
          onClick={() => setLocation('/')}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(90deg, #00d4aa 0%, #0052ff 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
