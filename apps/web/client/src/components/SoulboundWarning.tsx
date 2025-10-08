import React from 'react';

interface SoulboundWarningProps {
  existingName?: string;
  walletAddress?: string;
}

const SoulboundWarning: React.FC<SoulboundWarningProps> = ({ existingName, walletAddress }) => {
  if (!existingName) return null;

  return (
    <div style={{
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      border: '2px solid #ef4444',
      borderRadius: '10px',
      padding: '20px',
      margin: '20px 0',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '24px',
        marginBottom: '10px'
      }}>
        🔒
      </div>
      <h3 style={{
        color: '#ef4444',
        marginBottom: '10px',
        fontSize: '18px'
      }}>
        Wallet Already Owns a Name
      </h3>
      <p style={{
        color: '#ccc',
        marginBottom: '15px'
      }}>
        Your wallet already owns <strong style={{ color: '#00f0ff' }}>{existingName}.fsn</strong>
      </p>
      <p style={{
        color: '#ccc',
        fontSize: '14px',
        lineHeight: '1.5'
      }}>
        Names are soulbound - each wallet can only register one name forever. 
        This prevents gaming the system and ensures true digital identity.
      </p>
    </div>
  );
};

export default SoulboundWarning;