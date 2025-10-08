import React, { useEffect, useState } from 'react';
import { Trophy, Star, Zap } from 'lucide-react';

interface LevelUpToastProps {
  show: boolean;
  onClose: () => void;
  level: number;
  tierName: string;
}

const LevelUpToast: React.FC<LevelUpToastProps> = ({ show, onClose, level, tierName }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300); // Allow fade out animation
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        transform: visible ? 'translateY(0)' : 'translateY(-100px)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.3s ease-out',
        backgroundColor: 'rgba(0, 20, 40, 0.95)',
        border: '2px solid #00ff00',
        borderRadius: '12px',
        padding: '20px',
        minWidth: '300px',
        boxShadow: '0 0 30px rgba(0, 255, 0, 0.4)',
        backdropFilter: 'blur(10px)',
        fontFamily: 'Orbitron, sans-serif'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '10px'
      }}>
        <Trophy size={24} style={{ color: '#00ff00' }} />
        <div style={{
          color: '#00ff00',
          fontSize: '18px',
          fontWeight: 'bold',
          textShadow: '0 0 10px rgba(0, 255, 0, 0.8)'
        }}>
          Level Up!
        </div>
      </div>
      
      <div style={{
        color: '#ffffff',
        fontSize: '14px',
        marginBottom: '8px'
      }}>
        🎉 You're now <strong style={{ color: '#00ff00' }}>Level {level}</strong>
      </div>
      
      <div style={{
        color: '#00bcd4',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <Star size={16} />
        <span>{tierName} Tier Unlocked!</span>
      </div>
      
      {/* Animated background effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(45deg, transparent, rgba(0, 255, 0, 0.1), transparent)',
        animation: 'pulseGlow 2s ease-in-out infinite',
        borderRadius: '12px',
        zIndex: -1
      }} />
      
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LevelUpToast;