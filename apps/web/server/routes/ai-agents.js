const express = require('express');
const router = express.Router();
const { storage } = require('../storage');
const { processAgentMessage } = require('../ai-agents/agent-utils');

// Get list of available AI agents
router.get('/list', async (req, res) => {
  try {
    // Get all AI agent users
    const aiAgents = await storage.getUsersByType('ai_agent');
    
    // Format the response
    const formattedAgents = [];
    for (const agent of aiAgents) {
      // Get the FSN domain for this agent
      const domains = await storage.getFsnDomainsByOwner(agent.id);
      if (domains && domains.length > 0) {
        formattedAgents.push({
          id: agent.id,
          fsnName: domains[0].name,
          agentScript: agent.agentScript
        });
      }
    }
    
    return res.json({
      success: true,
      agents: formattedAgents
    });
  } catch (error) {
    console.error('Error fetching AI agents:', error);
    return res.status(500).json({
      success: false,
      error: 'Error fetching AI agents'
    });
  }
});

// Send a message to an AI agent
router.post('/message', async (req, res) => {
  try {
    const { senderFsn, agentFsn, message } = req.body;
    
    if (!senderFsn || !agentFsn || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: senderFsn, agentFsn, message'
      });
    }
    
    // Check if the agent exists
    const agentDomain = await storage.getFsnDomain(agentFsn);
    if (!agentDomain || agentDomain.status !== 'registered') {
      return res.status(404).json({
        success: false,
        error: `Agent ${agentFsn} not found`
      });
    }
    
    // Check if the agent is an AI agent
    if (!agentDomain.ownerId) {
      return res.status(400).json({
        success: false,
        error: `${agentFsn} has no owner`
      });
    }
    
    const agentUser = await storage.getUser(agentDomain.ownerId);
    if (!agentUser || agentUser.userType !== 'ai_agent') {
      return res.status(400).json({
        success: false,
        error: `${agentFsn} is not an AI agent`
      });
    }
    
    // Save the sent message
    const sentMessage = await storage.sendFsnMessage({
      fromFsn: senderFsn,
      toFsn: agentFsn,
      message: message,
      isRead: false,
      timestamp: new Date()
    });
    
    // Process the message with the agent script
    const agentScriptName = agentUser.agentScript || agentFsn.replace('.fsn', '');
    const agentResponse = await processAgentMessage(senderFsn, agentFsn, message);
    
    if (agentResponse.success) {
      // Save the agent's response
      const responseMessage = await storage.sendFsnMessage({
        fromFsn: agentFsn,
        toFsn: senderFsn,
        message: agentResponse.message,
        isRead: false,
        timestamp: new Date()
      });
      
      return res.json({
        success: true,
        sentMessage,
        agentResponse: responseMessage
      });
    } else {
      // Return error but the original message was sent
      return res.status(500).json({
        success: false,
        sentMessage,
        error: agentResponse.error || 'Error processing message'
      });
    }
  } catch (error) {
    console.error('Error sending message to AI agent:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error processing message'
    });
  }
});

// Create a new AI agent (admin only)
router.post('/create', async (req, res) => {
  try {
    const { fsnName, agentScript, password } = req.body;
    
    if (!fsnName || !agentScript || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fsnName, agentScript, password'
      });
    }
    
    // Check if the FSN name is available
    const availability = await storage.checkFsnNameAvailability(fsnName);
    if (!availability.available) {
      return res.status(400).json({
        success: false,
        error: `FSN name ${fsnName} is not available: ${availability.reason}`
      });
    }
    
    // Create the AI agent user
    const agentUser = await storage.createUser({
      username: `${fsnName}_agent`,
      password: password,
      email: `${fsnName}@fsnvault.com`,
      userType: 'ai_agent',
      agentScript: agentScript
    });
    
    // Register the FSN name for the agent
    const domain = await storage.registerFsnName(fsnName, agentUser.id);
    
    if (!domain) {
      return res.status(500).json({
        success: false,
        error: 'Failed to register FSN name for agent'
      });
    }
    
    // Create an email alias for the agent
    await storage.createEmailAlias({
      fsnName: fsnName,
      emailAlias: `${fsnName}@fsnvault.com`,
      isActive: true
    });
    
    return res.status(201).json({
      success: true,
      agent: {
        id: agentUser.id,
        fsnName: domain.name,
        agentScript
      }
    });
  } catch (error) {
    console.error('Error creating AI agent:', error);
    return res.status(500).json({
      success: false,
      error: 'Error creating AI agent'
    });
  }
});

module.exports = router;