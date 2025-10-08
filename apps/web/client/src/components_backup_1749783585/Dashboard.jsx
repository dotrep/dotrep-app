import React, { useState } from 'react';
import { XPProvider, useXP } from '../context/XPContext';
import PulseRing from './PulseRing';
import XPBar from './XPBar';
import VaultFileList from './VaultFileList';
import UploadDropZone from './UploadDropZone';
import DebugPanel from './DebugPanel';

const DashboardContent = () => {
  const [files, setFiles] = useState([]);
  const { xp, addXP } = useXP();
  
  const maxXp = 1000;
  const rank = "Sentinel";

  const handleFileUpload = (uploadedFiles) => {
    const newFiles = uploadedFiles.map(file => ({
      name: file.name,
      timestamp: new Date().toISOString()
    }));
    
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
    addXP(50 * uploadedFiles.length);
  };

  const handleAddXP = () => {
    addXP(10);
  };

  const handleSimUpload = () => {
    const mockFile = {
      name: "test-file.txt",
      timestamp: new Date().toISOString()
    };
    
    setFiles(prevFiles => [...prevFiles, mockFile]);
    addXP(50);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Left Panel */}
          <div className="flex flex-col items-center space-y-6">
            <XPBar xp={xp} maxXp={maxXp} rank={rank} />
            <PulseRing xp={xp} />
          </div>
          
          {/* Right Panel */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Upload Files</h2>
              <UploadDropZone onUpload={handleFileUpload} />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-4">Vault Files</h2>
              <VaultFileList files={files} />
            </div>
          </div>
        </div>
        
        {/* Debug Panel */}
        <div className="border-t border-gray-700 pt-8">
          <h2 className="text-2xl font-bold mb-4">Debug Panel</h2>
          <DebugPanel onAddXP={handleAddXP} onSimUpload={handleSimUpload} />
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  return (
    <XPProvider>
      <DashboardContent />
    </XPProvider>
  );
};

export default Dashboard;