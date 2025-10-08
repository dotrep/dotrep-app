import React from 'react';

interface BadgeCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  earned?: boolean;
  xpRequired?: number;
  currentXp?: number;
  className?: string;
}

const BadgeCard: React.FC<BadgeCardProps> = ({ 
  icon, 
  title, 
  description, 
  earned = false,
  xpRequired,
  currentXp = 0,
  className = ''
}) => {
  const progress = xpRequired ? Math.min((currentXp / xpRequired) * 100, 100) : 100;
  
  return (
    <div className={`
      flex flex-col items-center justify-center 
      bg-black text-teal-300 border border-teal-300 
      rounded-2xl w-48 h-48 p-4 shadow-lg 
      hover:scale-105 transition-transform duration-300
      ${earned ? 'bg-opacity-20 border-opacity-100' : 'bg-opacity-10 border-opacity-40'}
      ${className}
    `}>
      <div className={`
        text-5xl mb-3 transition-all duration-300
        ${earned ? 'text-teal-300 filter drop-shadow-[0_0_8px_rgba(100,255,255,0.8)]' : 'text-gray-500'}
      `}>
        {icon}
      </div>
      
      <h2 className={`
        text-lg font-bold text-center
        ${earned ? 'text-teal-300' : 'text-gray-400'}
      `}>
        {title}
      </h2>
      
      <p className={`
        text-sm text-center mt-1
        ${earned ? 'text-teal-200' : 'text-gray-500'}
      `}>
        {description}
      </p>
      
      {!earned && xpRequired && (
        <div className="mt-2 w-full">
          <div className="text-xs text-gray-400 text-center mb-1">
            {currentXp} / {xpRequired} XP
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-teal-500 to-cyan-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      {earned && (
        <div className="mt-2 text-xs text-teal-400 font-semibold animate-pulse">
          ✓ EARNED
        </div>
      )}
    </div>
  );
};

export default BadgeCard;