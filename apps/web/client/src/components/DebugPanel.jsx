import React from 'react';

const DebugPanel = ({ onAddXP, onSimUpload }) => {
  return (
    <div className="flex flex-col space-y-4 p-6">
      <button
        onClick={onAddXP}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
      >
        Add +10 XP
      </button>
      
      <button
        onClick={onSimUpload}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
      >
        Simulate File Upload
      </button>
    </div>
  );
};

export default DebugPanel;