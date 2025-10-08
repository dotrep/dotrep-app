/**
 * Create default AI agents for FSN Vault
 * 
 * This script creates the standard set of AI agents in the system:
 * - core.fsn - Central AI for onboarding and quests
 * - ghost.fsn - Secret challenges with XP rewards
 * - vault.fsn - XP tracker and inventory management
 * - forge.fsn - Cosmetic upgrades and customizations
 * - echo.fsn - Journaling and history tracking
 */

const { storage } = require('./storage');

// List of default agents to create
const DEFAULT_AGENTS = [
  {
    fsnName: 'core',
    agentScript: 'core-agent.js',
    description: 'Central AI that gives onboarding and quests'
  },
  {
    fsnName: 'ghost',
    agentScript: 'ghost-agent.js',
    description: 'Secret drops, XP, riddles, puzzles'
  },
  {
    fsnName: 'vault',
    agentScript: 'vault-agent.js',
    description: 'XP tracker + gear manager'
  },
  {
    fsnName: 'forge',
    agentScript: 'forge-agent.js',
    description: 'Skin/item creation + cosmetic upgrades'
  },
  {
    fsnName: 'echo',
    agentScript: 'echo-agent.js',
    description: 'Journaling, history, past actions'
  }
];

/**
 * Create a single AI agent
 */
async function createAgent(agentInfo) {
  try {
    const { fsnName, agentScript, description } = agentInfo;
    
    // Check if the agent already exists
    const existingDomain = await storage.getFsnDomain(fsnName);
    if (existingDomain) {
      console.log(`Agent ${fsnName}.fsn already exists, skipping...`);
      return null;
    }
    
    console.log(`Creating AI agent: ${fsnName}.fsn`);
    
    // Create an AI agent user
    const agentUser = await storage.createUser({
      username: `${fsnName}_agent`,
      password: `${fsnName}_${Math.random().toString(36).substring(2, 10)}`, // Random password
      email: `${fsnName}.fsn@fsnvault.com`,
      userType: 'ai_agent',
      agentScript: agentScript
    });
    
    // Register the FSN name for this agent
    const domain = await storage.registerFsnName(fsnName, agentUser.id);
    
    // Create email alias
    await storage.createEmailAlias({
      fsnName: fsnName,
      emailAlias: `${fsnName}.fsn@fsnvault.com`,
      isActive: true
    });
    
    console.log(`Successfully created agent ${fsnName}.fsn with ID ${agentUser.id}`);
    return { id: agentUser.id, fsnName, domain };
  } catch (error) {
    console.error(`Error creating agent ${agentInfo.fsnName}.fsn:`, error);
    return null;
  }
}

/**
 * Create all default agents
 */
async function createAllDefaultAgents() {
  console.log('Creating default AI agents...');
  
  for (const agent of DEFAULT_AGENTS) {
    await createAgent(agent);
  }
  
  console.log('Finished creating default AI agents');
}

// If this script is run directly, create the agents
if (require.main === module) {
  createAllDefaultAgents()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Error creating agents:', err);
      process.exit(1);
    });
}

// Export for use in other scripts
module.exports = {
  createAgent,
  createAllDefaultAgents
};