import React from 'react';
import './SignalDial.css';

const TrustBadge = ({ tier, xp, totalCasts }) => {
  if (tier === 0) return null;

  const getTierInfo = (tier) => {
    switch (tier) {
      case 1:
        return {
          name: 'Tier I',
          icon: '🔰',
          color: '#00ffcc',
          requirement: '1000 XP, 10 Casts'
        };
      case 2:
        return {
          name: 'Tier II',
          icon: '⭐',
          color: '#00ffff',
          requirement: '2500 XP, 25 Casts'
        };
      case 3:
        return {
          name: 'Tier III',
          icon: '💎',
          color: '#ff6600',
          requirement: '5000 XP, 50 Casts'
        };
      default:
        return {
          name: 'Tier I',
          icon: '🔰',
          color: '#00ffcc',
          requirement: '1000 XP, 10 Casts'
        };
    }
  };

  const tierInfo = getTierInfo(tier);

  return (
    <div 
      className="trust-badge"
      style={{
        borderColor: tierInfo.color,
        background: `linear-gradient(135deg, ${tierInfo.color}, ${tierInfo.color}aa)`
      }}
    >
      {tierInfo.icon} Signal Trust: {tierInfo.name}
    </div>
  );
};

export default TrustBadge;