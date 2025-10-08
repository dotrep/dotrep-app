import React from 'react';
import { X, Trophy, Target, Zap } from 'lucide-react';
import MissionTaskItem from './MissionTaskItem';

interface MissionTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: {
    uploadFile: boolean;
    emitSignal: boolean;
    chooseFSN: boolean;
    completeQuest: boolean;
    equipBadge: boolean;
  };
}

const MissionTracker: React.FC<MissionTrackerProps> = ({ isOpen, onClose, tasks }) => {
  if (!isOpen) return null;

  const missionTasks = [
    {
      id: 'uploadFile',
      label: 'Upload First File to Vault',
      xp: 50,
      icon: '📁',
      completed: tasks.uploadFile
    },
    {
      id: 'emitSignal',
      label: 'Emit Your First Signal',
      xp: 30,
      icon: '📡',
      completed: tasks.emitSignal
    },
    {
      id: 'chooseFSN',
      label: 'Choose Your FSN Identity',
      xp: 10,
      icon: '🆔',
      completed: tasks.chooseFSN
    },
    {
      id: 'completeQuest',
      label: 'Complete Daily Quest',
      xp: 25,
      icon: '⚡',
      completed: tasks.completeQuest
    },
    {
      id: 'equipBadge',
      label: 'Equip Your First Badge',
      xp: 10,
      icon: '🏆',
      completed: tasks.equipBadge
    }
  ];

  const completedCount = missionTasks.filter(task => task.completed).length;
  const totalXP = missionTasks.filter(task => task.completed).reduce((sum, task) => sum + task.xp, 0);
  const allCompleted = completedCount === missionTasks.length;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(10px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'rgba(0, 20, 40, 0.95)',
          border: '2px solid #00f0ff',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '500px',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 0 30px rgba(0, 240, 255, 0.4)',
          fontFamily: 'Orbitron, sans-serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid rgba(0, 240, 255, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Target size={24} style={{ color: '#00f0ff' }} />
            <h2 style={{
              color: '#00f0ff',
              fontSize: '20px',
              fontWeight: 'bold',
              margin: 0,
              textShadow: '0 0 10px rgba(0, 240, 255, 0.5)'
            }}>
              Mission Tracker
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#00f0ff',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.1)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Summary */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(0, 240, 255, 0.3)',
          backgroundColor: 'rgba(0, 240, 255, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: '500' }}>
              Progress: {completedCount}/{missionTasks.length}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#00bcd4',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              <Zap size={16} />
              {totalXP} XP Earned
            </div>
          </div>
          
          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: 'rgba(0, 240, 255, 0.2)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(completedCount / missionTasks.length) * 100}%`,
              height: '100%',
              backgroundColor: allCompleted ? '#00ff00' : '#00f0ff',
              transition: 'width 0.3s ease',
              boxShadow: allCompleted ? '0 0 10px #00ff00' : '0 0 10px #00f0ff'
            }} />
          </div>
        </div>

        {/* Mission Tasks List */}
        <div style={{ padding: '20px 24px' }}>
          {allCompleted && (
            <div style={{
              textAlign: 'center',
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: 'rgba(0, 255, 0, 0.1)',
              border: '1px solid rgba(0, 255, 0, 0.3)',
              borderRadius: '8px'
            }}>
              <Trophy size={32} style={{ color: '#00ff00', marginBottom: '8px' }} />
              <div style={{
                color: '#00ff00',
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '4px'
              }}>
                🎉 All Missions Complete!
              </div>
              <div style={{
                color: '#00cc00',
                fontSize: '14px'
              }}>
                You've earned {totalXP} XP from onboarding missions!
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {missionTasks.map((task, index) => (
              <MissionTaskItem
                key={task.id}
                label={task.label}
                xp={task.xp}
                completed={task.completed}
                icon={task.icon}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(0, 240, 255, 0.3)',
          backgroundColor: 'rgba(0, 240, 255, 0.05)',
          textAlign: 'center'
        }}>
          <div style={{
            color: '#888888',
            fontSize: '12px'
          }}>
            Complete missions to earn XP and unlock new features
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionTracker;