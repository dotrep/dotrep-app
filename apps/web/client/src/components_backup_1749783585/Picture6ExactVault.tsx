import React from 'react';
import { Button } from '@/components/ui/button';
import { X, FileText, Play } from 'lucide-react';

interface Picture6ExactVaultProps {
  onClose?: () => void;
}

const Picture6ExactVault: React.FC<Picture6ExactVaultProps> = ({ onClose }) => {
  const handleXPClick = () => {
    console.log('+10 XP awarded');
  };

  const handleSimUpload = () => {
    console.log('Sim upload initiated');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Close button if used as overlay */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-50 text-white hover:text-cyan-400 transition-colors"
        >
          <X size={24} />
        </button>
      )}

      {/* Main content matching Picture 6 exactly */}
      <div className="min-h-screen flex items-center justify-center px-8">
        <div className="flex flex-row gap-16 max-w-6xl w-full items-center">
          
          {/* Left Side - Central FSN Circle */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Main FSN Circle with Glowing Rings */}
            <div className="relative mb-8 flex items-center justify-center">
              {/* Outer glowing ring */}
              <div className="absolute w-80 h-80 rounded-full border-2 border-cyan-400/40 animate-pulse"></div>
              
              {/* Middle ring */}
              <div className="absolute w-72 h-72 rounded-full border border-cyan-400/30"></div>
              
              {/* Inner circle with content */}
              <div className="relative w-80 h-80 rounded-full bg-slate-900/90 border border-cyan-400/20 flex flex-col items-center justify-center">
                {/* XP Badge */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-slate-800/90 border border-cyan-400/50 rounded-lg px-4 py-2 z-10">
                  <span className="text-cyan-400 font-bold text-lg">+50 XP</span>
                </div>
                
                {/* Central .fsn text */}
                <div className="text-center">
                  <span className="text-white text-6xl font-bold">.fsn</span>
                </div>
              </div>
            </div>
            
            {/* Sentinal Status Below Circle */}
            <div className="bg-slate-800/60 border border-cyan-400/30 rounded-lg p-6 w-80">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-cyan-400/20 rounded flex items-center justify-center">
                  <div className="w-4 h-4 bg-cyan-400 rounded-sm"></div>
                </div>
                <div>
                  <h3 className="text-white text-xl font-semibold">Sentinal</h3>
                  <p className="text-slate-300 text-sm">Initial Pulse</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Vault Panel */}
          <div className="flex-1 max-w-md">
            <div className="bg-slate-800/40 border border-cyan-400/20 rounded-lg p-8 space-y-8">
              
              {/* Upload Section */}
              <div className="text-center">
                <h2 className="text-white text-2xl font-semibold mb-4">Upload</h2>
                <div className="border-2 border-dashed border-cyan-400/30 rounded-lg p-8 hover:border-cyan-400/50 transition-colors cursor-pointer">
                  <div className="text-cyan-400 text-lg">Click to upload files</div>
                </div>
              </div>

              {/* My Vault Files */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="w-6 h-6 text-cyan-400" />
                  <h3 className="text-white text-xl font-semibold">My Vault Files</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-slate-600/50">
                    <span className="text-slate-200">report.pdf</span>
                    <span className="text-slate-400 text-sm">4/24/2024</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-slate-600/50">
                    <span className="text-slate-200">photo.png</span>
                    <span className="text-slate-400 text-sm">4/24/2024</span>
                  </div>
                </div>
              </div>

              {/* Sentinal Progress */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Play className="w-6 h-6 text-cyan-400" />
                  <h3 className="text-white text-xl font-semibold">Sentinal</h3>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-cyan-400 to-cyan-500 h-full rounded-full transition-all duration-300"
                      style={{ width: '96%' }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-slate-400 mt-2">
                    <span>960 / 1000 XP</span>
                  </div>
                </div>
              </div>

              {/* Debug Panel */}
              <div className="border-t border-slate-600/50 pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-white text-lg font-medium">Debug Panel</span>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleXPClick}
                      className="bg-cyan-400/20 hover:bg-cyan-400/30 text-cyan-400 border border-cyan-400/40 text-sm px-3 py-1"
                    >
                      +10 XP
                    </Button>
                    <Button
                      onClick={handleSimUpload}
                      className="bg-slate-600/50 hover:bg-slate-600/70 text-slate-300 border border-slate-500/40 text-sm px-3 py-1"
                    >
                      Sim Upload
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Picture6ExactVault;