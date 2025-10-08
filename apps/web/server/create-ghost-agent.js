/**
 * Create the ghost.fsn agent if it doesn't exist already
 */
const { storage } = require('./storage');

async function createGhostAgent() {
  try {
    console.log('Checking if ghost.fsn already exists...');
    
    // Check if agent already exists
    const domain = await storage.getFsnDomain('ghost');
    if (domain) {
      console.log('ghost.fsn already exists, skipping...');
      return { exists: true, domain };
    }
    
    console.log('Creating ghost.fsn AI agent...');
    
    // Create the AI agent user with a secure password
    const userInfo = {
      username: 'ghost_agent',
      password: `ghost_${Math.random().toString(36).substring(2, 10)}`,
      email: 'ghost@fsnvault.com',
      isAdmin: false
    };
    
    const user = await storage.createUser(userInfo);
    console.log(`Created user for ghost.fsn with ID: ${user.id}`);
    
    // Update the user's type to AI agent
    await storage.updateUser(user.id, {
      userType: 'ai_agent',
      agentScript: 'ghost-agent.js'
    });
    
    // Register the FSN name for the agent
    const fsnDomain = await storage.registerFsnName('ghost', user.id);
    console.log(`Registered ghost.fsn domain with ID: ${fsnDomain.id}`);
    
    return { exists: false, user, domain: fsnDomain };
  } catch (error) {
    console.error('Error creating ghost.fsn agent:', error);
    throw error;
  }
}

// Run the function
createGhostAgent()
  .then(result => {
    console.log('Ghost agent creation result:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });