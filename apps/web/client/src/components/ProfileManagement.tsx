import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProfileAvatarSelector from './ProfileAvatarSelector';
import HexagonEditor from './HexagonEditor';
import VerificationBadge from './VerificationBadge';
import { isUserVerified } from '../utils/verification';

interface ProfileManagementProps {
  userId: number;
  fsnName: string;
}

interface UserProfile {
  id: number;
  userId: number;
  xpPoints: number;
  level: number;
  signalsSent: number;
  connectionsCount: number;
  lastActive: string;
  avatarSelection: string;
  hexStyle: string;
  activityHours: string;
  invitedCount: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  userType: string;
}

export default function ProfileManagement({ userId, fsnName }: ProfileManagementProps) {
  const queryClient = useQueryClient();

  // Fetch user profile data
  const { data: userProfile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: [`/api/user/stats/${userId}`],
    enabled: !!userId,
  });

  // Fetch user basic data
  const { data: userData } = useQuery<User>({
    queryKey: [`/api/fsn/user/${userId}`],
    enabled: !!userId,
  });

  // Update avatar selection
  const updateAvatarMutation = useMutation({
    mutationFn: async (avatarId: string) => {
      const response = await fetch(`/api/user/profile/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarSelection: avatarId })
      });
      if (!response.ok) throw new Error('Failed to update avatar');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/stats/${userId}`] });
      
      // Emit profile update success event for onboarding tracking
      window.dispatchEvent(new CustomEvent('profile-update-success', {
        detail: { userId, type: 'avatar', timestamp: new Date().toISOString() }
      }));
    }
  });

  // Update hexagon style
  const updateHexStyleMutation = useMutation({
    mutationFn: async (styleId: string) => {
      const response = await fetch(`/api/user/profile/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hexStyle: styleId })
      });
      if (!response.ok) throw new Error('Failed to update hex style');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/stats/${userId}`] });
      
      // Emit profile update success event for onboarding tracking
      window.dispatchEvent(new CustomEvent('profile-update-success', {
        detail: { userId, type: 'hex-style', timestamp: new Date().toISOString() }
      }));
    }
  });

  // Process user stats for components
  const userStats = userProfile ? {
    isVerified: isUserVerified(fsnName),
    xp: userProfile.xpPoints,
    activeToday: Boolean(userProfile.lastActive && 
      new Date(userProfile.lastActive).toDateString() === new Date().toDateString()),
    role: userData?.isAdmin ? 'admin' : userData?.userType || 'user',
    invited: userProfile.invitedCount,
    activityHours: userProfile.activityHours ? 
      JSON.parse(userProfile.activityHours) : []
  } : undefined;

  const handleAvatarChange = (avatarId: string) => {
    updateAvatarMutation.mutate(avatarId);
  };

  const handleHexStyleChange = (styleId: string) => {
    updateHexStyleMutation.mutate(styleId);
  };

  if (profileLoading) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.6)'
      }}>
        Loading profile...
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      {/* Profile Header */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(100, 255, 255, 0.3)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <h2 style={{
          color: '#64ffff',
          margin: '0 0 16px 0',
          fontSize: '28px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <span className={`fsn-name ${isUserVerified(fsnName) ? 'fsn-name-verified' : ''}`}>
            {fsnName}
          </span>
          {isUserVerified(fsnName) && (
            <VerificationBadge size={24} glow={true} />
          )}
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '16px',
          marginTop: '20px'
        }}>
          <div style={{
            backgroundColor: 'rgba(100, 255, 255, 0.1)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(100, 255, 255, 0.2)'
          }}>
            <div style={{ color: '#64ffff', fontSize: '24px', fontWeight: 'bold' }}>
              {userProfile?.xpPoints || 0}
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
              XP Points
            </div>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(255, 158, 100, 0.1)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 158, 100, 0.2)'
          }}>
            <div style={{ color: '#ff9e64', fontSize: '24px', fontWeight: 'bold' }}>
              {userProfile?.level || 1}
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
              Level
            </div>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(114, 241, 184, 0.1)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(114, 241, 184, 0.2)'
          }}>
            <div style={{ color: '#72f1b8', fontSize: '24px', fontWeight: 'bold' }}>
              {userProfile?.signalsSent || 0}
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
              Signals Sent
            </div>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(187, 154, 247, 0.1)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(187, 154, 247, 0.2)'
          }}>
            <div style={{ color: '#bb9af7', fontSize: '24px', fontWeight: 'bold' }}>
              {userProfile?.connectionsCount || 0}
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
              Connections
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Selector */}
      <ProfileAvatarSelector
        userId={userId}
        currentAvatar={userProfile?.avatarSelection}
        userStats={userStats}
        onAvatarChange={handleAvatarChange}
      />

      {/* Hexagon Editor */}
      <HexagonEditor
        userId={userId}
        currentHexStyle={userProfile?.hexStyle}
        userStats={userStats}
        onHexStyleChange={handleHexStyleChange}
      />

      {/* Status Indicators */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(100, 255, 255, 0.3)',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h3 style={{
          color: '#64ffff',
          margin: '0 0 16px 0',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Profile Status
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px',
            backgroundColor: userStats?.isVerified 
              ? 'rgba(114, 241, 184, 0.1)' 
              : 'rgba(248, 113, 113, 0.1)',
            borderRadius: '6px'
          }}>
            <span style={{ fontSize: '16px' }}>
              {userStats?.isVerified ? '✅' : '❌'}
            </span>
            <span style={{
              color: userStats?.isVerified ? '#72f1b8' : '#f87171',
              fontSize: '14px'
            }}>
              Verification Status
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px',
            backgroundColor: userStats?.activeToday 
              ? 'rgba(114, 241, 184, 0.1)' 
              : 'rgba(255, 158, 100, 0.1)',
            borderRadius: '6px'
          }}>
            <span style={{ fontSize: '16px' }}>
              {userStats?.activeToday ? '🟢' : '🟡'}
            </span>
            <span style={{
              color: userStats?.activeToday ? '#72f1b8' : '#ff9e64',
              fontSize: '14px'
            }}>
              Active Today
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px',
            backgroundColor: userStats?.role === 'admin' 
              ? 'rgba(187, 154, 247, 0.1)' 
              : 'rgba(100, 255, 255, 0.1)',
            borderRadius: '6px'
          }}>
            <span style={{ fontSize: '16px' }}>
              {userStats?.role === 'admin' ? '👑' : '👤'}
            </span>
            <span style={{
              color: userStats?.role === 'admin' ? '#bb9af7' : '#64ffff',
              fontSize: '14px'
            }}>
              Role: {userStats?.role || 'User'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}