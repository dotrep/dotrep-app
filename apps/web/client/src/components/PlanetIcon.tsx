import React from "react";

interface PlanetIconProps {
  className?: string;
  size?: number;
}

/**
 * Saturn planet icon for Explorer badge
 * Exactly matches the reference image
 */
const PlanetIcon: React.FC<PlanetIconProps> = ({ className = "", size = 24 }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none"
      className={className}
    >
      {/* Outer circle container */}
      <circle cx="12" cy="12" r="10" stroke="#00FFFF" strokeWidth="1.2" />
      
      {/* Planet body */}
      <circle cx="12" cy="12" r="4" stroke="#00FFFF" strokeWidth="1.2" />
      
      {/* Ring around planet */}
      <path 
        d="M5,12 C5,10.5 8,8.5 12,8.5 C16,8.5 19,10.5 19,12 C19,13.5 16,15.5 12,15.5 C8,15.5 5,13.5 5,12 Z" 
        stroke="#00FFFF" 
        strokeWidth="1.2" 
        fill="none"
      />
    </svg>
  );
};

export default PlanetIcon;