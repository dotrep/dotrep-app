const fs = require('fs');
const path = require('path');
const { storage } = require('../storage');

/**
 * Add XP to a user identified by their FSN name
 * @param {string} fsnName - The FSN name of the user to give XP to
 * @param {number} points - The amount of XP to add
 */
async function addXP(fsnName, points) {
  try {
    // Get the FSN domain to find its owner
    const domain = await storage.getFsnDomain(fsnName);
    if (!domain || !domain.ownerId) {
      console.error(`Cannot add XP: FSN domain ${fsnName} not found or has no owner`);
      return false;
    }

    // Get the user's current stats
    const userId = domain.ownerId;
    const userStats = await storage.getUserStats(userId);
    
    if (!userStats) {
      console.error(`Cannot add XP: User stats not found for user ID ${userId}`);
      return false;
    }

    // Calculate new values
    const currentXP = userStats.xpPoints || 0;
    const newXP = currentXP + points;
    
    // Basic level calculation (can be enhanced)
    const currentLevel = userStats.level || 1;
    const newLevel = Math.floor(1 + (newXP / 100)); // Level up for every 100 XP
    
    // Update the user's stats
    await storage.updateUserStats(userId, {
      xpPoints: newXP,
      level: newLevel > currentLevel ? newLevel : currentLevel, // Only level up, never down
    });
    
    console.log(`Added ${points} XP to ${fsnName}, new total: ${newXP}`);
    return true;
  } catch (error) {
    console.error('Error adding XP:', error);
    return false;
  }
}

/**
 * Get an AI agent by name
 * @param {string} agentName - The name of the agent (e.g., "ghost.fsn")
 * @returns {object|null} - The agent module or null if not found
 */
function getAgent(agentName) {
  try {
    // Convert agent FSN name to script name
    // e.g., "ghost.fsn" => "ghost-agent.js"
    const baseName = agentName.replace('.fsn', '');
    const scriptName = `${baseName}-agent.js`;
    const scriptPath = path.join(__dirname, scriptName);
    
    // Check if the agent script exists
    if (!fs.existsSync(scriptPath)) {
      console.error(`Agent script not found: ${scriptPath}`);
      return null;
    }
    
    // Clear the require cache to always get the latest version
    delete require.cache[require.resolve(scriptPath)];
    
    // Load and return the agent module
    return require(scriptPath);
  } catch (error) {
    console.error(`Error loading agent ${agentName}:`, error);
    return null;
  }
}

/**
 * Process a message to an AI agent and get the response
 * @param {string} senderFsn - The FSN name of the sender
 * @param {string} agentFsn - The FSN name of the agent
 * @param {string} message - The message content
 * @returns {Promise<{success: boolean, message?: string, error?: string}>} - The response
 */
async function processAgentMessage(senderFsn, agentFsn, message) {
  try {
    // Get the agent
    const agent = getAgent(agentFsn);
    if (!agent) {
      return { 
        success: false, 
        error: `Agent ${agentFsn} is not available`
      };
    }
    
    // Process the message
    if (typeof agent.handleMessage !== 'function') {
      return { 
        success: false, 
        error: `Agent ${agentFsn} doesn't know how to handle messages`
      };
    }
    
    // Get the agent's response
    const response = agent.handleMessage(senderFsn, message);
    
    // Handle different response types
    if (typeof response === 'string') {
      // Simple string response
      return { success: true, message: response };
    } else if (response && typeof response === 'object') {
      // Complex response with XP grants or actions
      
      // Handle XP grants
      if (response.xpGrant && typeof response.xpGrant === 'number') {
        await addXP(senderFsn, response.xpGrant);
      }
      
      // Return the message part of the response
      return { 
        success: true, 
        message: response.message || 'Agent processed your request.',
        action: response.action
      };
    }
    
    // Fallback for unexpected response types
    return { 
      success: true, 
      message: 'Message received but no meaningful response was generated.'
    };
  } catch (error) {
    console.error('Error processing agent message:', error);
    return { 
      success: false, 
      error: 'An error occurred while processing your message'
    };
  }
}

module.exports = {
  addXP,
  getAgent,
  processAgentMessage
};