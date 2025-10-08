import React, { createContext, useContext, useState, useEffect } from 'react';

const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [equippedItems, setEquippedItems] = useState({});

  // Load purchased items from localStorage on mount
  useEffect(() => {
    const savedPurchased = localStorage.getItem('fsn_purchased_items');
    if (savedPurchased) {
      const parsed = JSON.parse(savedPurchased);
      setPurchasedItems(parsed);
    }
    
    const savedEquipped = localStorage.getItem('fsn_equipped_items');
    if (savedEquipped) {
      const parsed = JSON.parse(savedEquipped);
      setEquippedItems(parsed);
    }
  }, []);

  // Save purchased items to localStorage
  const updatePurchasedItems = (items) => {
    localStorage.setItem('fsn_purchased_items', JSON.stringify(items));
    setPurchasedItems(items);
  };

  // Check if an item is purchased
  const isItemPurchased = (itemId) => purchasedItems.includes(itemId);

  // Check if an item is equipped
  const isItemEquipped = (itemId, category) => equippedItems[category] === itemId;

  // Get cosmetic effects based on equipped items (not just purchased)
  const getCosmeticEffects = () => {
    const effects = {
      vaultNeonFrame: isItemEquipped(1, 'Cosmetic Frame'), // Vault Neon Frame
      signalParticleTrail: isItemEquipped(2, 'Signal Effect'), // Signal Cast Particle Trail
      rareBeaconBadge: isItemEquipped(3, 'Vault Badge'), // Rare Beacon Badge
      xpBooster: isItemEquipped(4, 'Temporary Boost'), // XP Booster
      pulseEnhancement: isItemEquipped(5, 'Cosmetic Frame'), // Pulse Enhancement
      customSignalTheme: isItemEquipped(6, 'Signal Effect'), // Custom Signal Theme
      beaconUpgrade: isItemEquipped(7, 'Signal Effect'), // Beacon Upgrade
      vaultSecurity: isItemEquipped(8, 'Vault Badge'), // Vault Security
    };
    return effects;
  };

  const value = {
    purchasedItems,
    updatePurchasedItems,
    isItemPurchased,
    isItemEquipped,
    equippedItems,
    setEquippedItems,
    getCosmeticEffects
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};