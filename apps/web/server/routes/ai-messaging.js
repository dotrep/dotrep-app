const express = require('express');
const router = express.Router();
const { storage } = require('../storage');
const { processAgentMessage } = require('../ai-agents/agent-utils');

// Send message to an AI agent
router.post('/send-to-agent', async (req, res) => {
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
        error: `Agent ${agentFsn} not found or not available`
      });
    }
    
    // Check if agent is an AI agent
    const agentOwner = agentDomain.ownerId 
      ? await storage.getUser(agentDomain.ownerId) 
      : null;
    
    if (!agentOwner || agentOwner.userType !== 'ai_agent') {
      return res.status(400).json({
        success: false,
        error: `${agentFsn} is not an AI agent`
      });
    }
    
    // Record the sent message
    const sentMessage = await storage.sendFsnMessage({
      fromFsn: senderFsn,
      toFsn: agentFsn,
      message: message,
      isRead: false,
      timestamp: new Date()
    });
    
    // Process the message with the agent
    const response = await processAgentMessage(senderFsn, agentFsn, message);
    
    if (response.success) {
      // Record the agent's response as a message
      const agentMessage = await storage.sendFsnMessage({
        fromFsn: agentFsn,
        toFsn: senderFsn,
        message: response.message,
        isRead: false,
        timestamp: new Date()
      });
      
      // Return both messages
      return res.json({
        success: true,
        sentMessage,
        agentResponse: agentMessage,
        action: response.action
      });
    } else {
      // Agent error but message was still sent
      return res.status(500).json({
        success: false,
        sentMessage,
        error: response.error || 'Unknown error processing agent message'
      });
    }
  } catch (error) {
    console.error('Error handling agent message:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error processing message'
    });
  }
});

// Get a list of all AI agents
router.get('/agents', async (req, res) => {
  try {
    // Get all users that are AI agents
    const aiAgentUsers = await storage.getUsersByType('ai_agent');
    
    // Get their FSN domains
    const aiAgents = [];
    for (const agent of aiAgentUsers) {
      const domains = await storage.getFsnDomainsByOwner(agent.id);
      if (domains && domains.length > 0) {
        aiAgents.push({
          id: agent.id,
          fsnName: domains[0].name,
          agentScript: agent.agentScript
        });
      }
    }
    
    return res.json({
      success: true,
      agents: aiAgents
    });
  } catch (error) {
    console.error('Error fetching AI agents:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error fetching agents'
    });
  }
});

module.exports = router;