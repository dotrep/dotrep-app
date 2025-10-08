/**
 * FSN Vault Agent (vault.fsn)
 * Handles XP shop functionality, inventory management, and vault operations
 */

const fs = require('fs');
const path = require('path');
const { storage } = require('../storage');

// Load the XP shop inventory
const shopPath = path.join(__dirname, '../data/xp-shop.json');
let shop = [];

try {
  const shopData = fs.readFileSync(shopPath, 'utf8');
  shop = JSON.parse(shopData);
} catch (error) {
  console.error('Error loading XP shop inventory:', error);
  // Fallback shop items if file can't be loaded
  shop = [
    { item: "bronze_patch", cost: 20, description: "Basic FSN starter badge." },
    { item: "vault_key", cost: 50, description: "Unlocks secret quest chambers." },
    { item: "obsidian_skin", cost: 100, description: "Dark, rare visual vault skin." }
  ];
}

// Get user by FSN name
async function getUserByFsnName(fsnName) {
  try {
    const fsnDomain = await storage.getFsnDomain(fsnName);
    if (!fsnDomain || !fsnDomain.userId) return null;
    
    const user = await storage.getUser(fsnDomain.userId);
    return user;
  } catch (error) {
    console.error('Error getting user by FSN name:', error);
    return null;
  }
}

// Get user's XP
async function getUserXP(userId) {
  try {
    const stats = await storage.getUserStats(userId);
    return stats ? (stats.xpPoints || 0) : 0;
  } catch (error) {
    console.error('Error getting user XP:', error);
    return 0;
  }
}

// Get user's inventory
async function getUserInventory(userId) {
  try {
    const stats = await storage.getUserStats(userId);
    if (!stats || !stats.settings) return [];
    
    try {
      const settings = JSON.parse(stats.settings || '{}');
      return settings.inventory || [];
    } catch (e) {
      return [];
    }
  } catch (error) {
    console.error('Error getting user inventory:', error);
    return [];
  }
}

// Get user's purchase history
async function getUserPurchases(userId) {
  try {
    const stats = await storage.getUserStats(userId);
    if (!stats || !stats.settings) return [];
    
    try {
      const settings = JSON.parse(stats.settings || '{}');
      return settings.purchases || [];
    } catch (e) {
      return [];
    }
  } catch (error) {
    console.error('Error getting user purchases:', error);
    return [];
  }
}

// Update user's XP
async function updateUserXP(userId, newXP) {
  try {
    await storage.updateUserStats(userId, {
      xpPoints: newXP
    });
    return true;
  } catch (error) {
    console.error('Error updating user XP:', error);
    return false;
  }
}

// Add an item to user's inventory and record purchase
async function addPurchase(userId, item) {
  try {
    const stats = await storage.getUserStats(userId);
    const settings = stats && stats.settings ? JSON.parse(stats.settings || '{}') : {};
    
    // Initialize inventory and purchases arrays if they don't exist
    if (!settings.inventory) settings.inventory = [];
    if (!settings.purchases) settings.purchases = [];
    
    // Add item to inventory if not already there
    if (!settings.inventory.includes(item)) {
      settings.inventory.push(item);
    }
    
    // Record purchase
    settings.purchases.push({
      item,
      timestamp: new Date().toISOString()
    });
    
    // Update user stats with new settings
    await storage.updateUserStats(userId, {
      settings: JSON.stringify(settings)
    });
    
    return true;
  } catch (error) {
    console.error('Error adding purchase:', error);
    return false;
  }
}

// Handle messages sent to vault.fsn
async function handleMessage(senderFsn, message) {
  try {
    // Get user from FSN name
    const fsnDomain = await storage.getFsnDomain(senderFsn);
    if (!fsnDomain || !fsnDomain.userId) {
      return "Error: User not found.";
    }
    
    const userId = fsnDomain.userId;
    const m = message.toLowerCase().trim();
    
    // XP Shop functionality
    if (m === "shop" || m === "list items" || m === "store") {
      const shopList = shop.map(item => `- ${item.item} (${item.cost} XP): ${item.description}`).join('\n');
      return `🛍️ **FSN Vault XP Shop**\n\nCurrent items available:\n${shopList}\n\nType \`buy [item_name]\` to purchase an item.`;
    }
    
    if (m.startsWith("buy ")) {
      const requestedItem = m.replace("buy ", "").trim();
      const item = shop.find(i => i.item.toLowerCase() === requestedItem.toLowerCase());
      
      if (!item) {
        return "Item not found in the shop. Type `shop` to see available items.";
      }
      
      // Check user's XP
      const userXP = await getUserXP(userId);
      if (userXP < item.cost) {
        return `Insufficient XP. You have ${userXP} XP, but need ${item.cost} XP to purchase this item.`;
      }
      
      // Check if user already has this item
      const inventory = await getUserInventory(userId);
      if (inventory.includes(item.item)) {
        return `You already own the ${item.item}.`;
      }
      
      // Deduct XP and add item to inventory
      const newXP = userXP - item.cost;
      const updateXPSuccess = await updateUserXP(userId, newXP);
      const addPurchaseSuccess = await addPurchase(userId, item.item);
      
      if (updateXPSuccess && addPurchaseSuccess) {
        return `✅ Purchase successful! You bought **${item.item}** for ${item.cost} XP.\n\nYou now have ${newXP} XP remaining.\n\nType \`inventory\` to see your items.`;
      } else {
        return "Error processing purchase. Please try again later.";
      }
    }
    
    if (m === "inventory" || m === "items") {
      const inventory = await getUserInventory(userId);
      
      if (inventory.length === 0) {
        return "Your inventory is empty. Type `shop` to browse items you can purchase.";
      }
      
      const itemsList = inventory.map(itemName => {
        const itemDetails = shop.find(i => i.item === itemName);
        return `- ${itemName}: ${itemDetails ? itemDetails.description : 'A mysterious item'}`;
      }).join('\n');
      
      return `🎒 **Your Inventory**\n\n${itemsList}\n\nType \`shop\` to browse more items.`;
    }
    
    if (m === "purchases" || m === "history") {
      const purchases = await getUserPurchases(userId);
      
      if (!purchases || purchases.length === 0) {
        return "You haven't made any purchases yet. Type `shop` to browse items.";
      }
      
      const purchaseList = purchases.map(p => {
        const date = new Date(p.timestamp).toLocaleDateString();
        return `- ${p.item} (purchased on ${date})`;
      }).join('\n');
      
      return `🛒 **Purchase History**\n\n${purchaseList}`;
    }
    
    if (m === "help") {
      return `**Vault.FSN Helper**\n\nCommands available:\n- \`shop\` - View available items\n- \`buy [item_name]\` - Purchase an item\n- \`inventory\` - View your items\n- \`purchases\` - View your purchase history\n- \`help\` - Show this help message`;
    }
    
    // Default response
    return "Welcome to the FSN Vault. I manage your secure storage and the XP shop. Type `help` for a list of commands.";
  } catch (error) {
    console.error('Error handling message in vault.fsn:', error);
    return "I'm experiencing a security protocol fluctuation. Please try again later.";
  }
}

module.exports = {
  handleMessage
};