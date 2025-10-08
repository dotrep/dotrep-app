import React from 'react';
import { CheckCircle, Circle, Star } from 'lucide-react';

interface MissionTaskItemProps {
  label: string;
  xp: number;
  completed: boolean;
  icon: string;
}

const MissionTaskItem: React.FC<MissionTaskItemProps> = ({ label, xp, completed, icon }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '8px',
        backgroundColor: completed ? 'rgba(0, 255, 0, 0.1)' : 'rgba(0, 240, 255, 0.05)',
        border: completed ? '1px solid rgba(0, 255, 0, 0.3)' : '1px solid rgba(0, 240, 255, 0.2)',
        transition: 'all 0.3s ease',
        opacity: completed ? 0.8 : 1
      }}
    >
      {/* Task Icon */}
      <div style={{ fontSize: '24px', minWidth: '32px' }}>
        {icon}
      </div>
      
      {/* Task Details */}
      <div style={{ flex: 1 }}>
        <div style={{
          color: completed ? '#00ff00' : '#ffffff',
          fontSize: '14px',
          fontWeight: '500',
          fontFamily: 'Orbitron, sans-serif'
        }}>
          {label}
        </div>
        <div style={{
          color: completed ? '#00cc00' : '#00bcd4',
          fontSize: '12px',
          fontWeight: 'bold',
          marginTop: '2px'
        }}>
          +{xp} XP
        </div>
      </div>
      
      {/* Completion Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        color: completed ? '#00ff00' : '#666666'
      }}>
        {completed ? (
          <CheckCircle size={20} style={{ filter: 'drop-shadow(0 0 6px #00ff00)' }} />
        ) : (
          <Circle size={20} />
        )}
      </div>
    </div>
  );
};

export default MissionTaskItem;