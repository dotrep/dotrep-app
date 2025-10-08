import React from 'react';

// Badge icon components for consistent visual representation
export const BadgeIcons = {
  onboarding: (
    <div style={{
      background: 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)',
      borderRadius: '50%',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px'
    }}>
      🚀
    </div>
  ),
  
  coreSignal: (
    <div style={{
      background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
      borderRadius: '50%',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px'
    }}>
      🛡️
    </div>
  ),
  
  trustVerified: (
    <div style={{
      background: 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)',
      borderRadius: '50%',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px'
    }}>
      🛡️
    </div>
  ),
  
  hexMapFragment: (
    <div style={{
      background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
      borderRadius: '50%',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px'
    }}>
      💎
    </div>
  ),
  
  sentinel: (
    <div style={{
      background: 'linear-gradient(135deg, #795548 0%, #5d4037 100%)',
      borderRadius: '50%',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px'
    }}>
      🏰
    </div>
  ),
  
  signalRank: (
    <div style={{
      background: 'linear-gradient(135deg, #607d8b 0%, #455a64 100%)',
      borderRadius: '50%',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px'
    }}>
      ⚡
    </div>
  ),
  
  fsnRelinked: (
    <div style={{
      background: 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)',
      borderRadius: '50%',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px'
    }}>
      🔗
    </div>
  ),
  
  chainlinkMaster: (
    <div style={{
      background: 'linear-gradient(135deg, #ff5722 0%, #d84315 100%)',
      borderRadius: '50%',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px'
    }}>
      ⛓️
    </div>
  ),
  
  genesis: (
    <div style={{
      background: 'linear-gradient(135deg, #ffd700 0%, #fbc02d 100%)',
      borderRadius: '50%',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      animation: 'pulse 2s ease-in-out infinite'
    }}>
      ⭐
    </div>
  )
};

export const getBadgeIcon = (badgeId) => {
  return BadgeIcons[badgeId] || (
    <div style={{
      background: 'linear-gradient(135deg, #666666 0%, #444444 100%)',
      borderRadius: '50%',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px'
    }}>
      🏆
    </div>
  );
};