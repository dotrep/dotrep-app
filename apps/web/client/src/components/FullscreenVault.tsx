import React from 'react';
import { X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FullscreenVaultProps {
  onClose: () => void;
}

const FullscreenVault: React.FC<FullscreenVaultProps> = ({ onClose }) => {
  const handleXPClick = () => {
    console.log('+10 XP awarded');
  };

  const handleSimUpload = () => {
    console.log('Sim upload initiated');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-60 text-gray-400 hover:text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Upload button */}
      <button className="absolute top-4 right-16 z-60 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center space-x-2 transition-colors">
        <Upload className="w-4 h-4" />
        <span>Upload</span>
      </button>

      {/* Left side - FSN Pulse Ring */}
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="relative">
          {/* Pulse rings */}
          <div className="relative w-80 h-80">
            {/* Outermost ring */}
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-pulse"></div>
            
            {/* Second ring */}
            <div className="absolute inset-4 rounded-full border-2 border-cyan-400/40 animate-pulse" style={{animationDelay: '0.5s'}}></div>
            
            {/* Third ring */}
            <div className="absolute inset-8 rounded-full border-2 border-cyan-400/50 animate-pulse" style={{animationDelay: '1s'}}></div>
            
            {/* Fourth ring */}
            <div className="absolute inset-12 rounded-full border-2 border-cyan-400/60 animate-pulse" style={{animationDelay: '1.5s'}}></div>
            
            {/* Inner ring */}
            <div className="absolute inset-16 rounded-full border-2 border-cyan-400/70 animate-pulse" style={{animationDelay: '2s'}}></div>
            
            {/* Center circle */}
            <div className="absolute inset-20 rounded-full bg-slate-800 border-2 border-cyan-400 flex items-center justify-center">
              <div className="text-white font-bold text-2xl">.fsn</div>
            </div>
          </div>

          {/* +50 XP overlay */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-cyan-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            +50 XP
          </div>

          {/* Sentinel label */}
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
              <span className="text-white font-medium">Sentinel</span>
            </div>
            <div className="text-gray-400 text-sm">Initial Pulse</div>
          </div>
        </div>
      </div>

      {/* Right side - Vault interface */}
      <div className="flex-1 p-8 bg-slate-900">
        <div className="max-w-2xl space-y-6">
          {/* My Vault Files */}
          <div className="bg-slate-800/50 border border-cyan-500/20 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-4 h-4 bg-yellow-500 rounded-sm"></div>
              <h3 className="text-white font-medium">My Vault Files</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded border border-slate-600/50 hover:bg-slate-700/70 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">📄</span>
                  </div>
                  <span className="text-white">report.pdf</span>
                </div>
                <span className="text-gray-400 text-sm">4/24/2024</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded border border-slate-600/50 hover:bg-slate-700/70 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">🖼️</span>
                  </div>
                  <span className="text-white">photo.png</span>
                </div>
                <span className="text-gray-400 text-sm">4/24/2024</span>
              </div>
            </div>
          </div>

          {/* Sentinel Progress */}
          <div className="bg-slate-800/50 border border-cyan-500/20 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <h3 className="text-white font-medium">Sentinel</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Progress</span>
                <span className="text-cyan-400 font-mono">960 / 1000 XP</span>
              </div>
              
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{width: '96%'}}
                ></div>
              </div>
            </div>
          </div>

          {/* Debug Panel */}
          <div className="bg-slate-800/50 border border-cyan-500/20 rounded-lg p-6">
            <h3 className="text-white font-medium mb-4">Debug Panel</h3>
            
            <div className="flex space-x-3">
              <button
                onClick={handleXPClick}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                +10 XP
              </button>
              
              <button
                onClick={handleSimUpload}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
              >
                Sim Upload
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullscreenVault;