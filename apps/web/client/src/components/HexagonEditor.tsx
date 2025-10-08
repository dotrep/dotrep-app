import React, { useState, useEffect } from 'react';

interface HexStyle {
  id: string;
  name: string;
  description: string;
  meaning: string;
  requirements?: string;
  checkRequirement?: (userStats: any) => boolean;
}

interface HexagonEditorProps {
  userId: number;
  currentHexStyle?: string;
  userStats?: {
    isVerified: boolean;
    xp: number;
    activeToday: boolean;
    role: string;
    invited: number;
  };
  onHexStyleChange: (styleId: string) => void;
}

const HEX_STYLES: HexStyle[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Standard FSN hexagon design',
    meaning: 'Default .fsn'
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Bright glowing effects for influencers',
    meaning: 'Influencer',
    requirements: 'XP > 1000 OR Invited > 10',
    checkRequirement: (stats) => stats.xp > 1000 || stats.invited > 10
  },
  {
    id: 'pulse',
    name: 'Pulse',
    description: 'Rhythmic glow for verified active users',
    meaning: 'Verified + Active',
    requirements: 'Verified AND Active Today',
    checkRequirement: (stats) => stats.isVerified && stats.activeToday
  },
  {
    id: 'matrix',
    name: 'Matrix',
    description: 'Digital rain effect for moderators',
    meaning: 'Mod/Admin',
    requirements: 'Admin or Moderator role',
    checkRequirement: (stats) => stats.role === 'admin' || stats.role === 'mod'
  }
];

export default function HexagonEditor({ 
  userId, 
  currentHexStyle, 
  userStats, 
  onHexStyleChange 
}: HexagonEditorProps) {
  const [selectedStyle, setSelectedStyle] = useState(currentHexStyle || 'classic');

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId);
    onHexStyleChange(styleId);
    
    // Apply CSS class to body for global hex styling
    document.body.className = document.body.className
      .replace(/hex-\w+/g, '')
      .trim();
    document.body.classList.add(`hex-${styleId}`);
  };

  const isStyleAvailable = (style: HexStyle): boolean => {
    if (!style.checkRequirement || !userStats) return true;
    return style.checkRequirement(userStats);
  };

  const renderHexagonPreview = (style: HexStyle) => {
    const isSelected = selectedStyle === style.id;
    const isAvailable = isStyleAvailable(style);
    
    return (
      <div
        key={style.id}
        onClick={() => isAvailable && handleStyleSelect(style.id)}
        style={{
          padding: '20px',
          borderRadius: '12px',
          border: isSelected 
            ? '2px solid #00faff' 
            : '1px solid rgba(100, 255, 255, 0.2)',
          backgroundColor: isSelected 
            ? 'rgba(0, 250, 255, 0.1)' 
            : 'rgba(0, 0, 0, 0.3)',
          cursor: isAvailable ? 'pointer' : 'not-allowed',
          opacity: isAvailable ? 1 : 0.5,
          textAlign: 'center',
          transition: 'all 0.3s ease',
          filter: isSelected ? 'drop-shadow(0 0 12px #00faff)' : 'none'
        }}
      >
        {/* Hexagon Preview */}
        <div style={{
          width: '60px',
          height: '60px',
          margin: '0 auto 16px',
          position: 'relative'
        }}>
          <svg 
            width="60" 
            height="60" 
            viewBox="0 0 60 60"
            className={`hex-preview hex-${style.id}`}
          >
            <polygon
              points="30,5 50,17.5 50,42.5 30,55 10,42.5 10,17.5"
              fill="rgba(0, 250, 255, 0.1)"
              stroke={getHexColor(style.id)}
              strokeWidth="2"
              className={`hex-shape-${style.id}`}
            />
            <text
              x="30"
              y="35"
              textAnchor="middle"
              fill={getHexColor(style.id)}
              fontSize="8"
              fontWeight="bold"
            >
              .fsn
            </text>
          </svg>
        </div>
        
        <div style={{
          color: '#ffffff',
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '4px'
        }}>
          {style.name}
        </div>
        
        <div style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '12px',
          marginBottom: '8px'
        }}>
          {style.meaning}
        </div>
        
        <div style={{
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '11px',
          marginBottom: style.requirements ? '8px' : '0'
        }}>
          {style.description}
        </div>
        
        {style.requirements && (
          <div style={{
            color: isAvailable ? '#72f1b8' : '#f87171',
            fontSize: '10px',
            fontStyle: 'italic',
            padding: '4px 8px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px'
          }}>
            {style.requirements}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(100, 255, 255, 0.3)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <h3 style={{
        color: '#64ffff',
        margin: '0 0 16px 0',
        fontSize: '18px',
        fontWeight: '600'
      }}>
        Hexagon Style Editor
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '16px'
      }}>
        {HEX_STYLES.map(renderHexagonPreview)}
      </div>
      
      <style>{`
        .hex-shape-classic {
          stroke: #64ffff;
        }
        
        .hex-shape-neon {
          stroke: #ff00ff;
          filter: drop-shadow(0 0 8px #ff00ff);
          animation: neonGlow 2s infinite ease-in-out;
        }
        
        .hex-shape-pulse {
          stroke: #00faff;
          animation: pulseHex 2s infinite ease-in-out;
        }
        
        .hex-shape-matrix {
          stroke: #00ff00;
          filter: drop-shadow(0 0 6px #00ff00);
          animation: matrixFlicker 1.5s infinite;
        }
        
        @keyframes neonGlow {
          0%, 100% { 
            filter: drop-shadow(0 0 8px #ff00ff);
          }
          50% { 
            filter: drop-shadow(0 0 16px #ff00ff) drop-shadow(0 0 24px #ff00ff);
          }
        }
        
        @keyframes pulseHex {
          0%, 100% { 
            stroke-width: 2;
            filter: drop-shadow(0 0 5px #00faff);
          }
          50% { 
            stroke-width: 3;
            filter: drop-shadow(0 0 12px #00faff) drop-shadow(0 0 20px #00faff);
          }
        }
        
        @keyframes matrixFlicker {
          0%, 100% { opacity: 1; }
          10%, 30%, 50%, 70%, 90% { opacity: 0.8; }
          20%, 40%, 60%, 80% { opacity: 1; }
        }
        
        /* Global hex styles applied to body */
        .hex-classic .fsn-hexagon {
          border-color: #64ffff;
        }
        
        .hex-neon .fsn-hexagon {
          border-color: #ff00ff;
          box-shadow: 0 0 12px #ff00ff;
          animation: glowHex 2s infinite;
        }
        
        .hex-pulse .fsn-hexagon {
          border: 2px solid #00faff;
          animation: glowHex 2s infinite;
        }
        
        .hex-matrix .fsn-hexagon {
          border-color: #00ff00;
          box-shadow: 0 0 8px #00ff00;
          animation: matrixHex 1.5s infinite;
        }
        
        @keyframes glowHex {
          0%, 100% { box-shadow: 0 0 5px currentColor; }
          50% { box-shadow: 0 0 12px currentColor, 0 0 20px currentColor; }
        }
        
        @keyframes matrixHex {
          0%, 100% { opacity: 1; }
          10%, 30%, 50%, 70%, 90% { opacity: 0.9; }
          20%, 40%, 60%, 80% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function getHexColor(styleId: string): string {
  switch (styleId) {
    case 'classic': return '#64ffff';
    case 'neon': return '#ff00ff';
    case 'pulse': return '#00faff';
    case 'matrix': return '#00ff00';
    default: return '#64ffff';
  }
}