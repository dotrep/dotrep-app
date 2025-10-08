import React from 'react';

const VaultFileList = ({ files }) => {
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full space-y-4">
      {files.map((file, index) => (
        <div 
          key={index}
          className="bg-gray-900 rounded-lg shadow-lg p-6 hover:shadow-xl hover:bg-gray-800 transition-all duration-200 cursor-pointer"
        >
          <div className="flex flex-col space-y-2">
            {/* File Name */}
            <div className="text-white text-lg font-semibold">
              {file.name}
            </div>
            
            {/* Timestamp */}
            <div className="text-gray-400 text-sm">
              {formatTimestamp(file.timestamp)}
            </div>
          </div>
        </div>
      ))}
      
      {files.length === 0 && (
        <div className="text-gray-500 text-center py-8">
          No files uploaded yet
        </div>
      )}
    </div>
  );
};

export default VaultFileList;