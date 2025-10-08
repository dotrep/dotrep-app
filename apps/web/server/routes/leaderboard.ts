// Leaderboard routes with fast DB queries and on-chain verification
import { Router } from 'express';
import { leaderboardStorage } from '../storage/leaderboard';
import { ethers } from 'ethers';

const router = Router();

// Get leaderboard rankings
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const offset = parseInt(req.query.offset as string) || 0;

    // Fast query using xp_mirror for rankings
    const leaderboard = await leaderboardStorage.getLeaderboard(limit, offset);

    res.json({
      success: true,
      leaderboard: leaderboard.map((user, index) => ({
        rank: offset + index + 1,
        address: user.address,
        name: user.name || `${user.address.slice(0, 6)}...${user.address.slice(-4)}`,
        xpMirror: user.xpMirror,
        streak: user.streak,
        lastSeen: user.lastSeen
      })),
      count: leaderboard.length,
      hasMore: leaderboard.length === limit
    });

  } catch (error: any) {
    console.error('❌ Failed to get leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load leaderboard'
    });
  }
});

// Verify user's on-chain XP total
router.get('/verify/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address'
      });
    }

    // Get current mirror value from DB
    const user = await leaderboardStorage.getUserByAddress(address);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get on-chain total (if Points contract is available)
    let onChainTotal = null;
    let verified = false;

    const pointsAddress = process.env.POINTS_ADDRESS;
    const rpcUrl = process.env.RPC_URL;

    if (pointsAddress && rpcUrl && process.env.AWARD_ONCHAIN === 'true') {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const pointsContract = new ethers.Contract(
          pointsAddress,
          ['function totalOf(address) view returns (uint256)'],
          provider
        );

        onChainTotal = await pointsContract.totalOf(address);
        onChainTotal = parseInt(onChainTotal.toString());
        verified = onChainTotal >= user.xpMirror;

      } catch (contractError) {
        console.warn('Contract verification failed:', contractError);
      }
    }

    res.json({
      success: true,
      address,
      xpMirror: user.xpMirror,
      onChainTotal,
      verified,
      lastSeen: user.lastSeen,
      streak: user.streak
    });

  } catch (error: any) {
    console.error('❌ Failed to verify address:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed'
    });
  }
});

// Get user's referral statistics
router.get('/referrals/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address'
      });
    }

    const stats = await leaderboardStorage.getReferralStats(address);

    res.json({
      success: true,
      address,
      ...stats
    });

  } catch (error: any) {
    console.error('❌ Failed to get referral stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load referral statistics'
    });
  }
});

export default router;