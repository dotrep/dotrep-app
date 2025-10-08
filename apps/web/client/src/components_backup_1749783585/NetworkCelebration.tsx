import React, { useEffect } from 'react';

interface NetworkCelebrationProps {
  active: boolean;
  onComplete?: () => void;
}

/**
 * A component that handles celebration animations
 * This is just a controller component that doesn't modify the background animation
 */
const NetworkCelebration: React.FC<NetworkCelebrationProps> = ({ active, onComplete }) => {
  useEffect(() => {
    if (active) {
      // Set a timeout to end the celebration
      const timeout = setTimeout(() => {
        if (onComplete) onComplete();
      }, 2000); // 2 seconds for the celebration effect
      
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [active, onComplete]);
  
  // This component doesn't render anything visible
  return null;
};

export default NetworkCelebration;