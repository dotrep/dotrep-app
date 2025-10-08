import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';

interface Picture6VaultProps {
  onClose?: () => void;
}

const Picture6Vault: React.FC<Picture6VaultProps> = ({ onClose }) => {
  const handleXPClick = () => {
    console.log('+10 XP awarded');
  };

  const handleSimUpload = () => {
    console.log('Sim upload initiated');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Network Grid Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Close button if used as overlay */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-50 text-white hover:text-cyan-400 transition-colors"
        >
          <X size={24} />
        </button>
      )}

      {/* Main Vault Content - Picture 6 Layout */}
      <div className="relative z-10 flex flex-col lg:flex-row items-start justify-center min-h-screen px-6 gap-8 py-12">
        
        {/* Left Side - FSN Circle with XP */}
        <div className="flex flex-col items-center justify-center lg:w-1/2 space-y-8">
          {/* Main FSN Circle */}
          <div className="relative">
            <div className="w-80 h-80 rounded-full border-4 border-cyan-400/30 bg-slate-900/50 flex items-center justify-center relative overflow-hidden">
              {/* Animated rings */}
              <div className="absolute inset-4 rounded-full border-2 border-cyan-400/20 animate-pulse"></div>
              <div className="absolute inset-8 rounded-full border border-cyan-400/10 animate-pulse" style={{animationDelay: '0.5s'}}></div>
              
              {/* XP Display */}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-slate-800/90 border border-cyan-400/30 rounded-lg px-4 py-2">
                <span className="text-cyan-400 font-bold text-lg">+50 XP</span>
              </div>
              
              {/* Central .fsn text */}
              <div className="text-center">
                <span className="text-6xl font-bold text-white">.fsn</span>
              </div>
            </div>
          </div>

          {/* Sentinal Status */}
          <div className="bg-slate-800/50 border border-cyan-400/20 rounded-lg p-6 w-80">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-cyan-400/20 rounded flex items-center justify-center">
                <div className="w-4 h-4 bg-cyan-400 rounded"></div>
              </div>
              <h3 className="text-xl font-semibold text-white">Sentinal</h3>
            </div>
            <p className="text-slate-300 mb-4">Initial Pulse</p>
          </div>
        </div>

        {/* Right Side - Vault Files */}
        <div className="lg:w-1/2 max-w-md">
          {/* Upload Button */}
          <div className="mb-6">
            <Button 
              className="w-full bg-slate-800/50 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 py-4 text-lg"
              onClick={() => console.log('Upload clicked')}
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload
            </Button>
          </div>

          {/* My Vault Files */}
          <div className="bg-slate-800/30 border border-cyan-400/20 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-6 h-6 text-cyan-400">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">My Vault Files</h3>
            </div>

            {/* File List */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
                <span className="text-slate-300">report.pdf</span>
                <span className="text-slate-400 text-sm">4/24/2024</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
                <span className="text-slate-300">photo.png</span>
                <span className="text-slate-400 text-sm">4/24/2024</span>
              </div>
            </div>
          </div>

          {/* Sentinal Progress */}
          <div className="mt-6 bg-slate-800/30 border border-cyan-400/20 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 text-cyan-400">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Sentinal</h3>
            </div>
            
            {/* XP Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>960 / 1000 XP</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-3 rounded-full" style={{width: '96%'}}></div>
              </div>
            </div>
            
            {/* Debug Panel */}
            <div className="flex justify-between items-center mt-4">
              <span className="text-slate-300">Debug Panel</span>
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleXPClick}
                  className="bg-cyan-400/20 text-cyan-400 hover:bg-cyan-400/30 text-sm px-3 py-1"
                >
                  +10 XP
                </Button>
                <Button
                  onClick={handleSimUpload}
                  className="bg-slate-600/50 text-slate-300 hover:bg-slate-600/70 text-sm px-3 py-1"
                >
                  Sim Upload
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Picture6Vault;