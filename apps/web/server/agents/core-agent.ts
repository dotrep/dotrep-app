/**
 * FSN Core Agent (core.fsn)
 * Text adventure quest system agent that interacts with users
 */

import { db } from '../db';
import * as schema from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { storage } from '../storage';
import * as fs from 'fs';
import * as path from 'path';

// Load ASCII art for text adventure visualization
let asciiArt = {
  corridor: `
╔═══════════════════╗
║   You are here →  ║
║                   ║
║    DARK CORRIDOR  ║
║    ┌─────┐        ║
║    │     │        ║
║    │     │← Terminal Room
║    └─────┘        ║
║                   ║
║    ← Locked Door  ║
╚═══════════════════╝
`,

  terminal: `
╔══════════════════════╗
║  FLICKERING TERMINAL ║
║                      ║
║   [ ACCESS GRANTED ] ║
║     ||||||||||||||   ║
║    {HUMMING KEY}     ║
╚══════════════════════╝
`,

  secret_room: `
╔═══════════════════════════╗
║     🔒 SECRET VAULT ROOM   ║
║                           ║
║     You found:            ║
║     - Vault Patch         ║
║     - 20 XP               ║
╚═══════════════════════════╝
`,

  welcome: `
╔════════════════════════════════════╗
║        WELCOME TO FSN VAULT        ║
║                                    ║
║      ┌─────────────────────┐      ║
║      │                     │      ║
║      │     core.fsn        │      ║
║      │     TEXT QUEST      │      ║
║      │                     │      ║
║      └─────────────────────┘      ║
║                                    ║
║      Type 'start quest' to begin   ║
╚════════════════════════════════════╝
`,

  complete: `
╔════════════════════════════════════╗
║            QUEST COMPLETE          ║
║                                    ║
║             +55 XP                 ║
║                                    ║
║      [HUMMING KEY ACQUIRED]        ║
║      [VAULT PATCH ACQUIRED]        ║
║                                    ║
║      Type 'start quest' to play    ║
║      again or explore other        ║
║      commands!                     ║
╚════════════════════════════════════╝
`,

  inventory: `
╔════════════════════════════════════╗
║            INVENTORY               ║
║                                    ║
║      ┌─────────────────────┐      ║
║      │                     │      ║
║      │     ITEMS LIST      │      ║
║      │                     │      ║
║      └─────────────────────┘      ║
║                                    ║
╚════════════════════════════════════╝
`
};

try {
  const artPath = path.join(__dirname, '../data/ascii-art.js');
  if (fs.existsSync(artPath)) {
    const artModule = require(artPath);
    asciiArt = artModule;
  }
} catch (error) {
  console.error('Error loading ASCII art:', error);
  // Using default ASCII art defined above as fallback
}

// Quest location definitions
const QUEST_LOCATIONS = {
  DARK_CORRIDOR: 'dark_corridor',
  TERMINAL_ROOM: 'terminal_room',
  SECRET_ROOM: 'secret_room'
};

// Get user by FSN name
async function getUserByFsnName(fsnName: string) {
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

// Update user quest data - safely handling potential schema issues
async function updateUserQuest(userId: number, questData: any) {
  try {
    // Get current user stats
    let stats = await storage.getUserStats(userId);
    
    // Initialize settings object, checking if it exists
    let settingsObj = {};
    if (stats && stats.settings) {
      try {
        settingsObj = JSON.parse(stats.settings);
      } catch {
        // If parsing fails, use an empty object
        settingsObj = {};
      }
    }
    
    // Add quest data to settings
    settingsObj = {
      ...settingsObj,
      questData
    };
    
    // If no stats exist yet, create baseline
    if (!stats) {
      stats = await storage.updateUserStats(userId, {
        userId,
        xpPoints: 0,
        level: 1,
        settings: JSON.stringify(settingsObj)
      });
    } else {
      // Update existing stats with new settings
      stats = await storage.updateUserStats(userId, {
        settings: JSON.stringify(settingsObj)
      });
    }
    
    return stats;
  } catch (error) {
    console.error('Error updating user quest:', error);
    // Try to update XP at least
    try {
      await storage.updateUserStats(userId, {
        xpPoints: 0,
        level: 1
      });
    } catch {
      // Silently fail
    }
    return null;
  }
}

// Add XP to a user
async function addXP(userId: number, amount: number) {
  try {
    // Get current stats
    let stats = await storage.getUserStats(userId);
    
    // If no stats exist, create baseline stats
    if (!stats) {
      stats = await storage.updateUserStats(userId, {
        userId,
        xpPoints: amount,
        level: 1
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

// Add item to user's inventory
async function addItemToInventory(userId: number, item: string) {
  try {
    // Get current stats
    let stats = await storage.getUserStats(userId);
    
    // Initialize settings object
    let settingsObj: any = {};
    if (stats && stats.settings) {
      try {
        settingsObj = JSON.parse(stats.settings);
      } catch {
        settingsObj = {};
      }
    }
    
    // Initialize inventory if it doesn't exist
    if (!settingsObj.inventory) {
      settingsObj.inventory = [];
    }
    
    // Add item if not already in inventory
    if (!settingsObj.inventory.includes(item)) {
      settingsObj.inventory.push(item);
    }
    
    // Update settings with new inventory
    if (!stats) {
      stats = await storage.updateUserStats(userId, {
        userId,
        xpPoints: 0,
        level: 1,
        settings: JSON.stringify(settingsObj)
      });
    } else {
      stats = await storage.updateUserStats(userId, {
        settings: JSON.stringify(settingsObj)
      });
    }
    
    return settingsObj.inventory;
  } catch (error) {
    console.error('Error adding item to inventory:', error);
    return null;
  }
}

// Check if user has an item
async function hasItem(userId: number, item: string) {
  try {
    const stats = await storage.getUserStats(userId);
    if (!stats || !stats.settings) return false;
    
    try {
      const settingsObj = JSON.parse(stats.settings);
      return settingsObj.inventory && settingsObj.inventory.includes(item);
    } catch {
      return false;
    }
  } catch (error) {
    console.error('Error checking inventory:', error);
    return false;
  }
}

// Start a new quest for user
async function startQuest(userId: number) {
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
async function getUserQuestData(userId: number) {
  try {
    const stats = await storage.getUserStats(userId);
    if (!stats || !stats.settings) {
      return { active: false };
    }
    
    try {
      const settingsObj = JSON.parse(stats.settings);
      return settingsObj.questData || { active: false };
    } catch {
      return { active: false };
    }
  } catch (error) {
    console.error('Error getting quest data:', error);
    return { active: false };
  }
}

// Get user's inventory
async function getUserInventory(userId: number) {
  try {
    const stats = await storage.getUserStats(userId);
    if (!stats || !stats.settings) return [];
    
    try {
      const settingsObj = JSON.parse(stats.settings);
      return settingsObj.inventory || [];
    } catch {
      return [];
    }
  } catch (error) {
    console.error('Error getting inventory:', error);
    return [];
  }
}

// Continue an active quest
async function continueQuest(userId: number, input: string) {
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

// Handle messages sent to core.fsn
async function handleMessage(senderFsn: string, message: string) {
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

export default {
  handleMessage
};