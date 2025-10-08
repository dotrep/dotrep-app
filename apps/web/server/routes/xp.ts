// XP Management API Routes
import { Router } from 'express';
import { XPEngine } from '../xpEngine';
import { XP_ACTIONS, getXPValue, getXPAction, getXPActionsByCategory } from '../../shared/xpActions';

const router = Router();

// Get all available XP actions with their point values
router.get('/api/xp/actions', async (req, res) => {
  try {
    return res.json({
      success: true,
      actions: XP_ACTIONS,
      totalActions: Object.keys(XP_ACTIONS).length
    });
  } catch (error) {
    console.error('Error fetching XP actions:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch XP actions' 
    });
  }
});

// Get XP actions by category
router.get('/api/xp/actions/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const actions = getXPActionsByCategory(category as any);
    
    return res.json({
      success: true,
      category,
      actions,
      count: Object.keys(actions).length
    });
  } catch (error) {
    console.error('Error fetching XP actions by category:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch XP actions by category' 
    });
  }
});

// Award XP to a user for a specific action
router.post('/api/xp/award', async (req, res) => {
  try {
    const { userId, action, metadata } = req.body;
    
    if (!userId || !action) {
      return res.status(400).json({
        success: false,
        error: 'User ID and action are required'
      });
    }

    const result = await XPEngine.awardXP(parseInt(userId), action, metadata);
    
    if (result.success) {
      return res.json({
        success: true,
        ...result
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to award XP'
      });
    }
  } catch (error) {
    console.error('Error awarding XP:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get user's total XP
router.get('/api/xp/user/:userId/total', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    const totalXP = await XPEngine.getUserTotalXP(userId);
    
    return res.json({
      success: true,
      userId,
      totalXP
    });
  } catch (error) {
    console.error('Error fetching user XP:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch user XP' 
    });
  }
});

// Get user's XP breakdown by category
router.get('/api/xp/user/:userId/breakdown', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    const breakdown = await XPEngine.getUserXPByCategory(userId);
    const totalXP = await XPEngine.getUserTotalXP(userId);
    
    return res.json({
      success: true,
      userId,
      totalXP,
      breakdown
    });
  } catch (error) {
    console.error('Error fetching user XP breakdown:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch user XP breakdown' 
    });
  }
});

// Get user's recent XP activity
router.get('/api/xp/user/:userId/activity', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    const activity = await XPEngine.getUserRecentActivity(userId, limit);
    
    return res.json({
      success: true,
      userId,
      activity,
      count: activity.length
    });
  } catch (error) {
    console.error('Error fetching user XP activity:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch user XP activity' 
    });
  }
});

// Bulk award XP for multiple actions
router.post('/api/xp/bulk-award', async (req, res) => {
  try {
    const { userId, actions } = req.body;
    
    if (!userId || !Array.isArray(actions)) {
      return res.status(400).json({
        success: false,
        error: 'User ID and actions array are required'
      });
    }

    const result = await XPEngine.bulkAwardXP(parseInt(userId), actions);
    
    return res.json({
      success: true,
      userId,
      ...result
    });
  } catch (error) {
    console.error('Error bulk awarding XP:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Utility endpoint to get XP value for a specific action
router.get('/api/xp/action/:actionKey/value', async (req, res) => {
  try {
    const { actionKey } = req.params;
    const action = getXPAction(actionKey);
    
    if (!action) {
      return res.status(404).json({
        success: false,
        error: 'Action not found'
      });
    }

    return res.json({
      success: true,
      action: actionKey,
      points: action.points,
      description: action.description,
      category: action.category,
      oneTime: action.oneTime || false
    });
  } catch (error) {
    console.error('Error fetching action value:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch action value' 
    });
  }
});

export default router;