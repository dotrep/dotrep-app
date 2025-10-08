// Route to mirror blockchain registrations to database
import { Router } from 'express';
import { storage } from '../storage';

const router = Router();

// Mirror FSN registration from blockchain to database
router.post('/mirror-registration', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Get user from session
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check if user already has a name in database
    const existingUser = await storage.getUserById(userId);
    if (existingUser?.fsnName) {
      return res.status(400).json({ error: 'User already has an FSN name' });
    }

    // Update user with FSN name
    await storage.updateUser(userId, { fsnName: name.toLowerCase() });

    // Award XP for FSN claiming (mirroring blockchain event)
    // This should also be handled by the XP awarding system
    // when it detects the blockchain event

    res.json({ success: true, name: name.toLowerCase() });
  } catch (error) {
    console.error('FSN mirror registration failed:', error);
    res.status(500).json({ error: 'Registration mirroring failed' });
  }
});

// Get DB-only stats (level, invites) without XP
router.get('/stats-db-only', async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return only non-XP stats
    res.json({
      level: user.level || 1,
      invitedCount: user.invitedCount || 0,
      fsnName: user.fsnName,
      username: user.username
    });
  } catch (error) {
    console.error('Failed to get DB stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;