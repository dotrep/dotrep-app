import React from 'react';

const XPBar = ({ xp, maxXp, rank }) => {
  const progressPercentage = Math.min((xp / maxXp) * 100, 100);

  return (
    <div className="w-full max-w-md mx-auto p-4">
      {/* Rank Display */}
      <div className="text-white text-lg font-semibold text-center mb-3">
        {rank}
      </div>
      
      {/* Progress Bar Container */}
      <div className="relative w-full h-6 bg-gray-800 rounded-full overflow-hidden">
        {/* Progress Fill */}
        <div 
          className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {/* XP Text Display */}
      <div className="text-white text-sm text-center mt-3">
        {xp} / {maxXp} XP
      </div>
    </div>
  );
};

export default XPBar;