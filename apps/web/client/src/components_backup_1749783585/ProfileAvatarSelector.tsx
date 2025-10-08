import React, { useState, useEffect } from 'react';

interface AvatarOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  requirements?: string;
}

interface ProfileAvatarSelectorProps {
  userId: number;
  currentAvatar?: string;
  userStats?: {
    isVerified: boolean;
    xp: number;
    activeToday: boolean;
    role: string;
    invited: number;
    activityHours: string[];
  };
  onAvatarChange: (avatarId: string) => void;
}

const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: 'default',
    name: 'Default',
    icon: '👤',
    description: 'Standard FSN avatar'
  },
  {
    id: 'social',
    name: 'Social',
    icon: '🌐',
    description: 'Connected networker'
  },
  {
    id: 'night',
    name: 'Night Owl',
    icon: '🌙',
    description: 'Active during midnight hours',
    requirements: 'Active between 12AM-3AM'
  },
  {
    id: 'verified',
    name: 'Verified',
    icon: '✅',
    description: 'Verified FSN member',
    requirements: 'Verified account status'
  },
  {
    id: 'fast',
    name: 'Fast/Early',
    icon: '⚡',
    description: 'Quick responder or early adopter'
  },
  {
    id: 'contributor',
    name: 'Top Contributor',
    icon: '⭐',
    description: 'Active community contributor'
  }
];

export default function ProfileAvatarSelector({ 
  userId, 
  currentAvatar, 
  userStats, 
  onAvatarChange 
}: ProfileAvatarSelectorProps) {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || 'default');

  // Auto-assign avatar based on user stats if none selected
  useEffect(() => {
    if (!currentAvatar && userStats) {
      let autoAvatar = 'default';
      
      if (userStats.isVerified) {
        autoAvatar = 'verified';
      } else if (userStats.activityHours.some(hour => 
        ['00:00', '01:00', '02:00', '03:00'].includes(hour)
      )) {
        autoAvatar = 'night';
      }
      
      setSelectedAvatar(autoAvatar);
      onAvatarChange(autoAvatar);
    }
  }, [currentAvatar, userStats, onAvatarChange]);

  const handleAvatarSelect = (avatarId: string) => {
    setSelectedAvatar(avatarId);
    onAvatarChange(avatarId);
  };

  const isAvatarAvailable = (avatar: AvatarOption): boolean => {
    if (!userStats) return true;
    
    switch (avatar.id) {
      case 'verified':
        return userStats.isVerified;
      case 'night':
        return userStats.activityHours.some(hour => 
          ['00:00', '01:00', '02:00', '03:00'].includes(hour)
        );
      default:
        return true;
    }
  };

  return (
    <div style={{
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(100, 255, 255, 0.3)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <h3 style={{
        color: '#64ffff',
        margin: '0 0 16px 0',
        fontSize: '18px',
        fontWeight: '600'
      }}>
        Profile Avatar
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '12px'
      }}>
        {AVATAR_OPTIONS.map(avatar => {
          const isSelected = selectedAvatar === avatar.id;
          const isAvailable = isAvatarAvailable(avatar);
          
          return (
            <div
              key={avatar.id}
              onClick={() => isAvailable && handleAvatarSelect(avatar.id)}
              style={{
                padding: '16px',
                borderRadius: '8px',
                border: isSelected 
                  ? '2px solid #00faff' 
                  : '1px solid rgba(100, 255, 255, 0.2)',
                backgroundColor: isSelected 
                  ? 'rgba(0, 250, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.2)',
                cursor: isAvailable ? 'pointer' : 'not-allowed',
                opacity: isAvailable ? 1 : 0.5,
                textAlign: 'center',
                transition: 'all 0.3s ease',
                filter: isSelected ? 'drop-shadow(0 0 8px #00faff)' : 'none',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              <div style={{
                fontSize: '32px',
                marginBottom: '8px',
                animation: isSelected ? 'pulse 2s infinite' : 'none'
              }}>
                {avatar.icon}
              </div>
              
              <div style={{
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '4px'
              }}>
                {avatar.name}
              </div>
              
              <div style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '12px',
                marginBottom: avatar.requirements ? '8px' : '0'
              }}>
                {avatar.description}
              </div>
              
              {avatar.requirements && (
                <div style={{
                  color: isAvailable ? '#72f1b8' : '#f87171',
                  fontSize: '10px',
                  fontStyle: 'italic'
                }}>
                  {avatar.requirements}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}