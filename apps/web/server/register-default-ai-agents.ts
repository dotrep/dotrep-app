/**
 * Script to register the default AI agents
 * This file can be imported and run programmatically
 */
import { storage } from './storage';

/**
 * Register a single AI agent in the system
 */
async function registerAgent(name: string, password: string = '') {
  try {
    console.log(`Checking if ${name}.fsn already exists...`);
    
    // Check if agent already exists
    const domain = await storage.getFsnDomain(name);
    if (domain) {
      console.log(`${name}.fsn domain already exists, skipping registration`);
      return { exists: true, domain };
    }
    
    // Generate secure password if none provided
    const agentPassword = password || `${name}_${Math.random().toString(36).substring(2, 10)}`;
    
    // Create the AI agent user
    const user = await storage.createUser({
      username: `${name}_agent`,
      password: agentPassword,
      email: `${name}@fsnvault.com`,
      userType: 'ai_agent',
      agentScript: `${name}-agent.js`
    });
    
    console.log(`Created user for ${name}.fsn with ID ${user.id}`);
    
    // Register the FSN name for this agent
    const fsnDomain = await storage.registerFsnName(name, user.id);
    console.log(`Registered FSN name ${name}.fsn for AI agent`);
    
    return { exists: false, user, domain: fsnDomain };
  } catch (error) {
    console.error(`Error registering agent ${name}.fsn:`, error);
    throw error;
  }
}

/**
 * Register all default AI agents in the system
 */
export async function registerDefaultAgents() {
  // List of default AI agents to register
  const defaultAgents = [
    'ghost', // Secret challenges and puzzles
    'core',  // Main onboarding agent
    'vault', // XP tracking and inventory
    'forge', // Item creation and cosmetic upgrades
    'echo'   // Journaling and history tracking
  ];
  
  console.log('Registering default AI agents...');
  const results = [];
  
  for (const agentName of defaultAgents) {
    try {
      const result = await registerAgent(agentName);
      results.push({ name: agentName, ...result });
    } catch (error) {
      console.error(`Error registering ${agentName}.fsn:`, error);
      results.push({ name: agentName, error: true });
    }
  }
  
  console.log('Default AI agent registration complete');
  return results;
}

// If this script is run directly
if (require.main === module) {
  registerDefaultAgents()
    .then(() => {
      console.log('All done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error during agent registration:', error);
      process.exit(1);
    });
}