import React from 'react';

interface NextActionProps {
  action: {
    type: 'pulse' | 'signal' | 'beacon';
    title: string;
    description: string;
  };
  isCompleted?: boolean;
}

const NextAction: React.FC<NextActionProps> = ({ action, isCompleted = false }) => {
  const getIcon = () => {
    switch (action.type) {
      case 'pulse':
        return '🫀';
      case 'signal':
        return '📶';
      case 'beacon':
        return '🛰️';
      default:
        return '⚡';
    }
  };

  const getColors = () => {
    switch (action.type) {
      case 'pulse':
        return {
          primary: 'rgba(244, 67, 54, 0.8)',
          glow: 'rgba(244, 67, 54, 0.5)',
          bg: 'rgba(244, 67, 54, 0.1)'
        };
      case 'signal':
        return {
          primary: 'rgba(0, 188, 212, 0.8)',
          glow: 'rgba(0, 188, 212, 0.5)',
          bg: 'rgba(0, 188, 212, 0.1)'
        };
      case 'beacon':
        return {
          primary: 'rgba(77, 208, 225, 0.8)',
          glow: 'rgba(77, 208, 225, 0.5)',
          bg: 'rgba(77, 208, 225, 0.1)'
        };
      default:
        return {
          primary: 'rgba(255, 255, 255, 0.8)',
          glow: 'rgba(255, 255, 255, 0.5)',
          bg: 'rgba(255, 255, 255, 0.1)'
        };
    }
  };

  const colors = getColors();

  return (
    <div 
      className="relative p-4 rounded-lg border transition-all duration-500 group cursor-pointer"
      style={{
        backgroundColor: isCompleted ? 'rgba(76, 175, 80, 0.1)' : colors.bg,
        borderColor: isCompleted ? 'rgba(76, 175, 80, 0.4)' : colors.primary,
        boxShadow: isCompleted 
          ? '0 0 15px rgba(76, 175, 80, 0.3), inset 0 0 10px rgba(76, 175, 80, 0.1)'
          : `0 0 10px ${colors.glow}, inset 0 0 8px ${colors.glow}20`,
        fontFamily: 'monospace'
      }}
    >
      {/* Completion Border Glow */}
      {isCompleted && (
        <div 
          className="absolute inset-0 rounded-lg border-2 pointer-events-none"
          style={{
            borderColor: 'rgba(76, 175, 80, 0.6)',
            animation: 'completionGlow 2s ease-in-out infinite'
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center space-x-3 mb-2">
        <div 
          className="text-2xl"
          style={{
            filter: `drop-shadow(0 0 8px ${isCompleted ? 'rgba(76, 175, 80, 0.8)' : colors.glow})`,
            animation: isCompleted ? 'completionPulse 1s ease-in-out infinite' : undefined
          }}
        >
          {isCompleted ? '✅' : getIcon()}
        </div>
        
        <div 
          className="text-sm font-bold tracking-wider uppercase"
          style={{
            color: isCompleted ? 'rgba(76, 175, 80, 1)' : colors.primary,
            textShadow: `0 0 8px ${isCompleted ? 'rgba(76, 175, 80, 0.8)' : colors.glow}`,
            letterSpacing: '1px'
          }}
        >
          {isCompleted ? 'COMPLETED' : 'NEXT ACTION'}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div 
          className="text-sm font-medium"
          style={{
            color: isCompleted ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            textShadow: isCompleted ? '0 0 8px rgba(76, 175, 80, 0.4)' : undefined
          }}
        >
          {action.title}
        </div>
        
        <div 
          className="text-xs opacity-70"
          style={{ color: 'rgba(255, 255, 255, 0.6)' }}
        >
          {action.description}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mt-3">
        <div 
          className="h-1 rounded-full"
          style={{
            backgroundColor: isCompleted ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.1)'
          }}
        >
          <div 
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: isCompleted ? '100%' : '0%',
              background: isCompleted 
                ? 'linear-gradient(90deg, rgba(76, 175, 80, 0.8) 0%, rgba(76, 175, 80, 1) 100%)'
                : `linear-gradient(90deg, ${colors.primary} 0%, ${colors.glow} 100%)`,
              boxShadow: isCompleted 
                ? '0 0 8px rgba(76, 175, 80, 0.6)'
                : `0 0 6px ${colors.glow}`
            }}
          />
        </div>
      </div>

      {/* Hover effect */}
      <div 
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${colors.glow}10 0%, transparent 70%)`,
          animation: 'hoverPulse 2s ease-in-out infinite'
        }}
      />

      <style>{`
        @keyframes completionGlow {
          0%, 100% { 
            box-shadow: 0 0 15px rgba(76, 175, 80, 0.3);
          }
          50% { 
            box-shadow: 0 0 25px rgba(76, 175, 80, 0.6);
          }
        }
        
        @keyframes completionPulse {
          0%, 100% { 
            transform: scale(1);
            filter: drop-shadow(0 0 8px rgba(76, 175, 80, 0.8));
          }
          50% { 
            transform: scale(1.1);
            filter: drop-shadow(0 0 15px rgba(76, 175, 80, 1));
          }
        }
        
        @keyframes hoverPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default NextAction;