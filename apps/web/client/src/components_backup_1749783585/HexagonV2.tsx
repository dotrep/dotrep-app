import React from "react";

interface HexagonProps {
  className?: string;
}

const HexagonV2: React.FC<HexagonProps> = ({ className }) => {
  return (
    <div 
      className={`fsn-hexagon ${className || ""}`}
      style={{
        position: "relative",
        width: "120px",
        height: "120px",
      }}
    >
      {/* SVG hexagon with precise measurements and pulsing glow effect */}
      <svg 
        width="120" 
        height="120" 
        viewBox="0 0 120 120" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          filter: "drop-shadow(0 0 5px #00D4FF)",
          animation: "fsnPulseGlow 2s ease-in-out infinite",
        }}
      >
        <polygon 
          points="60,0 110,30 110,90 60,120 10,90 10,30" 
          stroke="#00D4FF" 
          strokeWidth="3" 
          fill="transparent"
        />
      </svg>
      
      {/* Text inside hexagon */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "36px",
          fontWeight: "bold",
          textTransform: "uppercase",
          color: "#00D4FF",
          textShadow: "0 0 5px #00D4FF",
          zIndex: 2,
        }}
      >
        .fsn
      </div>
    </div>
  );
};

export default HexagonV2;