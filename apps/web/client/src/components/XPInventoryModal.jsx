import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useShop } from '../context/ShopContext';

const XPInventoryModal = ({ isOpen, onClose }) => {
  const { purchasedItems, getCosmeticEffects } = useShop();
  const [equippedItems, setEquippedItems] = useState(() => {
    const saved = localStorage.getItem('fsn_equipped_items');
    return saved ? JSON.parse(saved) : {};
  });

  // Default purchased items - ensure user has basic items available
  const defaultPurchasedItems = [1, 2, 3]; // Vault Neon Frame, Signal Cast Particle Trail, Rare Beacon Badge
  const allPurchasedItems = [...new Set([...purchasedItems, ...defaultPurchasedItems])];

  // Fetch current XP balance
  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats'],
    retry: false,
  });

  const currentXP = userStats?.xpPoints || 0;

  // All available inventory items (matches XP Shop items)
  const inventoryItems = [
    { 
      id: 1, 
      name: 'Vault Neon Frame', 
      category: 'Cosmetic Frame',
      icon: '🖼️',
      description: 'Glowing cyan border around Vault DATA PANEL',
      effect: 'vaultNeonFrame'
    },
    { 
      id: 2, 
      name: 'Signal Cast Particle Trail', 
      category: 'Signal Effect',
      icon: '✨',
      description: 'Animated particles during signal broadcasting',
      effect: 'signalParticleTrail'
    },
    { 
      id: 3, 
      name: 'Rare Beacon Badge', 
      category: 'Vault Badge',
      icon: '🏆',
      description: 'Exclusive golden badge for your profile',
      effect: 'rareBeaconBadge'
    },
    { 
      id: 4, 
      name: 'XP Booster', 
      category: 'Temporary Boost',
      icon: '⚡',
      description: 'Double XP gains for 24 hours',
      effect: 'xpBooster'
    },
    { 
      id: 5, 
      name: 'Pulse Enhancement', 
      category: 'Cosmetic Frame',
      icon: '💓',
      description: 'Enhanced glow effects for Pulse gauge',
      effect: 'pulseEnhancement'
    },
    { 
      id: 6, 
      name: 'Custom Signal Theme', 
      category: 'Signal Effect',
      icon: '🎵',
      description: 'Premium signal frequencies and themes',
      effect: 'customSignalTheme'
    },
    { 
      id: 7, 
      name: 'Beacon Upgrade', 
      category: 'Signal Effect',
      icon: '📡',
      description: 'Advanced beacon transmission effects',
      effect: 'beaconUpgrade'
    },
    { 
      id: 8, 
      name: 'Vault Security', 
      category: 'Vault Badge',
      icon: '🔒',
      description: 'Premium security indicators for vault',
      effect: 'vaultSecurity'
    }
  ];

  // Group items by category
  const categorizedItems = inventoryItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  // Handle equipping/unequipping items
  const handleEquipToggle = (item) => {
    const category = item.category;
    const isEquipped = equippedItems[category] === item.id;
    
    let newEquipped = { ...equippedItems };
    
    if (isEquipped) {
      // Unequip
      delete newEquipped[category];
    } else {
      // Equip (unequip any other item in same category)
      newEquipped[category] = item.id;
    }
    
    setEquippedItems(newEquipped);
    localStorage.setItem('fsn_equipped_items', JSON.stringify(newEquipped));
    
    console.log(`${isEquipped ? 'Unequipped' : 'Equipped'} ${item.name}`);
  };

  // Get equipped item names for display
  const getEquippedLoadout = () => {
    return Object.entries(equippedItems)
      .map(([category, itemId]) => {
        const item = inventoryItems.find(i => i.id === itemId);
        return item ? item.name : null;
      })
      .filter(Boolean)
      .join(' + ') || 'None';
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 4000,
      backdropFilter: 'blur(12px)',
      animation: 'fadeIn 0.3s ease-in-out'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes inventoryPulse {
          0%, 100% { box-shadow: 0 0 15px rgba(0, 240, 255, 0.3); }
          50% { box-shadow: 0 0 25px rgba(0, 240, 255, 0.6); }
        }
        
        .inventory-item {
          transition: all 0.3s ease;
        }
        
        .inventory-item:hover {
          transform: translateY(-2px);
        }
        
        .equipped-item {
          animation: inventoryPulse 2s ease-in-out infinite;
        }
      `}</style>

      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 20, 40, 0.9) 100%)',
        border: '2px solid rgba(0, 240, 255, 0.5)',
        borderRadius: '20px',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'hidden',
        fontFamily: 'Orbitron, sans-serif',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.1) 0%, rgba(0, 100, 120, 0.1) 100%)',
          padding: '25px 30px',
          borderBottom: '1px solid rgba(0, 240, 255, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: '700',
              color: '#00f0ff',
              textShadow: '0 0 15px rgba(0, 240, 255, 0.5)',
              letterSpacing: '1px'
            }}>
              XP INVENTORY
            </h2>
            <div style={{
              fontSize: '16px',
              color: 'rgba(0, 240, 255, 0.8)',
              marginTop: '8px',
              letterSpacing: '0.5px'
            }}>
              XP BALANCE: {currentXP} XP | EQUIPPED: {getEquippedLoadout()}
            </div>
          </div>
          
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#00f0ff',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              fontSize: '24px',
              lineHeight: 1
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '30px',
          maxHeight: '600px',
          overflowY: 'auto'
        }}>
          {Object.entries(categorizedItems).map(([category, items]) => (
            <div key={category} style={{ marginBottom: '40px' }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#00bcd4',
                marginBottom: '20px',
                letterSpacing: '1px',
                textShadow: '0 0 10px rgba(0, 188, 212, 0.5)'
              }}>
                {category.toUpperCase()}
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '15px'
              }}>
                {items.map((item) => {
                  const isPurchased = allPurchasedItems.includes(item.id);
                  const isEquipped = equippedItems[item.category] === item.id;
                  
                  return (
                    <div
                      key={item.id}
                      className={`inventory-item ${isEquipped ? 'equipped-item' : ''}`}
                      style={{
                        background: isPurchased 
                          ? isEquipped
                            ? 'linear-gradient(135deg, rgba(0, 255, 0, 0.15) 0%, rgba(0, 200, 0, 0.1) 100%)'
                            : 'linear-gradient(135deg, rgba(0, 240, 255, 0.1) 0%, rgba(0, 120, 140, 0.05) 100%)'
                          : 'linear-gradient(135deg, rgba(80, 80, 80, 0.3) 0%, rgba(40, 40, 40, 0.2) 100%)',
                        border: isPurchased 
                          ? isEquipped
                            ? '2px solid #00ff00'
                            : '2px solid rgba(0, 240, 255, 0.5)'
                          : '2px solid rgba(128, 128, 128, 0.3)',
                        borderRadius: '12px',
                        padding: '20px',
                        opacity: isPurchased ? 1 : 0.5,
                        position: 'relative'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '12px'
                      }}>
                        <span style={{ fontSize: '24px', marginRight: '12px' }}>
                          {item.icon}
                        </span>
                        <div>
                          <h4 style={{
                            margin: 0,
                            fontSize: '16px',
                            fontWeight: '600',
                            color: isPurchased ? '#00f0ff' : '#888',
                            letterSpacing: '0.5px'
                          }}>
                            {item.name}
                          </h4>
                          <div style={{
                            fontSize: '12px',
                            color: isPurchased ? 'rgba(0, 240, 255, 0.7)' : '#666',
                            marginTop: '4px'
                          }}>
                            {item.description}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: isPurchased 
                            ? isEquipped 
                              ? '#00ff00' 
                              : '#00bcd4'
                            : '#666',
                          letterSpacing: '0.5px'
                        }}>
                          {!isPurchased ? 'LOCKED' : isEquipped ? 'EQUIPPED' : 'UNEQUIPPED'}
                        </div>
                        
                        {isPurchased && (
                          <button
                            onClick={() => handleEquipToggle(item)}
                            style={{
                              background: isEquipped 
                                ? 'linear-gradient(135deg, #ff4444, #cc0000)'
                                : 'linear-gradient(135deg, #00f0ff, #0099cc)',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 16px',
                              color: 'white',
                              fontWeight: '600',
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              letterSpacing: '0.5px',
                              fontFamily: 'Orbitron, sans-serif'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.05)';
                              e.currentTarget.style.boxShadow = isEquipped 
                                ? '0 0 15px rgba(255, 68, 68, 0.5)'
                                : '0 0 15px rgba(0, 240, 255, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            {isEquipped ? 'UNEQUIP' : 'EQUIP'}
                          </button>
                        )}
                      </div>
                      
                      {!isPurchased && (
                        <div style={{
                          position: 'absolute',
                          top: '15px',
                          right: '15px',
                          background: 'rgba(128, 128, 128, 0.8)',
                          borderRadius: '12px',
                          padding: '4px 8px',
                          fontSize: '10px',
                          color: 'white',
                          fontWeight: '600',
                          letterSpacing: '0.5px'
                        }}>
                          LOCKED
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default XPInventoryModal;