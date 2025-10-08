import express from 'express';
import { storage } from '../storage';

const router = express.Router();

/**
 * Get user settings
 */
router.get('/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID' 
      });
    }
    
    // Get user's settings from database
    const userStats = await storage.getUserStats(userId);
    
    // If user has no settings yet, return default settings
    if (!userStats || !userStats.settings) {
      return res.status(200).json({ 
        success: true, 
        settings: {
          blockNonContacts: false
        }
      });
    }
    
    // Parse settings from the JSON field
    let settings;
    try {
      settings = JSON.parse(userStats.settings);
    } catch (error) {
      settings = { blockNonContacts: false };
    }
    
    return res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error getting user settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user settings'
    });
  }
});

/**
 * Update user settings
 */
router.post('/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID' 
      });
    }
    
    // Get settings from request body
    const settings = req.body;
    
    // Validate settings
    if (typeof settings.blockNonContacts !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings format'
      });
    }
    
    // Convert settings to JSON string
    const settingsJson = JSON.stringify(settings);
    
    // Update user settings in database
    const userStats = await storage.getUserStats(userId);
    
    // Create or update user stats record
    if (!userStats) {
      await storage.updateUserStats(userId, {
        settings: settingsJson,
        xpPoints: 0,
        level: 1
      });
    } else {
      await storage.updateUserStats(userId, {
        settings: settingsJson
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user settings'
    });
  }
});

export default router;