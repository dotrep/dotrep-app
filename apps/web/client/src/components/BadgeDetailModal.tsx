import { useState } from 'react';
import { X, Calendar, Award, Star, Share2, ExternalLink } from 'lucide-react';
import { BadgeNFT, getRarityStyle } from '@/lib/badgeSystem';
import { useXP } from '@/context/XPContext';

interface BadgeDetailModalProps {
  badge: BadgeNFT;
  isOpen: boolean;
  onClose: () => void;
}

export default function BadgeDetailModal({ badge, isOpen, onClose }: BadgeDetailModalProps) {
  const { addXP } = useXP();
  const [isEquipped, setIsEquipped] = useState(() => {
    // Check localStorage for equipped badge
    const equippedBadge = localStorage.getItem('equippedBadge');
    return equippedBadge === badge.id;
  });
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  const [showEquipSuccess, setShowEquipSuccess] = useState(false);

  if (!isOpen) return null;

  const rarityStyle = getRarityStyle(badge.rarity);

  const handleEquipBadge = () => {
    if (!isEquipped) {
      // Save to localStorage
      localStorage.setItem('equippedBadge', badge.id);
      setIsEquipped(true);
      addXP(5); // Small XP reward for badge interaction
      
      // Show success message
      setShowEquipSuccess(true);
      setTimeout(() => setShowEquipSuccess(false), 2000);
    }
  };

  const handleShareBadge = async () => {
    const shareText = `🎖️ Just earned the "${badge.name}" badge on FSN! ${badge.description}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `FSN Badge: ${badge.name}`,
          text: shareText,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        setShowShareSuccess(true);
        setTimeout(() => setShowShareSuccess(false), 2000);
      } catch (err) {
        console.log('Copy failed');
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(8px)'
    }}
    onClick={onClose}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)',
        border: `2px solid ${rarityStyle.borderColor}`,
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '500px',
        width: '90%',
        position: 'relative',
        boxShadow: `0 20px 40px rgba(0, 0, 0, 0.5), 0 0 30px ${rarityStyle.glowColor}33`,
        animation: rarityStyle.animation
      }}
      onClick={(e) => e.stopPropagation()}>
        
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.color = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#9ca3af';
          }}
        >
          <X size={24} />
        </button>

        {/* Badge Icon with Rarity Rings */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <div style={{
            position: 'relative',
            width: '120px',
            height: '120px'
          }}>
            {/* Rarity rings */}
            {Array.from({ length: rarityStyle.ringCount }).map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                top: `-${8 + i * 4}px`,
                left: `-${8 + i * 4}px`,
                right: `-${8 + i * 4}px`,
                bottom: `-${8 + i * 4}px`,
                border: `2px solid ${rarityStyle.glowColor}`,
                borderRadius: '50%',
                opacity: 0.3 - i * 0.1,
                animation: `pulse ${3 + i}s infinite`
              }} />
            ))}
            
            {/* Main badge */}
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(5, 15, 25, 0.95) 0%, rgba(0, 8, 16, 0.98) 100%)',
              border: `3px solid ${rarityStyle.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 30px ${rarityStyle.glowColor}66, 0 0 60px ${rarityStyle.glowColor}33`,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <img 
                src={badge.visual}
                alt={badge.name}
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'contain',
                  filter: 'brightness(1.1) contrast(1.1)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Badge Info */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <h2 style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#ffffff',
              margin: 0
            }}>
              {badge.name}
            </h2>
            <div style={{
              background: `linear-gradient(135deg, ${rarityStyle.glowColor}22, ${rarityStyle.glowColor}44)`,
              border: `1px solid ${rarityStyle.borderColor}`,
              color: rarityStyle.borderColor,
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Star size={12} fill={rarityStyle.borderColor} />
              {badge.rarity}
            </div>
          </div>
          
          <p style={{
            color: '#d1d5db',
            fontSize: '16px',
            lineHeight: '1.5',
            margin: '0 0 16px 0'
          }}>
            {badge.description}
          </p>
        </div>

        {/* Badge Details Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(107, 114, 128, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px'
            }}>
              <Award size={16} color="#00f0ff" />
              <span style={{
                color: '#00f0ff',
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                Source
              </span>
            </div>
            <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500' }}>
              {badge.earnedFrom}
            </span>
          </div>

          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(107, 114, 128, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px'
            }}>
              <Star size={16} color="#00ff88" />
              <span style={{
                color: '#00ff88',
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                XP Bonus
              </span>
            </div>
            <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500' }}>
              +{badge.xpBonus} XP
            </span>
          </div>

          {badge.dateEarned && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(107, 114, 128, 0.3)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px'
              }}>
                <Calendar size={16} color="#a855f7" />
                <span style={{
                  color: '#a855f7',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  Earned
                </span>
              </div>
              <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500' }}>
                {new Date(badge.dateEarned).toLocaleDateString()}
              </span>
            </div>
          )}

          {badge.unlockCondition && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(107, 114, 128, 0.3)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px'
              }}>
                <ExternalLink size={16} color="#f59e0b" />
                <span style={{
                  color: '#f59e0b',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  Requirement
                </span>
              </div>
              <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500' }}>
                {badge.unlockCondition}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center'
        }}>
          <button
            onClick={handleEquipBadge}
            disabled={isEquipped}
            style={{
              background: isEquipped 
                ? 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)'
                : 'linear-gradient(135deg, rgba(0, 188, 212, 0.8) 0%, rgba(0, 150, 169, 0.8) 100%)',
              border: 'none',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: isEquipped ? 'default' : 'pointer',
              pointerEvents: isEquipped ? 'none' : 'auto',
              transition: 'all 0.3s ease',
              fontFamily: 'Orbitron, sans-serif',
              opacity: isEquipped ? 0.8 : 1
            }}
            onMouseEnter={(e) => {
              if (!isEquipped) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 188, 212, 0.4), 0 0 15px #00f0ff66';
              }
            }}
            onMouseLeave={(e) => {
              if (!isEquipped) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {isEquipped ? 'Equipped ✅' : 'Equip Badge'}
          </button>

          <button
            onClick={handleShareBadge}
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.8) 0%, rgba(124, 58, 237, 0.8) 100%)',
              border: 'none',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: 'Orbitron, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(168, 85, 247, 0.4), 0 0 15px rgba(168, 85, 247, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Share2 size={16} />
            Share
          </button>
        </div>

        {/* Share Success Message */}
        {showShareSuccess && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
            color: '#000000',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 'bold',
            animation: 'fadeIn 0.3s ease'
          }}>
            Badge info copied to clipboard!
          </div>
        )}

        {/* Equip Success Message */}
        {showEquipSuccess && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
            color: '#000000',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 'bold',
            animation: 'fadeIn 0.3s ease'
          }}>
            Badge equipped to profile!
          </div>
        )}

        {/* Soulbound indicator */}
        {badge.soulbound && (
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #ef4444',
            color: '#ef4444',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}>
            🔒 Soulbound
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateX(-50%) translateY(10px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
        `}
      </style>
    </div>
  );
}