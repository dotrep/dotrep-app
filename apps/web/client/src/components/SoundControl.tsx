import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function SoundControl() {
  const [isMuted, setIsMuted] = useState(false);

  // Load sound preference from localStorage on mount
  useEffect(() => {
    const savedPreference = localStorage.getItem('fsnSoundEnabled');
    if (savedPreference !== null) {
      setIsMuted(savedPreference === 'false');
    }
  }, []);

  // Save sound preference to localStorage
  const toggleSound = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    localStorage.setItem('fsnSoundEnabled', (!newMutedState).toString());
  };

  return (
    <div
      onClick={toggleSound}
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        width: '48px',
        height: '48px',
        background: 'rgba(0, 20, 40, 0.8)',
        border: '1px solid rgba(0, 188, 212, 0.3)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(8px)',
        zIndex: 1000
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(0, 188, 212, 0.8)';
        e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 188, 212, 0.4)';
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(0, 188, 212, 0.3)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'scale(1)';
      }}
      title={isMuted ? 'Enable sound effects' : 'Disable sound effects'}
    >
      {isMuted ? (
        <VolumeX size={20} color="#00bcd4" />
      ) : (
        <Volume2 size={20} color="#00bcd4" />
      )}
    </div>
  );
}

// Utility function to check if sound is enabled
export const isSoundEnabled = (): boolean => {
  const savedPreference = localStorage.getItem('fsnSoundEnabled');
  return savedPreference !== 'false'; // Default to true if not set
};

// Utility function to play sound effects
export const playSound = (soundType: 'xp-gain' | 'level-up' | 'badge-unlock' | 'quest-complete' | 'signal-cast') => {
  if (!isSoundEnabled()) return;
  
  // Create audio context for simple beep sounds
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Different frequencies and patterns for different sounds
  const soundConfig = {
    'xp-gain': { frequency: 800, duration: 0.1 },
    'level-up': { frequency: 1000, duration: 0.3 },
    'badge-unlock': { frequency: 1200, duration: 0.4 },
    'quest-complete': { frequency: 900, duration: 0.5 },
    'signal-cast': { frequency: 700, duration: 0.2 }
  };
  
  const config = soundConfig[soundType];
  oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime);
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + config.duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + config.duration);
};