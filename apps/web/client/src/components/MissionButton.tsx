import React, { useState, useEffect } from 'react';
import { ClipboardList, Star } from 'lucide-react';
import MissionTracker from './MissionTracker';
import { useXP } from '../context/XPContext';

const MissionButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const { missionTasks, checkMissionProgress } = useXP();

  // Check for first-time user
  useEffect(() => {
    const hasSeenMissions = localStorage.getItem('hasSeenMissions');
    if (!hasSeenMissions) {
      setShowNotification(true);
      // Auto-open on first visit
      setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem('hasSeenMissions', 'true');
        setShowNotification(false);
      }, 2000);
    }
  }, []);

  // Check mission progress periodically
  useEffect(() => {
    checkMissionProgress();
    const interval = setInterval(checkMissionProgress, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [checkMissionProgress]);

  const completedCount = Object.values(missionTasks).filter(Boolean).length;
  const allCompleted = completedCount === 5;

  const handleButtonClick = () => {
    setIsOpen(true);
    setShowNotification(false);
  };

  return (
    <>
      {/* Floating Mission Button */}
      <button
        onClick={handleButtonClick}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: allCompleted 
            ? 'linear-gradient(135deg, #00ff00 0%, #00cc00 100%)'
            : 'linear-gradient(135deg, #00f0ff 0%, #0080ff 100%)',
          border: `2px solid ${allCompleted ? '#00ff00' : '#00f0ff'}`,
          color: allCompleted ? '#000' : '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontFamily: 'Orbitron, sans-serif',
          boxShadow: allCompleted 
            ? '0 0 20px rgba(0, 255, 0, 0.5)'
            : '0 0 20px rgba(0, 240, 255, 0.5)',
          transition: 'all 0.3s ease',
          zIndex: 1000,
          animation: showNotification ? 'missionPulse 2s ease-in-out infinite' : 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = allCompleted 
            ? '0 0 30px rgba(0, 255, 0, 0.8)'
            : '0 0 30px rgba(0, 240, 255, 0.8)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = allCompleted 
            ? '0 0 20px rgba(0, 255, 0, 0.5)'
            : '0 0 20px rgba(0, 240, 255, 0.5)';
        }}
      >
        {allCompleted ? <Star size={24} /> : <ClipboardList size={24} />}
        
        {/* Mission Counter Badge */}
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: allCompleted ? '#ffff00' : '#ff0080',
            color: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            border: '2px solid #000',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)'
          }}
        >
          {completedCount}
        </div>
      </button>

      {/* Notification Bubble */}
      {showNotification && (
        <div
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            background: 'rgba(0, 240, 255, 0.1)',
            border: '1px solid #00f0ff',
            borderRadius: '8px',
            padding: '10px 15px',
            color: '#00f0ff',
            fontSize: '14px',
            fontFamily: 'Orbitron, sans-serif',
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)',
            zIndex: 999,
            animation: 'fadeInUp 0.5s ease-out'
          }}
        >
          New missions available!
        </div>
      )}

      {/* Mission Tracker Panel */}
      <MissionTracker
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        tasks={missionTasks}
      />

      {/* Styles */}
      <style>{`
        @keyframes missionPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 20px rgba(0, 240, 255, 0.5);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 30px rgba(0, 240, 255, 0.8);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default MissionButton;