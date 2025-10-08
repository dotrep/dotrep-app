/**
 * FSN Core Agent (core.fsn)
 * Text adventure quest system agent that interacts with users
 */

const { db } = require('../db');
const schema = require('../../shared/schema');
const { eq } = require('drizzle-orm');
const { storage } = require('../storage');

// Load ASCII art for text adventure visualization
const asciiArt = require('../data/ascii-art');

// Quest location definitions
const QUEST_LOCATIONS = {
  DARK_CORRIDOR: 'dark_corridor',
  TERMINAL_ROOM: 'terminal_room',
  SECRET_ROOM: 'secret_room'
};

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

// Update user quest data
async function updateUserQuest(userId, questData) {
  try {
    // Get current user stats
    let stats = await storage.getUserStats(userId);
    
    // Use the settings field to store quest data since it's already a text field
    const settings = stats && stats.settings ? JSON.parse(stats.settings || '{}') : {};
    settings.questData = questData;
    
    // If no stats exist yet, create a baseline
    if (!stats) {
      stats = await storage.updateUserStats(userId, {
        userId,
        xpPoints: 0,
        level: 1,
        settings: JSON.stringify(settings)
      });
    } else {
      // Update existing stats with new quest data
      stats = await storage.updateUserStats(userId, {
        settings: JSON.stringify(settings)
      });
    }
    
    return stats;
  } catch (error) {
    console.error('Error updating user quest:', error);
    if (error.message && error.message.includes('does not exist')) {
      console.log('Database schema might not be fully updated. Using fallback approach.');
      try {
        // Simpler approach to just update XP directly if settings field isn't available
        if (!stats) {
          await storage.updateUserStats(userId, {
            userId,
            xpPoints: 0,
            level: 1
          });
        }
      } catch (fallbackError) {
        console.error('Fallback approach also failed:', fallbackError);
      }
    }
    return null;
  }
}

// Add XP to a user
async function addXP(userId, amount) {
  try {
    // Get current stats
    let stats = await storage.getUserStats(userId);
    
    // If no stats exist, create baseline stats
    if (!stats) {
      stats = await storage.updateUserStats(userId, {
        userId,
        xpPoints: amount,
        level: 1,
        questData: JSON.stringify({ active: false }),
        inventory: JSON.stringify([])
      });
    } else {
      // Calculate new XP
      const currentXP = stats.xpPoints || 0;
      const newXP = currentXP + amount;
      
      // Simple level calculation (adjust as needed)
      let newLevel = stats.level || 1;
      if (newXP >= 300) newLevel = 5;
      else if (newXP >= 200) newLevel = 4;
      else if (newXP >= 100) newLevel = 3;
      else if (newXP >= 50) newLevel = 2;
      
      // Update stats
      stats = await storage.updateUserStats(userId, {
        xpPoints: newXP,
        level: newLevel
      });
    }
    
    return stats;
  } catch (error) {
    console.error('Error adding XP:', error);
    return null;
  }
}

// Add item to user inventory
async function addItemToInventory(userId, item) {
  try {
    // Get current stats
    let stats = await storage.getUserStats(userId);
    
    // Use the settings field to store quest data and inventory
    const settings = stats && stats.settings ? JSON.parse(stats.settings || '{}') : {};
    
    // Initialize inventory if it doesn't exist
    if (!settings.inventory) {
      settings.inventory = [];
    }
    
    // Add item if not already in inventory
    if (!settings.inventory.includes(item)) {
      settings.inventory.push(item);
    }
    
    // Update settings with new inventory
    if (!stats) {
      stats = await storage.updateUserStats(userId, {
        userId,
        xpPoints: 0,
        level: 1,
        settings: JSON.stringify(settings)
      });
    } else {
      stats = await storage.updateUserStats(userId, {
        settings: JSON.stringify(settings)
      });
    }
    
    return settings.inventory;
  } catch (error) {
    console.error('Error adding item to inventory:', error);
    return null;
  }
}

// Check if user has an item
async function hasItem(userId, item) {
  try {
    const stats = await storage.getUserStats(userId);
    if (!stats || !stats.settings) return false;
    
    try {
      const settings = JSON.parse(stats.settings || '{}');
      return settings.inventory && settings.inventory.includes(item);
    } catch (e) {
      return false;
    }
  } catch (error) {
    console.error('Error checking inventory:', error);
    return false;
  }
}

// Start a new quest for user
async function startQuest(userId) {
  const questData = {
    active: true,
    location: QUEST_LOCATIONS.DARK_CORRIDOR,
    completed: false,
    progress_log: ['started_quest']
  };
  
  await updateUserQuest(userId, questData);
  return questData;
}

// Get user's current quest data
async function getUserQuestData(userId) {
  try {
    const stats = await storage.getUserStats(userId);
    if (!stats || !stats.settings) {
      return { active: false };
    }
    
    try {
      const settings = JSON.parse(stats.settings || '{}');
      return settings.questData || { active: false };
    } catch (e) {
      return { active: false };
    }
  } catch (error) {
    console.error('Error getting quest data:', error);
    return { active: false };
  }
}

