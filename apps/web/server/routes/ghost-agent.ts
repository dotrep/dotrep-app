import { Request, Response, Router } from 'express';
import { storage } from '../storage';

const router = Router();

// Endpoint to register ghost.fsn agent
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Check if ghost.fsn already exists
    const existingDomain = await storage.getFsnDomain('ghost');
    if (existingDomain) {
      console.log('ghost.fsn domain already exists:', existingDomain);
      return res.json({
        success: true,
        message: 'ghost.fsn already exists',
        domain: existingDomain
      });
    }
    
    // Create the ghost agent user with secure randomly generated password
    const securePassword = require('crypto').randomBytes(16).toString('hex');
    const ghostUser = await storage.createUser({
      username: 'ghost_agent',
      password: securePassword, // Secure random password
      email: 'ghost@fsnvault.com'
    });
    
    console.log('Created ghost agent user:', ghostUser);
    
    // Update the user to be an AI agent
    await storage.updateUser(ghostUser.id, {
      userType: 'ai_agent',
      agentScript: 'ghost-agent.js'
    });
    
    // Register the FSN name for ghost
    const domain = await storage.registerFsnName('ghost', ghostUser.id);
    console.log('Registered ghost.fsn domain:', domain);
    
    return res.json({
      success: true,
      message: 'ghost.fsn agent registered successfully',
      user: ghostUser,
      domain
    });
  } catch (error) {
    console.error('Error registering ghost.fsn agent:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to register ghost.fsn agent'
    });
  }
});

// Endpoint to check if ghost.fsn exists
router.get('/check', async (req: Request, res: Response) => {
  try {
    const domain = await storage.getFsnDomain('ghost');
    return res.json({
      exists: !!domain,
      domain
    });
  } catch (error) {
    console.error('Error checking ghost.fsn:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check ghost.fsn status'
    });
  }
});

export default router;