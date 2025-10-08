import React from 'react';

interface VaultIconProps {
  size?: number;
  className?: string;
}

/**
 * Custom Vault Icon Component
 * Designed specifically for the FSN Vault interface
 */
const VaultIcon: React.FC<VaultIconProps> = ({ size = 40, className = '' }) => {
  const width = size;
  const height = size;
  
  return (
    <div className={`vault-icon-container ${className}`} style={{ width, height }}>
      <svg 
        width={width} 
        height={height} 
        viewBox="0 0 50 50" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer glow effect */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        
        {/* Base shield shape */}
        <path 
          d="M25 5L45 15V25C45 35 35 42 25 45C15 42 5 35 5 25V15L25 5Z" 
          fill="rgba(0, 240, 255, 0.05)" 
          stroke="rgba(0, 240, 255, 0.7)" 
          strokeWidth="1.5"
          filter="url(#glow)"
        />
        
        {/* Lock body */}
        <rect 
          x="17" 
          y="20" 
          width="16" 
          height="14" 
          rx="2" 
          fill="rgba(0, 240, 255, 0.2)" 
          stroke="rgba(0, 240, 255, 0.8)" 
          strokeWidth="1.5"
        />
        
        {/* Lock shackle */}
        <path 
          d="M19 20V16C19 13.2386 21.2386 11 24 11H26C28.7614 11 31 13.2386 31 16V20" 
          stroke="rgba(0, 240, 255, 0.8)" 
          strokeWidth="1.5" 
          strokeLinecap="round"
        />
        
        {/* Keyhole */}
        <circle 
          cx="25" 
          cy="27" 
          r="3" 
          fill="rgba(0, 240, 255, 0.2)" 
          stroke="rgba(0, 240, 255, 0.8)" 
          strokeWidth="1.5"
        />
        
        {/* Key slot */}
        <line 
          x1="25" 
          y1="30" 
          x2="25" 
          y2="33" 
          stroke="rgba(0, 240, 255, 0.8)" 
          strokeWidth="1.5" 
          strokeLinecap="round"
        />
        
        {/* Glow effect */}
        <circle 
          cx="25" 
          cy="27" 
          r="1.5" 
          fill="rgba(0, 240, 255, 0.6)" 
        />
      </svg>
    </div>
  );
};

export default VaultIcon;