// Continue an active quest
async function continueQuest(userId, input) {
  // Get current quest data
  const questData = await getUserQuestData(userId);
  if (!questData || !questData.active) {
    return "No active quest found. Type `start quest` to begin.";
  }
  
  const loc = questData.location;
  const log = questData.progress_log || [];

  // Add the input to the progress log
  log.push(`input: ${input}`);
  
  // Handle different locations
  if (loc === QUEST_LOCATIONS.DARK_CORRIDOR) {
    if (input === "look") {
      return asciiArt.corridor + "\n\nYou see a flickering terminal to the east and a sealed door to the west. Type: `go east` or `go west`.";
    }

    if (input === "go east") {
      questData.location = QUEST_LOCATIONS.TERMINAL_ROOM;
      log.push("entered_terminal_room");
      await updateUserQuest(userId, questData);
      return "You approach the terminal. It sparks. Type: `use terminal`.";
    }

    if (input === "go west") {
      if (await hasItem(userId, "humming_key")) {
        questData.location = QUEST_LOCATIONS.SECRET_ROOM;
        log.push("opened_locked_door");
        await addXP(userId, 20);
        await addItemToInventory(userId, "vault_patch");
        await updateUserQuest(userId, questData);
        return asciiArt.secret_room + "\n\nYou unlocked the door with the humming key. Inside, you find a glowing badge: `vault_patch`. +20 XP.";
      } else {
        return "The door is locked. You need a key.";
      }
    }
  }

  if (loc === QUEST_LOCATIONS.TERMINAL_ROOM) {
    if (input === "look") {
      return "You're in the terminal room. A flickering computer terminal stands before you. The corridor is to the west.";
    }
    
    if (input === "use terminal") {
      if (!(await hasItem(userId, "humming_key"))) {
        await addXP(userId, 10);
        await addItemToInventory(userId, "humming_key");
        log.push("got_key");
        await updateUserQuest(userId, questData);
        return asciiArt.terminal + "\n\nThe terminal flashes: ACCESS GRANTED. You receive: `humming_key` (+10 XP). Type: `go back`.";
      } else {
        return "You've already used this terminal.";
      }
    }

    if (input === "go back" || input === "go west") {
      questData.location = QUEST_LOCATIONS.DARK_CORRIDOR;
      await updateUserQuest(userId, questData);
      return "You're back in the corridor.";
    }
  }

  if (loc === QUEST_LOCATIONS.SECRET_ROOM) {
    if (input === "look") {
      return asciiArt.secret_room + "\n\nYou're in a secret room with glowing panels. There's a vault patch here.";
    }
    
    if (input === "exit") {
      questData.completed = true;
      await updateUserQuest(userId, questData);
      await addXP(userId, 25);
      return asciiArt.complete + "\n\nQuest complete! You've earned a total of 55 XP and collected valuable items. Type `start quest` to play again.";
    }
    return "You've completed this section. Type `exit` to finish or keep exploring.";
  }

  // Default response for unknown commands
  return "Unknown command. Try: `look`, `go east`, `use terminal`, `go back`, `go west`, `exit`.";
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

// Handle messages sent to core.fsn
async function handleMessage(senderFsn, message) {
  try {
    // Get user from FSN name
    const fsnDomain = await storage.getFsnDomain(senderFsn);
    if (!fsnDomain || !fsnDomain.userId) {
      return "Error: User not found.";
    }
    
    const userId = fsnDomain.userId;
    const m = message.toLowerCase().trim();
    
    // Check for direct command matches first
    if (m === "start quest" || m === "start adventure" || m === "play") {
      await startQuest(userId);
      return asciiArt.welcome + "\n\nYou awaken in a dark vault. The air is cold. There is a faint humming in the walls. Type: `look`.";
    }
    
    // Check for inventory command
    if (m === "inventory" || m === "items") {
      const inventory = await getUserInventory(userId);
      if (!inventory || inventory.length === 0) {
        return asciiArt.inventory + "\n\nYour inventory is empty. Complete quests to collect items.";
      } else {
        return asciiArt.inventory + "\n\nYour inventory contains: " + inventory.join(", ");
      }
    }
    
    // Check for status command
    if (m === "status" || m === "xp" || m === "level") {
      const stats = await storage.getUserStats(userId);
      if (!stats) {
        return "Your status: Level 1, 0 XP";
      }
      return `Your status: Level ${stats.level || 1}, ${stats.xpPoints || 0} XP\nType 'inventory' to check your items.`;
    }
    
    // Check for help command
    if (m === "help" || m.includes("help") || m.includes("command")) {
      return "I am core.fsn, the central AI of the FreeSpace Network. I can guide you through quests and adventures in the digital realm.\n\nCommands:\n- `start quest` - Begin your adventure\n- `look` - Examine your surroundings\n- `go [direction]` - Move in a direction\n- `use [object]` - Interact with objects\n- `inventory` - Check your items\n- `status` - View your XP and level";
    }
    
    // Check for natural language requests to start quest
    if (m.includes("quest") || m.includes("adventure") || m.includes("game") || 
        m.includes("play") || m.includes("start") || m.includes("begin")) {
      await startQuest(userId);
      return asciiArt.welcome + "\n\nYou awaken in a dark vault. The air is cold. There is a faint humming in the walls. Type: `look`.";
    }
    
    // Check if user has an active quest - if so, continue it
    let questData = await getUserQuestData(userId);
    
    if (questData && questData.active) {
      return await continueQuest(userId, m);
    }
    
    // Default response
    return "Greetings, operator. Type `start quest` to enter the FSN vault, or `help` for more information.";
  } catch (error) {
    console.error('Error handling message in core.fsn:', error);
    return "I'm experiencing network fluctuations. Please try again later.";
  }
}

module.exports = {
  handleMessage
};