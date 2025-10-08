import { useState } from 'react';
import { BadgeNFT, getRarityStyle } from '@/lib/badgeSystem';
import BadgeDetailModal from './BadgeDetailModal';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

interface BadgeCardProps {
  badge: BadgeNFT;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  showRarityRing?: boolean;
  isEarned?: boolean;
  isLoading?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
  onEquip?: (badgeId: string) => void;
  showEquipButton?: boolean;
}

export default function BadgeCard({ 
  badge, 
  size = 'medium', 
  showDetails = true,
  showRarityRing = true,
  isEarned = false,
  isLoading = false,
  hasError = false,
  onRetry,
  onEquip,
  showEquipButton = false
}: BadgeCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Check if this badge is equipped
  const isEquipped = localStorage.getItem('equippedBadge') === badge.id;

  const rarityStyle = getRarityStyle(badge.rarity);
  
  const sizeConfig = {
    small: { container: '70px', image: '65px', fontSize: '9px' },
    medium: { container: '85px', image: '80px', fontSize: '10px' },
    large: { container: '95px', image: '90px', fontSize: '11px' }
  };

  const config = sizeConfig[size];

  // Show loading state
  if (isLoading) {
    return (
      <div style={{
        width: config.container,
        height: config.container,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 20, 40, 0.3)',
        borderRadius: '50%',
        border: '1px solid rgba(0, 188, 212, 0.3)'
      }}>
        <LoadingSpinner size="small" />
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div style={{
        width: config.container,
        height: config.container,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(40, 20, 20, 0.3)',
        borderRadius: '50%',
        border: '1px solid rgba(255, 100, 100, 0.3)',
        cursor: onRetry ? 'pointer' : 'default'
      }}
      onClick={onRetry}
      title={onRetry ? 'Click to retry loading badge' : 'Failed to load badge'}
      >
        <div style={{
          color: '#ff6b6b',
          fontSize: '16px',
          marginBottom: onRetry ? '4px' : '0'
        }}>
          ⚠️
        </div>
        {onRetry && (
          <div style={{
            color: '#ff6b6b',
            fontSize: '8px',
            textAlign: 'center'
          }}>
            Retry
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: config.container,
          height: config.container,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          position: 'relative',
          transform: isHovered ? 'scale(1.05) translateY(-2px)' : 'scale(1)'
        }}
      >
        {/* Rarity rings removed to eliminate outer glow circles */}

        {/* Badge icon */}
        <div style={{
          width: config.image,
          height: config.image,
          position: 'relative',
          marginBottom: showDetails ? '16px' : '0'
        }}>
          {/* Main badge circle */}
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: isEquipped 
              ? '3px solid #00f0ff' 
              : showRarityRing 
                ? `3px solid ${rarityStyle.borderColor}` 
                : '3px solid rgba(107, 114, 128, 0.6)',
            boxShadow: isEquipped 
              ? '0 0 30px #00f0ff99, 0 0 60px #00f0ff55, inset 0 0 20px rgba(0,240,255,0.2)'
              : isHovered 
                ? `0 0 35px ${rarityStyle.glowColor}77, 0 0 70px ${rarityStyle.glowColor}44, inset 0 0 20px ${rarityStyle.glowColor}22`
                : `0 0 25px ${rarityStyle.glowColor}55, inset 0 0 15px ${rarityStyle.glowColor}15`,
            filter: isHovered ? 'brightness(1.3) contrast(1.2)' : 'brightness(1.0)',
            transition: 'all 0.4s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `radial-gradient(circle at center, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.7) 100%)`,
            overflow: 'hidden'
          }}>
            <img 
              src={badge.visual}
              alt={badge.name}
              className="badge-icon"
              style={{
                width: `calc(${config.image} - 8px)`,
                height: `calc(${config.image} - 8px)`,
                objectFit: 'contain',
                backgroundColor: 'transparent',
                filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.4))',
                transition: 'all 0.3s ease'
              }}
              onError={(e) => {
                console.log(`Failed to load badge image: ${badge.visual}`);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Badge details */}
        {showDetails && (
          <div style={{
            textAlign: 'center',
            width: '100%',
            padding: '0 4px'
          }}>
            <div 
              className="badge-name"
              style={{
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                fontFamily: 'Orbitron, sans-serif',
                lineHeight: '1.1',
                marginBottom: '2px',
                marginTop: '0.4rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textAlign: 'center',
                maxHeight: '2.4em',
                maxWidth: '100px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                wordBreak: 'break-word'
              }}
              title={badge.name} // Show full name on hover
            >
              {badge.name}
            </div>
            
            {badge.count && badge.count > 1 && (
              <div style={{
                color: '#00ff88',
                fontSize: `calc(${config.fontSize} - 1px)`,
                fontWeight: 'bold'
              }}>
                x{badge.count}
              </div>
            )}
          </div>
        )}

        {/* Equipped indicator */}
        {isEquipped && (
          <div style={{
            position: 'absolute',
            top: '4px',
            left: '4px',
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
            border: '2px solid #00f0ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#000',
            zIndex: 10,
            boxShadow: '0 0 10px #00ff88aa'
          }}>
            ✅
          </div>
        )}

        {/* Rarity indicator */}
        {showRarityRing && badge.rarity !== 'common' && (
          <div style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${rarityStyle.glowColor}88, ${rarityStyle.glowColor}44)`,
            border: `1px solid ${rarityStyle.borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: rarityStyle.borderColor,
              boxShadow: `0 0 4px ${rarityStyle.glowColor}`
            }} />
          </div>
        )}

        {/* Soulbound indicator */}
        {badge.soulbound && (
          <div style={{
            position: 'absolute',
            top: '4px',
            left: '4px',
            fontSize: '12px'
          }}>
            🔒
          </div>
        )}

        {/* XP bonus indicator */}
        {badge.xpBonus > 0 && isHovered && (
          <div style={{
            position: 'absolute',
            bottom: '-24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
            color: '#000000',
            padding: '2px 6px',
            borderRadius: '8px',
            fontSize: '10px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            animation: 'slideUp 0.3s ease'
          }}>
            +{badge.xpBonus} XP
          </div>
        )}

        {/* Date earned (for vault view) */}
        {badge.dateEarned && showDetails && (
          <div style={{
            position: 'absolute',
            bottom: '4px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#9ca3af',
            fontSize: '8px',
            fontWeight: '500',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}>
            {new Date(badge.dateEarned).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
        )}

        {/* Equip Button */}
        {showEquipButton && isEarned && onEquip && (
          <div style={{
            position: 'absolute',
            bottom: '-35px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEquip(badge.id);
              }}
              style={{
                background: isEquipped 
                  ? 'linear-gradient(135deg, #ff4444, #cc0000)'
                  : 'linear-gradient(135deg, #00f0ff, #0099cc)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 8px',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '10px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                letterSpacing: '0.5px',
                fontFamily: 'Orbitron, sans-serif',
                textTransform: 'uppercase',
                boxShadow: isEquipped 
                  ? '0 2px 8px rgba(255, 68, 68, 0.3)'
                  : '0 2px 8px rgba(0, 240, 255, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = isEquipped 
                  ? '0 4px 12px rgba(255, 68, 68, 0.5)'
                  : '0 4px 12px rgba(0, 240, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = isEquipped 
                  ? '0 2px 8px rgba(255, 68, 68, 0.3)'
                  : '0 2px 8px rgba(0, 240, 255, 0.3)';
              }}
            >
              {isEquipped ? 'UNEQUIP' : 'EQUIP'}
            </button>
          </div>
        )}
      </div>

      {/* Badge Detail Modal */}
      <BadgeDetailModal 
        badge={badge}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <style>
        {`
          @keyframes slideUp {
            from { 
              opacity: 0; 
              transform: translateX(-50%) translateY(10px); 
            }
            to { 
              opacity: 1; 
              transform: translateX(-50%) translateY(0); 
            }
          }
        `}
      </style>
    </>
  );
}