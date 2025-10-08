/**
 * Script to register default AI agents in the FSN system
 */
import { storage } from './storage';

async function registerAgent(name: string, script: string) {
  try {
    console.log(`Checking if ${name}.fsn already exists...`);
    // Check if agent already exists
    const domain = await storage.getFsnDomain(name);
    if (domain) {
      console.log(`${name}.fsn domain already exists.`);
      return;
    }
    
    console.log(`Creating AI agent: ${name}.fsn`);
    
    // Generate a secure password for the agent
    const password = `${name}_${Math.random().toString(36).substring(2, 10)}`;
    
    // Create user for the agent
    const user = await storage.createUser({
      username: `${name}_agent`,
      password: password,
      email: `${name}@fsnvault.com`,
      userType: 'ai_agent',
      agentScript: `${name}-agent.js`
    });
    
    console.log(`Created user for ${name}.fsn with ID: ${user.id}`);
    
    // Register the FSN domain for the agent
    const fsnDomain = await storage.registerFsnName(name, user.id);
    
    console.log(`Registered domain ${name}.fsn with ID: ${fsnDomain?.id}`);
    
    return { user, domain: fsnDomain };
  } catch (error) {
    console.error(`Error registering agent ${name}.fsn:`, error);
  }
}

async function registerAllAgents() {
  // List of default agents to register
  const agents = [
    { name: 'ghost', script: 'ghost-agent.js' },
    { name: 'core', script: 'core-agent.js' },
    { name: 'vault', script: 'vault-agent.js' }
  ];
  
  console.log('Starting agent registration process...');
  
  for (const agent of agents) {
    await registerAgent(agent.name, agent.script);
  }
  
  console.log('Agent registration complete.');
}

// Export functions for use in other parts of the app
export { registerAgent, registerAllAgents };