import { Router } from 'express';
import { eq, desc, and, gt } from 'drizzle-orm';
import { db } from '../db';
// Rewards events temporarily disabled during schema migration
// import { rewardEvents } from '../../shared/schema';
import rewardsConfig from '../config/rewardsConfig';

const router = Router();

// GET /api/rewards/recent?limit=10 - Get recent reward events for authenticated user
router.get('/recent', async (req, res) => {
  try {
    // Check if rewards UI is enabled
    if (!rewardsConfig.enabled) {
      return res.status(404).json({ error: 'Rewards UI not enabled' });
    }

    // Check authentication
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50); // Max 50 items
    
    // Temporarily disabled during schema migration
    const events: any[] = [];
    /*
    const events = await db
      .select()
      .from(rewardEvents)
      .where(eq(rewardEvents.userId, req.session.userId))
      .orderBy(desc(rewardEvents.createdAt))
      .limit(limit);
    */

    // Map events to include friendly reason text
    const mappedEvents = events.map(event => ({
      ...event,
      friendlyReason: rewardsConfig.getFriendlyReason(event.reasonKey)
    }));

    res.json(mappedEvents);
  } catch (error) {
    console.error('Error fetching recent rewards:', error);
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
});

// GET /api/rewards/since?cursor=<iso> - Get reward events since a specific timestamp
router.get('/since', async (req, res) => {
  try {
    // Check if rewards UI is enabled
    if (!rewardsConfig.enabled) {
      return res.status(404).json({ error: 'Rewards UI not enabled' });
    }

    // Check authentication
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const cursor = req.query.cursor as string;
    if (!cursor) {
      return res.status(400).json({ error: 'Cursor parameter required' });
    }

    const cursorDate = new Date(cursor);
    if (isNaN(cursorDate.getTime())) {
      return res.status(400).json({ error: 'Invalid cursor date format' });
    }

    // Temporarily disabled during schema migration
    const events: any[] = [];
    /*
    const events = await db
      .select()
      .from(rewardEvents)
      .where(
        and(
          eq(rewardEvents.userId, req.session.userId),
          gt(rewardEvents.createdAt, cursorDate)
        )
      )
      .orderBy(desc(rewardEvents.createdAt))
      .limit(50); // Max 50 items
    */

    // Map events to include friendly reason text
    const mappedEvents = events.map(event => ({
      ...event,
      friendlyReason: rewardsConfig.getFriendlyReason(event.reasonKey)
    }));

    res.json(mappedEvents);
  } catch (error) {
    console.error('Error fetching rewards since cursor:', error);
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
});

export default router;