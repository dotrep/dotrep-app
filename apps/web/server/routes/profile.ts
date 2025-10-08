import { Router } from 'express';
import { storage } from '../storage';

const router = Router();

// Update user profile settings (avatar, hex style, etc.)
router.patch('/api/user/profile/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const updates = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    // Get current user stats
    const currentStats = await storage.getUserStats(userId);
    if (!currentStats) {
      return res.status(404).json({ success: false, message: 'User stats not found' });
    }

    // Update the profile fields
    const updatedStats = { ...currentStats, ...updates };
    await storage.updateUserStats(userId, updatedStats);

    return res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      data: updatedStats
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile' 
    });
  }
});

// Get user activity hours for avatar auto-assignment
router.get('/api/user/activity/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    // In a real implementation, this would track actual user activity
    // For now, return sample data or empty array
    const activityHours = ['09:00', '14:00', '20:00']; // Sample activity pattern

    return res.json({ 
      success: true, 
      activityHours 
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch activity data' 
    });
  }
});

// Update activity hours (called when user is active)
router.post('/api/user/activity/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { hour } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    // Get current user stats
    const currentStats = await storage.getUserStats(userId);
    if (!currentStats) {
      return res.status(404).json({ success: false, message: 'User stats not found' });
    }

    // Parse existing activity hours
    let activityHours = [];
    try {
      activityHours = currentStats.activityHours ? JSON.parse(currentStats.activityHours) : [];
    } catch (e) {
      activityHours = [];
    }

    // Add current hour if not already tracked
    const currentHour = hour || new Date().getHours().toString().padStart(2, '0') + ':00';
    if (!activityHours.includes(currentHour)) {
      activityHours.push(currentHour);
      
      // Keep only last 24 hours of activity
      if (activityHours.length > 24) {
        activityHours = activityHours.slice(-24);
      }
    }

    // Update user stats with new activity hours
    await storage.updateUserStats(userId, {
      ...currentStats,
      activityHours: JSON.stringify(activityHours),
      lastActive: new Date()
    });

    return res.json({ 
      success: true, 
      activityHours 
    });
  } catch (error) {
    console.error('Error updating user activity:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to update activity' 
    });
  }
});

export default router;