const express = require('express');
const router = express.Router();
const { storage } = require('../storage');
const { registerDefaultAgents } = require('../register-default-ai-agents');

// Admin only middleware
const adminOnly = async (req, res, next) => {
  try {
    const userId = parseInt(req.query.userId || req.body.userId);
    
    if (!userId || isNaN(userId)) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Error in admin authorization:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Register default AI agents
router.post('/register-ai-agents', adminOnly, async (req, res) => {
  try {
    const results = await registerDefaultAgents();
    return res.json({ success: true, results });
  } catch (error) {
    console.error('Error registering AI agents:', error);
    return res.status(500).json({ success: false, error: 'Error registering AI agents' });
  }
});

// Get list of AI agents
router.get('/ai-agents', adminOnly, async (req, res) => {
  try {
    const aiUsers = await storage.getUsersByType('ai_agent');
    
    // Get FSN names for the AI agents
    const agents = [];
    for (const user of aiUsers) {
      const domains = await storage.getFsnDomainsByOwner(user.id);
      if (domains && domains.length > 0) {
        agents.push({
          id: user.id,
          username: user.username,
          fsnName: domains[0].name,
          script: user.agentScript
        });
      }
    }
    
    return res.json({ success: true, agents });
  } catch (error) {
    console.error('Error getting AI agents:', error);
    return res.status(500).json({ success: false, error: 'Error getting AI agents' });
  }
});

// Create a specific AI agent
router.post('/create-ai-agent', adminOnly, async (req, res) => {
  try {
    const { name, password } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Agent name is required' });
    }
    
    // Create the agent
    // First generate script name from agent name (e.g., "ghost" -> "ghost-agent.js")
    const scriptName = `${name}-agent.js`;
    
    // Create agent user
    const user = await storage.createUser({
      username: `${name}_agent`,
      password: password || `${name}_${Math.random().toString(36).substring(2, 10)}`,
      email: `${name}@fsnvault.com`,
      userType: 'ai_agent',
      agentScript: scriptName
    });
    
    // Register FSN name for agent
    const domain = await storage.registerFsnName(name, user.id);
    
    return res.json({
      success: true,
      agent: {
        id: user.id,
        username: user.username,
        fsnName: name,
        domain
      }
    });
  } catch (error) {
    console.error('Error creating AI agent:', error);
    return res.status(500).json({ success: false, error: 'Error creating AI agent' });
  }
});

module.exports = router;