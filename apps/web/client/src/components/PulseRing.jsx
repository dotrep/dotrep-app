import React from 'react';

const PulseRing = ({ xp }) => {
  return (
    <div className="flex flex-col items-center justify-center">
      {/* XP Label */}
      <div className="text-white text-lg font-semibold mb-4">
        +{xp} XP
      </div>
      
      {/* Ring Container */}
      <div className="relative">
        {/* Main Ring */}
        <div className="w-64 h-64 rounded-full border-4 border-blue-400 bg-gradient-to-br from-blue-900/50 to-blue-800/30 shadow-lg shadow-blue-500/50 pulse-glow flex items-center justify-center relative overflow-hidden">
          
          {/* Radial Gridlines Background */}
          <div 
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: `
                radial-gradient(circle at center, transparent 20%, rgba(59, 130, 246, 0.1) 21%, rgba(59, 130, 246, 0.1) 22%, transparent 23%),
                radial-gradient(circle at center, transparent 40%, rgba(59, 130, 246, 0.1) 41%, rgba(59, 130, 246, 0.1) 42%, transparent 43%),
                radial-gradient(circle at center, transparent 60%, rgba(59, 130, 246, 0.1) 61%, rgba(59, 130, 246, 0.1) 62%, transparent 63%),
                radial-gradient(circle at center, transparent 80%, rgba(59, 130, 246, 0.1) 81%, rgba(59, 130, 246, 0.1) 82%, transparent 83%),
                conic-gradient(from 0deg, transparent 0deg, rgba(59, 130, 246, 0.1) 45deg, transparent 90deg, rgba(59, 130, 246, 0.1) 135deg, transparent 180deg, rgba(59, 130, 246, 0.1) 225deg, transparent 270deg, rgba(59, 130, 246, 0.1) 315deg, transparent 360deg)
              `
            }}
          />
          
          {/* Inner Ring */}
          <div className="w-48 h-48 rounded-full border border-blue-300/30 flex items-center justify-center">
            
            {/* Center Text */}
            <div className="text-white text-6xl font-bold tracking-tight">
              .fsn
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .pulse-glow {
          animation: pulseGlow 2s ease-in-out infinite;
        }
        
        @keyframes pulseGlow {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 10px 25px rgba(59, 130, 246, 0.5);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 20px 40px rgba(59, 130, 246, 0.8), 0 0 20px rgba(59, 130, 246, 0.6);
          }
        }
      `}</style>
    </div>
  );
};

export default PulseRing;