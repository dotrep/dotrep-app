import React from 'react';
import AnimatedFSNCircle from '@/components/AnimatedFSNCircle';

const SimpleDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-8">
      <div className="max-w-4xl mx-auto">
        <AnimatedFSNCircle xp={50} />
      </div>
    </div>
  );
};

export default SimpleDashboard;