import { Router } from 'express';
import { storage } from '../storage';
import { FEATURE_FLAGS } from '../config/feature-flags';

const router = Router();

// Beacon RECAST endpoint - Phase 0 implementation
router.post('/recast', async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check feature flag
    if (FEATURE_FLAGS.BEACON_RECAST === 'trust') {
      return res.status(403).json({ 
        error: 'trust_handoff_required',
        message: 'Trust verification required for beacon recast'
      });
    }

    if (!FEATURE_FLAGS.TRUST && FEATURE_FLAGS.BEACON_RECAST === 'trust') {
      return res.status(403).json({ 
        error: 'trust_disabled_phase0',
        message: 'Trust system disabled in Phase 0'
      });
    }

    // Get user and check cooldown
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check cooldown using last_recast_at
    const now = new Date();
    const lastRecastAt = user.lastRecastAt ? new Date(user.lastRecastAt) : null;
    const cooldownMs = FEATURE_FLAGS.RECAST_COOLDOWN_SECONDS * 1000;
    
    if (lastRecastAt) {
      const timeSinceLastRecast = now.getTime() - lastRecastAt.getTime();
      if (timeSinceLastRecast < cooldownMs) {
        const cooldownRemaining = Math.ceil((cooldownMs - timeSinceLastRecast) / 1000);
        return res.status(429).json({ 
          error: 'cooldown_active',
          cooldown_remaining: cooldownRemaining,
          message: `Beacon recast available in ${Math.ceil(cooldownRemaining / 3600)} hours`
        });
      }
    }

    // Perform recast: increment broadcasts, update streak, award XP
    const updatedUser = await storage.performBeaconRecast(userId, {
      xpReward: FEATURE_FLAGS.XP_RECAST_AWARD,
      recastTime: now
    });

    // Track XP transaction
    await storage.recordXPTransaction({
      userId,
      type: 'beacon_recast',
      amount: FEATURE_FLAGS.XP_RECAST_AWARD,
      source: 'beacon',
      metadata: {
        cooldown_seconds: FEATURE_FLAGS.RECAST_COOLDOWN_SECONDS,
        client_ts: now.toISOString()
      }
    });

    // Return success response
    // Get updated streak information 
    const userStats = await storage.getUserStats(userId);
    
    res.json({
      broadcasts_total: updatedUser.broadcastsTotal || 0,
      streak_days: updatedUser.beaconStreakDays || 1,
      xp_awarded: FEATURE_FLAGS.XP_RECAST_AWARD,
      cooldown_remaining: 0
    });

  } catch (error) {
    console.error('Beacon recast error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recast status (cooldown info)
router.post('/recast/status', async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const now = new Date();
    const lastRecastAt = user.lastRecastAt ? new Date(user.lastRecastAt) : null;
    const cooldownMs = FEATURE_FLAGS.RECAST_COOLDOWN_SECONDS * 1000;
    
    let cooldownRemaining = 0;
    let canRecast = true;

    if (lastRecastAt) {
      const timeSinceLastRecast = now.getTime() - lastRecastAt.getTime();
      if (timeSinceLastRecast < cooldownMs) {
        cooldownRemaining = Math.ceil((cooldownMs - timeSinceLastRecast) / 1000);
        canRecast = false;
      }
    }

    res.json({
      can_recast: canRecast,
      cooldown_remaining: cooldownRemaining,
      next_recast_available: lastRecastAt ? new Date(lastRecastAt.getTime() + cooldownMs).toISOString() : now.toISOString(),
      feature_mode: FEATURE_FLAGS.BEACON_RECAST
    });

  } catch (error) {
    console.error('Beacon recast status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;