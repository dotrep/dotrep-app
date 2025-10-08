import React, { useState, useEffect } from 'react';
import { Shield, Upload, FileText } from 'lucide-react';

interface VaultFile {
  name: string;
  date: string;
}

const Picture6Dashboard: React.FC = () => {
  const [xp, setXp] = useState(960);
  const [maxXp] = useState(1000);
  const [files, setFiles] = useState<VaultFile[]>([
    { name: 'report.pdf', date: '4/24/2024' },
    { name: 'photo.png', date: '4/24/2024' }
  ]);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAddXP = () => {
    setXp(prev => Math.min(prev + 10, maxXp));
    setPulse(true);
    setTimeout(() => setPulse(false), 1000);
  };

  const handleSimUpload = () => {
    const newFile = {
      name: `file${files.length + 1}.txt`,
      date: new Date().toLocaleDateString('en-US', { 
        month: 'numeric', 
        day: 'numeric', 
        year: 'numeric' 
      })
    };
    setFiles(prev => [...prev, newFile]);
    setXp(prev => Math.min(prev + 10, maxXp));
  };

  const progressPercentage = (xp / maxXp) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Left Side - FSN Circle and Sentinel */}
          <div className="flex flex-col items-center space-y-8">
            
            {/* Main FSN Circle */}
            <div className="relative">
              {/* Outer pulsing rings */}
              <div className={`absolute inset-0 rounded-full border-2 border-blue-400 opacity-30 transition-all duration-1000 ${pulse ? 'scale-150 opacity-0' : 'scale-100'}`}></div>
              <div className={`absolute inset-0 rounded-full border border-blue-300 opacity-40 transition-all duration-1000 delay-200 ${pulse ? 'scale-125 opacity-0' : 'scale-100'}`}></div>
              
              {/* Main circle */}
              <div className="relative w-64 h-64 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full border-2 border-blue-400 shadow-2xl shadow-blue-500/30 flex flex-col items-center justify-center">
                
                {/* XP Badge */}
                <div className="absolute -top-6 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                  +50 XP
                </div>
                
                {/* FSN Text */}
                <div className="text-white text-6xl font-bold tracking-wider">
                  .fsn
                </div>
              </div>
            </div>

            {/* Sentinel Section */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-xl">
              <div className="flex items-center space-x-3 mb-3">
                <Shield className="text-blue-400 w-6 h-6" />
                <span className="text-white text-xl font-semibold">Sentinel</span>
              </div>
              <div className="text-gray-300 text-sm">Initial Pulse</div>
            </div>
          </div>

          {/* Right Side - Upload, Files, Progress, Debug */}
          <div className="space-y-8">
            
            {/* Upload Section */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 shadow-xl">
              <h2 className="text-white text-2xl font-bold mb-6">Upload</h2>
              <div className="border-2 border-dashed border-blue-400 rounded-xl p-12 text-center hover:border-blue-300 transition-colors cursor-pointer bg-gray-900/30">
                <Upload className="text-blue-400 w-12 h-12 mx-auto mb-4" />
                <p className="text-gray-300 text-lg">Click to upload files</p>
              </div>
            </div>

            {/* My Vault Files */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-xl">
              <div className="flex items-center space-x-3 mb-6">
                <FileText className="text-blue-400 w-6 h-6" />
                <h3 className="text-white text-xl font-semibold">My Vault Files</h3>
              </div>
              <div className="space-y-4">
                {files.map((file, index) => (
                  <div key={index} className="flex justify-between items-center py-3 px-4 bg-gray-900/40 rounded-lg border border-gray-600">
                    <span className="text-gray-300">{file.name}</span>
                    <span className="text-gray-400 text-sm">{file.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sentinel Progress */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-white text-xl font-semibold">Sentinel</span>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="text-gray-300 text-sm">
                {xp} / {maxXp} XP
              </div>
            </div>

            {/* Debug Panel */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-xl">
              <h3 className="text-white text-xl font-semibold mb-4">Debug Panel</h3>
              <div className="flex space-x-4">
                <button
                  onClick={handleAddXP}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
                >
                  +10 XP
                </button>
                <button
                  onClick={handleSimUpload}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
                >
                  Sim Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Picture6Dashboard;