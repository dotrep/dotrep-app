// Mode indicator to show current environment
import React from 'react';
import { config } from '../../shared/config';

export const ModeIndicator: React.FC = () => {
  const getBadgeColor = () => {
    if (config.appMode === 'STEALTH') {
      return 'bg-gray-600 text-gray-200 border-gray-500';
    }
    if (config.chainName.includes('Sepolia')) {
      return 'bg-blue-600 text-blue-100 border-blue-500';
    }
    return 'bg-green-600 text-green-100 border-green-500';
  };

  return (
    <div className="mode-indicator">
      <div className={`mode-badge ${getBadgeColor()}`}>
        <span className="mode-text">
          {config.appMode} MODE • {config.chainName}
        </span>
      </div>

      <style>{`
        .mode-indicator {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
        }

        .mode-badge {
          padding: 8px 12px;
          border-radius: 20px;
          border: 1px solid;
          backdrop-filter: blur(10px);
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .mode-text {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        @media (max-width: 768px) {
          .mode-indicator {
            top: 10px;
            right: 10px;
          }

          .mode-badge {
            padding: 6px 10px;
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
};