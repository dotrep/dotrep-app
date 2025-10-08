import React from 'react';
import { Lock, Star, Zap } from 'lucide-react';

const BadgeCard = ({ 
  title, 
  earned, 
  icon, 
  soulbound = true, 
  equipped = false, 
  xpBonus = 0, 
  rarity = 'common',
  type = 'badge',
  onClick,
  onEquip,
  showActions = true,
  size = 'medium'
}) => {
  
  console.log('🃏 BadgeCard render:', { 
    title, 
    earned, 
    equipped, 
    showActions, 
    hasOnEquip: !!onEquip,
    onEquipType: typeof onEquip,
    canEquip: earned && !equipped && !!onEquip
  });
  
  const getRarityColor = (rarity) => {
    switch(rarity) {
      case 'common': return '#00bcd4';
      case 'uncommon': return '#9c27b0';
      case 'rare': return '#ffd700';
      case 'legendary': return '#ffffff';
      default: return '#00bcd4';
    }
  };

  const getSizeClass = (size) => {
    switch(size) {
      case 'small': return 'w-16 h-16';
      case 'medium': return 'w-20 h-20';
      case 'large': return 'w-24 h-24';
      default: return 'w-20 h-20';
    }
  };

  const rarityColor = getRarityColor(rarity);

  return (
    <div 
      className={`badge-card relative ${earned ? 'earned' : 'locked'} ${equipped ? 'equipped' : ''}`}
      onClick={(e) => {
        // Don't trigger card click when EQUIP button is present
        if (!onEquip || equipped || !earned) {
          onClick && onClick(e);
        }
      }}
      style={{
        background: 'rgba(0, 20, 40, 0.9)',
        border: `2px solid ${earned ? rarityColor : '#444444'}`,
        borderRadius: '12px',
        padding: '12px',
        textAlign: 'center',
        fontFamily: 'Orbitron, sans-serif',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        opacity: earned ? 1 : 0.6,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Equipped Glow Ring */}
      {equipped && earned && (
        <div 
          style={{
            position: 'absolute',
            top: '-2px',
            left: '-2px',
            right: '-2px',
            bottom: '-2px',
            border: '2px solid #ffd700',
            borderRadius: '14px',
            boxShadow: '0 0 15px rgba(255, 215, 0, 0.8), inset 0 0 15px rgba(255, 215, 0, 0.2)',
            animation: 'pulseGlow 2s ease-in-out infinite',
            pointerEvents: 'none'
          }}
        />
      )}
      
      {/* Badge Icon */}
      <div className={`badge-icon ${getSizeClass(size)} mx-auto mb-2 relative`}>
        {icon}
      </div>
      
      {/* Badge Title */}
      <div 
        style={{
          color: earned ? '#ffffff' : '#888888',
          fontSize: '11px',
          fontWeight: 'bold',
          marginBottom: '4px',
          textShadow: earned ? `0 0 8px ${rarityColor}` : 'none',
          lineHeight: '1.2'
        }}
      >
        {title}
      </div>
      
      {/* Tags Row */}
      <div className="flex flex-wrap justify-center gap-1 mb-2">
        {/* Soulbound Tag */}
        {soulbound && earned && (
          <span 
            style={{
              background: 'rgba(156, 39, 176, 0.3)',
              color: '#e1bee7',
              fontSize: '8px',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid rgba(156, 39, 176, 0.6)',
              textTransform: 'uppercase',
              fontWeight: 'bold'
            }}
          >
            SOULBOUND
          </span>
        )}
        
        {/* XP Bonus Tag */}
        {xpBonus > 0 && earned && (
          <span 
            style={{
              background: 'rgba(255, 215, 0, 0.2)',
              color: '#ffd700',
              fontSize: '8px',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid rgba(255, 215, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}
          >
            <Zap size={8} />
            +{xpBonus} XP
          </span>
        )}
        
        {/* Equipped Tag */}
        {equipped && earned && (
          <span 
            style={{
              background: 'rgba(255, 215, 0, 0.3)',
              color: '#ffd700',
              fontSize: '8px',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid #ffd700',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              textShadow: '0 0 8px rgba(255, 215, 0, 0.8)'
            }}
          >
            EQUIPPED
          </span>
        )}
      </div>
      
      {/* Action Button */}
      {showActions && earned && !equipped && onEquip && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log('🔥 EQUIP BUTTON CLICKED!', { 
              title, 
              earned, 
              equipped, 
              showActions,
              onEquip: typeof onEquip 
            });
            try {
              onEquip();
              console.log('✅ onEquip() executed successfully');
            } catch (error) {
              console.error('❌ Error executing onEquip:', error);
            }
          }}
          onMouseDown={(e) => {
            console.log('🖱️ Mouse down on EQUIP button', title);
            e.stopPropagation();
          }}
          style={{
            background: 'rgba(0, 188, 212, 0.3)',
            color: '#00f0ff',
            border: '2px solid #00f0ff',
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textTransform: 'uppercase',
            zIndex: 100,
            position: 'relative',
            minHeight: '28px',
            minWidth: '60px',
            boxShadow: '0 0 8px rgba(0, 240, 255, 0.4)',
            userSelect: 'none'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(0, 240, 255, 0.6)';
            e.target.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.8)';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(0, 188, 212, 0.3)';
            e.target.style.boxShadow = '0 0 8px rgba(0, 240, 255, 0.4)';
            e.target.style.transform = 'scale(1)';
          }}
        >
          EQUIP
        </button>
      )}
      
      {/* Lock Overlay */}
      {!earned && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.75)',
            color: '#666666',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '16px',
            borderRadius: '10px'
          }}
        >
          <Lock size={20} />
          <span style={{ fontSize: '8px', marginTop: '4px', textTransform: 'uppercase' }}>
            LOCKED
          </span>
        </div>
      )}
      
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { 
            opacity: 0.8; 
            transform: scale(1);
          }
          50% { 
            opacity: 1; 
            transform: scale(1.02);
          }
        }
        
        .badge-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 188, 212, 0.3);
        }
        
        .badge-card.locked:hover {
          transform: none;
          box-shadow: none;
        }
      `}</style>
    </div>
  );
};

export default BadgeCard;