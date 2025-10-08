import React, { useEffect } from 'react';
import '../styles/fsn.css';

interface DebugPanelProps {
  debugMode?: boolean;
  onToggleDebug?: () => void;
  onAddXP?: () => void;
  onSimUpload?: () => void;
  onTriggerPulse?: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ 
  debugMode = false, 
  onToggleDebug,
  onAddXP, 
  onSimUpload, 
  onTriggerPulse 
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        if (onToggleDebug) {
          onToggleDebug();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleDebug]);

  if (!debugMode) {
    return null;
  }

  return (
    <div className="debug-panel">
      <div className="debug-panel-header">
        <span className="debug-title">Debug Panel</span>
        <button 
          className="debug-close"
          onClick={onToggleDebug}
          aria-label="Close debug panel"
        >
          ×
        </button>
      </div>
      
      <div className="debug-panel-content">
        <button 
          className="debug-btn debug-btn-xp"
          onClick={onAddXP}
        >
          +10 XP
        </button>
        
        <button 
          className="debug-btn debug-btn-upload"
          onClick={onSimUpload}
        >
          Sim Upload
        </button>
        
        <button 
          className="debug-btn debug-btn-pulse"
          onClick={onTriggerPulse}
        >
          Trigger Pulse
        </button>
      </div>
      
      <div className="debug-panel-footer">
        <span className="debug-hotkey">Ctrl+Shift+D to toggle</span>
      </div>
    </div>
  );
};

export default DebugPanel;