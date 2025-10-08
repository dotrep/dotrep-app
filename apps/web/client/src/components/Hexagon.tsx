import React from "react";

const Hexagon: React.FC = () => {
  return (
    <div className="hexagon-container">
      <div className="hexagon">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pulse">
          <polygon 
            points="50 0, 100 25, 100 75, 50 100, 0 75, 0 25" 
            fill="transparent" 
            stroke="#00D4FF" 
            strokeWidth="3"
          />
        </svg>
        <div className="hexagon-text">.fsn</div>
      </div>
    </div>
  );
};

export default Hexagon;
