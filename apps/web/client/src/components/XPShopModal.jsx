import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useXP } from '../context/XPContext';
import { useShop } from '../context/ShopContext';
import XPInventoryModal from './XPInventoryModal';

const XPShopModal = ({ isOpen, onClose }) => {
  const { addXP } = useXP();
  const queryClient = useQueryClient();
  const { purchasedItems, updatePurchasedItems, isItemPurchased } = useShop();
  const [showInventory, setShowInventory] = useState(false);
  
  // Fetch real XP data from API
  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats'],
    retry: false,
  });
  
  const currentXP = userStats?.xpPoints || 0;
  const [animatingPurchase, setAnimatingPurchase] = useState(null);
  
  console.log('Current purchased items state:', purchasedItems);

  // No longer needed - handled by ShopContext

  // Shop items data
  const shopItems = [
    { 
      id: 1, 
      name: "Vault Neon Frame", 
      cost: 150, 
      type: "cosmetic",
      icon: "🔮",
      description: "Add glowing cyan borders to your vault interface"
    },
    { 
      id: 2, 
      name: "Signal Cast Particle Trail", 
      cost: 200, 
      type: "effect",
      icon: "⚡",
      description: "Visual particle effects when casting signals"
    },
    { 
      id: 3, 
      name: "Rare Beacon Badge", 
      cost: 350, 
      type: "badge",
      icon: "🏆",
      description: "Exclusive golden beacon status indicator"
    },
    { 
      id: 4, 
      name: "XP Booster (1hr)", 
      cost: 250, 
      type: "temporary",
      icon: "⚡",
      description: "Double XP gains for 1 hour"
    },
    { 
      id: 5, 
      name: "Pulse Enhancement", 
      cost: 180, 
      type: "effect",
      icon: "💓",
      description: "Enhanced pulse animations with rainbow glow"
    },
    { 
      id: 6, 
      name: "Elite Archetype Badge", 
      cost: 500, 
      type: "badge",
      icon: "👑",
      description: "Premium archetype status with special effects"
    },
    { 
      id: 7, 
      name: "Signal Frequency Pack", 
      cost: 120, 
      type: "cosmetic",
      icon: "📡",
      description: "Unlock premium frequency ranges"
    },
    { 
      id: 8, 
      name: "Vault Security Upgrade", 
      cost: 300, 
      type: "functional",
      icon: "🛡️",
      description: "Enhanced vault encryption and security features"
    }
  ];

  const handlePurchase = async (item) => {
    console.log('=== PURCHASE ATTEMPT ===');
    console.log('Item:', item);
    console.log('Current XP:', currentXP);
    console.log('Item cost:', item.cost);
    console.log('Already purchased:', isItemPurchased(item.id));
    console.log('Purchased items array:', purchasedItems);
    console.log('Currently animating:', animatingPurchase);

    if (!currentXP || currentXP < item.cost || isItemPurchased(item.id) || animatingPurchase) {
      console.log('Purchase blocked - conditions not met');
      return;
    }

    // Start purchase animation
    console.log('Starting purchase animation for item:', item.id);
    setAnimatingPurchase(item.id);

    try {
      // Deduct XP from API
      const userId = 7; // Hardcoded for now
      console.log('Making API call to deduct XP...');
      const response = await apiRequest('POST', '/api/user/addXP', { 
        userId, 
        xpAmount: -item.cost, 
        activity: `Purchased ${item.name}` 
      });
      
      const responseData = await response.json();
      console.log('API Response:', responseData);
      
      if (responseData?.success) {
        // Add item to purchased list
        const newPurchased = [...purchasedItems, item.id];
        console.log('Adding item to purchased list:', item.id, 'New list:', newPurchased);
        updatePurchasedItems(newPurchased);
        
        // Invalidate and refetch user stats to update XP display
        await queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
        
        console.log('Purchase completed successfully!');
        console.log('XP deducted:', item.cost);
        console.log('New XP total:', responseData.newXpTotal);
        console.log('Item unlocked:', item.name);
      } else {
        console.error('Purchase failed - API returned unsuccessful response:', responseData);
      }
    } catch (error) {
      console.error('Purchase failed with error:', error);
    } finally {
      // End animation after 1 second
      setTimeout(() => {
        console.log('Ending purchase animation');
        setAnimatingPurchase(null);
      }, 1000);
    }
  };

  const canAfford = (cost) => currentXP && currentXP >= cost;

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 3000,
      backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.3s ease-in-out'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 240, 255, 0.3); }
          50% { box-shadow: 0 0 40px rgba(0, 240, 255, 0.6); }
        }
        
        @keyframes purchaseSuccess {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        .shop-item {
          animation: pulseGlow 3s ease-in-out infinite;
        }
        
        .purchasing {
          animation: purchaseSuccess 1s ease-in-out;
        }
      `}</style>
      
      <div style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        border: '2px solid #00f0ff',
        borderRadius: '20px',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '85vh',
        overflow: 'hidden',
        boxShadow: '0 25px 80px rgba(0, 240, 255, 0.4)',
        fontFamily: 'Orbitron, sans-serif',
        position: 'relative',
        animation: 'fadeIn 0.3s ease-in-out'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '25px 30px',
          borderBottom: '1px solid #00f0ff',
          background: 'rgba(0, 240, 255, 0.05)'
        }}>
          <div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#00f0ff',
              margin: '0 0 5px 0',
              textShadow: '0 0 20px rgba(0, 240, 255, 0.5)'
            }}>
              XP SHOP
            </h2>
            <p style={{
              fontSize: '14px',
              color: 'rgba(0, 240, 255, 0.8)',
              margin: 0
            }}>
              Spend your XP to unlock exclusive visual upgrades
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            {/* XP Balance */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 20px',
              background: 'rgba(0, 0, 0, 0.6)',
              border: '2px solid #00f0ff',
              borderRadius: '12px',
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                fontSize: '24px'
              }}>
                💠
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#00f0ff',
                textShadow: '0 0 15px rgba(0, 240, 255, 0.6)'
              }}>
                {(currentXP || 0).toLocaleString()} XP
              </div>
            </div>
            
            {/* View Inventory Button */}
            <button
              onClick={() => setShowInventory(true)}
              style={{
                background: 'linear-gradient(135deg, #ff8c00, #ff6600)',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 16px',
                color: 'white',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                letterSpacing: '0.5px',
                fontFamily: 'Orbitron, sans-serif',
                marginRight: '10px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 140, 0, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              VIEW INVENTORY
            </button>

            {/* Close Button */}
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
        </div>

        {/* Shop Items Grid */}
        <div style={{
          padding: '30px',
          maxHeight: '500px',
          overflowY: 'auto'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {shopItems.map((item) => {
              const purchased = isItemPurchased(item.id);
              const affordable = canAfford(item.cost);
              const purchasing = animatingPurchase === item.id;
              
              return (
                <div 
                  key={item.id}
                  className={`shop-item ${purchasing ? 'purchasing' : ''}`}
                  style={{
                    background: purchased 
                      ? 'linear-gradient(135deg, rgba(0, 255, 0, 0.1) 0%, rgba(0, 200, 0, 0.05) 100%)'
                      : 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 20, 40, 0.6) 100%)',
                    border: purchased 
                      ? '2px solid #00ff00' 
                      : affordable 
                        ? '2px solid rgba(0, 240, 255, 0.5)' 
                        : '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '15px',
                    padding: '20px',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    opacity: purchased ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!purchased && affordable) {
                      e.currentTarget.style.borderColor = '#00f0ff';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!purchased) {
                      e.currentTarget.style.borderColor = affordable ? 'rgba(0, 240, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  {purchased && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: '#00ff00',
                      color: '#000',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      OWNED
                    </div>
                  )}
                  
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '15px'
                  }}>
                    <div style={{
                      fontSize: '40px',
                      marginBottom: '10px',
                      filter: purchasing ? 'drop-shadow(0 0 20px #00f0ff)' : 'none',
                      transition: 'filter 0.3s ease'
                    }}>
                      {item.icon}
                    </div>
                    
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: purchased ? '#00ff00' : '#00f0ff',
                      margin: '0 0 8px 0',
                      textShadow: purchased ? '0 0 10px rgba(0, 255, 0, 0.5)' : '0 0 10px rgba(0, 240, 255, 0.5)'
                    }}>
                      {item.name}
                    </h3>
                    
                    <p style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.7)',
                      margin: '0 0 15px 0',
                      lineHeight: '1.4'
                    }}>
                      {item.description}
                    </p>
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: affordable ? '#00f0ff' : '#ff6b6b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        💠 {item.cost.toLocaleString()} XP
                      </div>
                      
                      <button
                        onClick={() => handlePurchase(item)}
                        disabled={!affordable || purchased || purchasing}
                        style={{
                          background: purchased 
                            ? 'linear-gradient(135deg, #00ff00, #00cc00)'
                            : affordable 
                              ? 'linear-gradient(135deg, #00f0ff, #0099cc)'
                              : 'linear-gradient(135deg, #666, #444)',
                          border: 'none',
                          color: purchased ? '#000' : '#fff',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: purchased || !affordable || purchasing ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s ease',
                          fontFamily: 'Orbitron, sans-serif',
                          opacity: purchasing ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (affordable && !purchased && !purchasing) {
                            e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 240, 255, 0.5)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (affordable && !purchased && !purchasing) {
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'scale(1)';
                          }
                        }}
                      >
                        {purchasing ? 'PURCHASING...' : purchased ? 'OWNED' : affordable ? 'BUY' : 'INSUFFICIENT XP'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* XP Inventory Modal */}
      <XPInventoryModal 
        isOpen={showInventory} 
        onClose={() => setShowInventory(false)} 
      />
    </div>
  );
};

export default XPShopModal;