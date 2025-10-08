import React, { useState, useEffect } from 'react';

interface AnimatedFSNCircleProps {
  xp?: number;
  onPulse?: () => void;
}

const AnimatedFSNCircle: React.FC<AnimatedFSNCircleProps> = ({ 
  xp = 50, 
  onPulse 
}) => {
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 1500);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const triggerPulse = () => {
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 1500);
    if (onPulse) onPulse();
  };

  return (
    <div className="relative w-96 h-96 flex items-center justify-center cursor-pointer" onClick={triggerPulse}>
      {/* Outer Pulsing Rings */}
      <div 
        className={`absolute w-full h-full rounded-full border-2 border-cyan-400/50 transition-all duration-1000 ease-out ${
          isPulsing ? 'scale-125 opacity-0' : 'scale-100 opacity-70'
        }`}
      />
      <div 
        className={`absolute w-[90%] h-[90%] rounded-full border border-cyan-300/40 transition-all duration-1000 ease-out delay-300 ${
          isPulsing ? 'scale-150 opacity-0' : 'scale-100 opacity-50'
        }`}
      />
      <div 
        className={`absolute w-[110%] h-[110%] rounded-full border border-blue-400/30 transition-all duration-1500 ease-out delay-500 ${
          isPulsing ? 'scale-175 opacity-0' : 'scale-100 opacity-30'
        }`}
      />

      {/* Main Circle Container */}
      <div className="relative w-80 h-80 flex items-center justify-center">
        {/* Glowing Background */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800 via-gray-900 to-black shadow-2xl shadow-cyan-500/40 border-2 border-cyan-400/60" />
        
        {/* Inner Glow Ring */}
        <div className="absolute inset-4 rounded-full border border-cyan-400/50 shadow-inner shadow-cyan-400/20" />
        
        {/* XP Badge */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-full text-lg font-bold shadow-lg shadow-cyan-500/40 z-10">
          +{xp} XP
        </div>

        {/* FSN Text */}
        <div className="relative z-10 text-center">
          <div className="text-white text-7xl font-bold tracking-widest drop-shadow-2xl">
            .fsn
          </div>
        </div>

        {/* Rotating Inner Ring */}
        <div className={`absolute inset-8 rounded-full border border-cyan-400/40 transition-transform duration-2000 ease-linear ${
          isPulsing ? 'rotate-180' : 'rotate-0'
        }`} />
      </div>

      {/* Ambient Glow */}
      <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-3xl scale-150" />
    </div>
  );
};

export default AnimatedFSNCircle;