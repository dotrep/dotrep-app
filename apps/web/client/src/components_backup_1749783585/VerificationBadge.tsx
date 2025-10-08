import React from 'react';

interface VerificationBadgeProps {
  /** Size of the badge in pixels */
  size?: number;
  /** Whether to show the glow effect */
  glow?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Verification Badge Component
 * Displays a glowing hexagon badge next to verified FSN usernames
 */
const VerificationBadge: React.FC<VerificationBadgeProps> = ({ 
  size = 18, 
  glow = true, 
  className = '' 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      className={`verification-badge ${glow ? 'glow-effect' : ''} ${className}`}
      style={{
        marginLeft: '6px',
        verticalAlign: 'middle',
        filter: glow ? 'drop-shadow(0 0 4px #00faff)' : 'none'
      }}
    >
      {/* Hexagon shape */}
      <path
        d="M12 2L21.5 7v10L12 22l-9.5-5V7L12 2z"
        fill="none"
        stroke="#00faff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      
      {/* Inner hexagon glow */}
      <path
        d="M12 4L19 8v8l-7 4-7-4V8l7-4z"
        fill="rgba(0, 250, 255, 0.1)"
        stroke="#64ffff"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      
      {/* Checkmark */}
      <path
        d="M8.5 12l2.5 2.5L16 9.5"
        fill="none"
        stroke="#00faff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Center dot */}
      <circle
        cx="12"
        cy="12"
        r="1.5"
        fill="#64ffff"
        opacity="0.8"
      />
    </svg>
  );
};

export default VerificationBadge;