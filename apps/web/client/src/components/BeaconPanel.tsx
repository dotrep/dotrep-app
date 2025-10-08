import React from 'react';

interface BeaconPanelProps {
  status: 'locked' | 'warming_up' | 'active';
  pulseScore: number;
  signalScore: number;
  isPulsing: boolean;
}

const BeaconPanel: React.FC<BeaconPanelProps> = ({ 
  status, 
  pulseScore, 
  signalScore, 
  isPulsing 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          title: '🛰️ BEACON ACTIVE',
          description: 'Broadcasting trust globally across FSN',
          backgroundColor: 'rgba(77, 208, 225, 0.15)',
          borderColor: 'rgba(77, 208, 225, 0.4)',
          textColor: 'rgba(77, 208, 225, 1)',
          glowColor: 'rgba(77, 208, 225, 0.6)',
          showAnimation: true
        };
      case 'warming_up':
        return {
          title: '🛰️ BEACON WARMING UP',
          description: 'Continue building trust to achieve full activation',
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          borderColor: 'rgba(255, 193, 7, 0.3)',
          textColor: 'rgba(255, 193, 7, 1)',
          glowColor: 'rgba(255, 193, 7, 0.5)',
          showAnimation: true
        };
      default:
        return {
          title: '🛰️ BEACON CONSOLE',
          description: 'Reach Pulse 70 and Signal 80 to activate global trust transmission',
          backgroundColor: 'rgba(156, 163, 175, 0.1)',
          borderColor: 'rgba(156, 163, 175, 0.2)',
          textColor: 'rgba(156, 163, 175, 0.8)',
          glowColor: 'rgba(156, 163, 175, 0.3)',
          showAnimation: false
        };
    }
  };

  const config = getStatusConfig();

  const pulseRequirement = 70;
  const signalRequirement = 80;
  const pulseProgress = Math.min(100, (pulseScore / pulseRequirement) * 100);
  const signalProgress = Math.min(100, (signalScore / signalRequirement) * 100);

  return (
    <div 
      className="relative p-6 rounded-lg border-2 transition-all duration-800 group"
      style={{ 
        backgroundColor: config.backgroundColor,
        borderColor: config.borderColor,
        boxShadow: isPulsing && config.showAnimation 
          ? `0 0 25px ${config.glowColor}, inset 0 0 20px ${config.glowColor}20`
          : `0 0 12px ${config.glowColor}, inset 0 0 10px ${config.glowColor}15`,
        fontFamily: 'monospace'
      }}
    >
      {/* Header with Radar Display */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div 
            className="text-xl font-bold tracking-wider"
            style={{ 
              color: config.textColor,
              textShadow: config.showAnimation && isPulsing 
                ? `0 0 15px ${config.glowColor}` 
                : `0 0 8px ${config.glowColor}`,
              transition: 'all 0.8s ease',
              letterSpacing: '2px'
            }}
          >
            🛰️ BEACON
          </div>
          
          {/* Radar Display */}
          <div className="relative" style={{ width: '60px', height: '60px' }}>
            <svg width="60" height="60" className="absolute">
              {/* Radar background */}
              <circle
                cx="30"
                cy="30"
                r="25"
                fill="none"
                stroke="rgba(64, 164, 188, 0.2)"
                strokeWidth="1"
              />
              <circle
                cx="30"
                cy="30"
                r="15"
                fill="none"
                stroke="rgba(64, 164, 188, 0.15)"
                strokeWidth="1"
              />
              <line x1="5" y1="30" x2="55" y2="30" stroke="rgba(64, 164, 188, 0.15)" strokeWidth="1" />
              <line x1="30" y1="5" x2="30" y2="55" stroke="rgba(64, 164, 188, 0.15)" strokeWidth="1" />
              
              {/* Beacon indicator */}
              <circle
                cx="30"
                cy="30"
                r="3"
                fill={config.textColor}
                style={{
                  filter: `drop-shadow(0 0 6px ${config.glowColor})`,
                  animation: status === 'active' ? 'beaconActive 1s ease-in-out infinite' 
                    : status === 'warming_up' ? 'beaconWarming 2s ease-in-out infinite'
                    : 'beaconLocked 3s ease-in-out infinite'
                }}
              />
              
              {/* Radar sweep for warming up */}
              {status === 'warming_up' && (
                <line
                  x1="30"
                  y1="30"
                  x2="30"
                  y2="5"
                  stroke={config.textColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{
                    transformOrigin: '30px 30px',
                    animation: 'radarSweep 2s linear infinite',
                    filter: `drop-shadow(0 0 4px ${config.glowColor})`
                  }}
                />
              )}
              
              {/* Active transmission rings */}
              {status === 'active' && (
                <>
                  <circle
                    cx="30"
                    cy="30"
                    r="20"
                    fill="none"
                    stroke={config.textColor}
                    strokeWidth="1"
                    strokeOpacity="0.6"
                    style={{
                      animation: 'transmissionRing1 2s ease-out infinite'
                    }}
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r="15"
                    fill="none"
                    stroke={config.textColor}
                    strokeWidth="1"
                    strokeOpacity="0.4"
                    style={{
                      animation: 'transmissionRing2 2s ease-out infinite 0.5s'
                    }}
                  />
                </>
              )}
            </svg>
          </div>
        </div>
        
        {/* Status indicator */}
        <div className="flex flex-col items-end space-y-2">
          <div 
            className="text-sm font-bold px-3 py-1 rounded border"
            style={{ 
              backgroundColor: `${config.glowColor}20`,
              color: config.textColor,
              border: `1px solid ${config.glowColor}`,
              letterSpacing: '1px',
              animation: status === 'active' ? 'statusLive 1.5s ease-in-out infinite' : undefined
            }}
          >
            {status === 'active' ? 'ONLINE' : status === 'warming_up' ? 'WARMING' : 'OFFLINE'}
          </div>
          
          {status === 'active' && (
            <div 
              className="flex items-center space-x-1 text-xs px-2 py-1 rounded"
              style={{ 
                backgroundColor: 'rgba(77, 208, 225, 0.15)',
                color: 'rgba(77, 208, 225, 1)',
                border: '1px solid rgba(77, 208, 225, 0.3)'
              }}
            >
              <div 
                className="w-2 h-2 rounded-full bg-current"
                style={{ animation: 'liveDot 0.8s ease-in-out infinite' }}
              />
              <span>LIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div 
        className="text-sm mb-4 leading-relaxed"
        style={{ color: 'rgba(255, 255, 255, 0.7)' }}
      >
        {config.description}
      </div>

      {/* Requirements (only show if not active) */}
      {status !== 'active' && (
        <div className="space-y-3">
          <div className="text-xs font-medium mb-2" style={{ color: config.textColor }}>
            ACTIVATION REQUIREMENTS
          </div>
          
          {/* Pulse requirement */}
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Pulse ≥ {pulseRequirement}
            </span>
            <div className="flex items-center space-x-2">
              <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${pulseProgress}%`,
                    backgroundColor: pulseScore >= pulseRequirement ? config.textColor : 'rgba(156, 163, 175, 0.6)'
                  }}
                />
              </div>
              <span 
                className="text-xs font-medium"
                style={{ color: pulseScore >= pulseRequirement ? config.textColor : 'rgba(156, 163, 175, 0.8)' }}
              >
                {pulseScore}/{pulseRequirement}
              </span>
            </div>
          </div>

          {/* Signal requirement */}
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Signal ≥ {signalRequirement}
            </span>
            <div className="flex items-center space-x-2">
              <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${signalProgress}%`,
                    backgroundColor: signalScore >= signalRequirement ? config.textColor : 'rgba(156, 163, 175, 0.6)'
                  }}
                />
              </div>
              <span 
                className="text-xs font-medium"
                style={{ color: signalScore >= signalRequirement ? config.textColor : 'rgba(156, 163, 175, 0.8)' }}
              >
                {signalScore}/{signalRequirement}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Beacon perks (only show if active) */}
      {status === 'active' && (
        <div className="mt-4">
          <div className="text-xs font-medium mb-2" style={{ color: config.textColor }}>
            ACTIVE PERKS
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-1 h-1 rounded-full bg-current" />
              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Global Map Visibility</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1 h-1 rounded-full bg-current" />
              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Airdrop Eligibility</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1 h-1 rounded-full bg-current" />
              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Vault Capacity Boost</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1 h-1 rounded-full bg-current" />
              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Governance Access</span>
            </div>
          </div>
        </div>
      )}

      {/* Lock icon for locked state */}
      {status === 'locked' && (
        <div className="absolute top-4 right-4 opacity-60">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="6" y="10" width="12" height="10" rx="2" stroke={config.textColor} strokeWidth="2"/>
            <path d="M9 10V6a3 3 0 0 1 6 0v4" stroke={config.textColor} strokeWidth="2"/>
          </svg>
        </div>
      )}

      {/* Radar animation for warming up state */}
      {status === 'warming_up' && (
        <div className="absolute top-4 right-4">
          <div className="relative w-8 h-8">
            <div 
              className="absolute inset-0 rounded-full border-2"
              style={{ 
                borderColor: config.textColor,
                animation: 'radar-sweep 2s linear infinite'
              }}
            />
            <div 
              className="absolute inset-1 rounded-full border"
              style={{ 
                borderColor: config.textColor,
                opacity: 0.6,
                animation: 'radar-sweep 2s linear infinite 0.5s'
              }}
            />
            <div 
              className="absolute inset-2 rounded-full border"
              style={{ 
                borderColor: config.textColor,
                opacity: 0.3,
                animation: 'radar-sweep 2s linear infinite 1s'
              }}
            />
          </div>
        </div>
      )}

      {/* Animated background effect for active beacon */}
      {status === 'active' && (
        <>
          <div 
            className="absolute inset-0 rounded-lg opacity-20 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${config.glowColor} 0%, transparent 70%)`,
              animation: 'beacon-pulse 3s ease-in-out infinite'
            }}
          />
          <div className="absolute top-4 right-4">
            <div className="relative w-8 h-8">
              <div 
                className="absolute inset-0 rounded-full"
                style={{ 
                  backgroundColor: config.textColor,
                  animation: 'beacon-online 1s ease-in-out infinite alternate'
                }}
              />
              <div 
                className="absolute inset-1 rounded-full"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  animation: 'beacon-inner 2s ease-in-out infinite'
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* Flicker effect for locked state */}
      {status === 'locked' && (
        <div 
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            background: `linear-gradient(45deg, transparent 48%, ${config.glowColor} 49%, ${config.glowColor} 51%, transparent 52%)`,
            animation: 'locked-flicker 4s ease-in-out infinite',
            opacity: 0.1
          }}
        />
      )}

      {/* Enhanced Tooltip */}
      <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
        <div 
          className="px-4 py-3 rounded-lg text-sm shadow-lg"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            color: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(0, 188, 212, 0.4)',
            backdropFilter: 'blur(12px)',
            maxWidth: '320px'
          }}
        >
          <div className="font-bold text-cyan-400 mb-1">🛰️ BEACON CONSOLE</div>
          <div className="text-xs leading-relaxed">
            Your Beacon activates once Pulse and Signal are strong enough. This unlocks global visibility and access.
            {status === 'locked' && <span className="text-red-400"> Currently offline - dim radar, lock status.</span>}
            {status === 'warming_up' && <span className="text-yellow-400"> Warming up - radar pulses with circular animation.</span>}
            {status === 'active' && <span className="text-green-400"> Online - cyan glow, pulsing ring, global projection active!</span>}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes radarSweep {
          0% { 
            transform: rotate(0deg);
            opacity: 1;
          }
          100% { 
            transform: rotate(360deg);
            opacity: 1;
          }
        }
        
        @keyframes beaconActive {
          0%, 100% { 
            transform: scale(1);
            opacity: 1;
          }
          50% { 
            transform: scale(1.3);
            opacity: 0.8;
          }
        }
        
        @keyframes beaconWarming {
          0%, 100% { 
            opacity: 0.6;
            transform: scale(0.8);
          }
          50% { 
            opacity: 1;
            transform: scale(1.2);
          }
        }
        
        @keyframes beaconLocked {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.1; }
        }
        
        @keyframes transmissionRing1 {
          0% { 
            transform: scale(0.5);
            opacity: 0.8;
          }
          100% { 
            transform: scale(2);
            opacity: 0;
          }
        }
        
        @keyframes transmissionRing2 {
          0% { 
            transform: scale(0.3);
            opacity: 0.6;
          }
          100% { 
            transform: scale(1.8);
            opacity: 0;
          }
        }
        
        @keyframes statusLive {
          0%, 100% { 
            backgroundColor: ${config.glowColor}20;
            borderColor: ${config.glowColor};
          }
          50% { 
            backgroundColor: ${config.glowColor}35;
            borderColor: ${config.textColor};
          }
        }
        
        @keyframes liveDot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        @keyframes beacon-pulse {
          0%, 100% { 
            opacity: 0.15;
            transform: scale(1);
          }
          50% { 
            opacity: 0.3;
            transform: scale(1.02);
          }
        }
        
        @keyframes locked-flicker {
          0%, 90%, 100% { opacity: 0.05; }
          5%, 15% { opacity: 0.15; }
          10% { opacity: 0.1; }
        }
      `}</style>
    </div>
  );
};

export default BeaconPanel;