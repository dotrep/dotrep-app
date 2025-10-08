// Cron endpoints for daily XP minting
import { Router } from 'express';
import { mintDailyXP, getDailyXPStats, getUserXPLogs } from '../services/dailyXPMinting';

const router = Router();

// Security: Rate limiting and secret token for cron endpoints
const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret-change-in-production';

function verifyCronSecret(req: any, res: any, next: any) {
  const providedSecret = req.headers['x-cron-secret'] || req.query.secret;
  
  if (providedSecret !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized: Invalid cron secret' });
  }
  
  next();
}

// Daily XP minting endpoint - to be called by external cron at 00:05 UTC
router.post('/award', verifyCronSecret, async (req, res) => {
  try {
    console.log('🎯 Daily XP award cron triggered');
    
    const startTime = Date.now();
    const results = await mintDailyXP();
    const duration = Date.now() - startTime;
    
    const response = {
      success: true,
      message: `Daily XP minting completed in ${duration}ms`,
      stats: {
        processed: results.processed,
        successful: results.successful,
        failed: results.failed,
        duration: duration
      },
      errors: results.errors.length > 0 ? results.errors : undefined
    };
    
    console.log('Daily XP award results:', response);
    res.json(response);
    
  } catch (error) {
    console.error('Daily XP award cron failed:', error);
    res.status(500).json({
      success: false,
      error: 'Daily XP minting failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get daily XP stats endpoint
router.get('/daily-stats', verifyCronSecret, async (req, res) => {
  try {
    const dayKey = req.query.day as string;
    const stats = await getDailyXPStats(dayKey);
    
    if (!stats) {
      return res.status(404).json({ error: 'No stats found for the specified day' });
    }
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Failed to get daily XP stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get daily stats'
    });
  }
});

// Get user XP logs endpoint
router.get('/user-logs/:address', verifyCronSecret, async (req, res) => {
  try {
    const { address } = req.params;
    const dayKey = req.query.day as string;
    
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }
    
    const logs = await getUserXPLogs(address, dayKey);
    
    res.json({
      success: true,
      address,
      dayKey: dayKey || 'all',
      logs
    });
    
  } catch (error) {
    console.error('Failed to get user XP logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user logs'
    });
  }
});

// Health check for cron service
router.get('/health', (req, res) => {
  const config = {
    AWARD_ONCHAIN: process.env.AWARD_ONCHAIN === 'true',
    RPC_URL: process.env.RPC_URL || 'http://127.0.0.1:8545',
    POINTS_ADDRESS: process.env.POINTS_ADDRESS || 'not-set',
    AWARD_XP_DAILY: parseInt(process.env.AWARD_XP_DAILY || '10'),
    HAS_PRIVATE_KEY: !!process.env.AWARD_PRIVATE_KEY,
  };
  
  res.json({
    success: true,
    message: 'Cron service is healthy',
    config: {
      ...config,
      AWARD_PRIVATE_KEY: config.HAS_PRIVATE_KEY ? '[CONFIGURED]' : '[NOT SET]'
    },
    timestamp: new Date().toISOString()
  });
});

export default router;