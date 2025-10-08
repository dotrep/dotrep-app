import React from 'react';

const TestCircle: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-96 h-96 rounded-full border-4 border-cyan-400 flex items-center justify-center">
          {/* Inner circle */}
          <div className="w-80 h-80 rounded-full bg-gray-800 border-2 border-cyan-300 flex items-center justify-center relative">
            {/* XP Badge */}
            <div className="absolute -top-16 bg-blue-500 text-white px-6 py-3 rounded-full font-bold text-xl">
              +50 XP
            </div>
            
            {/* FSN Text */}
            <div className="text-white text-8xl font-bold">
              .fsn
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCircle;