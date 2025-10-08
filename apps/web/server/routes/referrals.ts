// Referral system routes
import { Router } from 'express';
import { leaderboardStorage } from '../storage/leaderboard';
import { ethers } from 'ethers';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Rate limiting for referral creation
const referralLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 referral attempts per hour per IP
  message: { success: false, error: 'Too many referral attempts' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Create a referral relationship
router.post('/create', referralLimiter, async (req, res) => {
  try {
    const { inviter, invitee } = req.body;

    // Validate addresses
    if (!ethers.isAddress(inviter) || !ethers.isAddress(invitee)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet addresses'
      });
    }

    // Prevent self-referral
    if (inviter.toLowerCase() === invitee.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot refer yourself'
      });
    }

    // Check if invitee already has a referrer
    const existingReferral = await leaderboardStorage.getReferralByInvitee(invitee);
    if (existingReferral) {
      return res.status(400).json({
        success: false,
        error: 'User already has a referrer'
      });
    }

    // Create referral relationship
    const referral = await leaderboardStorage.createReferral({
      inviter,
      invitee,
      activatedAt: null,
      qualifies: false,
      bonusAwarded: false,
      txHash: null
    });

    res.json({
      success: true,
      referral: {
        id: referral.id,
        inviter: referral.inviter,
        invitee: referral.invitee,
        createdAt: referral.createdAt
      }
    });

  } catch (error: any) {
    console.error('❌ Failed to create referral:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create referral'
    });
  }
});

// Activate a referral (called after name claim + first login)
router.post('/activate', async (req, res) => {
  try {
    const { invitee } = req.body;

    if (!ethers.isAddress(invitee)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid invitee address'
      });
    }

    // Find and activate referral
    const referral = await leaderboardStorage.activateReferral(invitee);
    
    if (!referral) {
      return res.status(404).json({
        success: false,
        error: 'No referral found for this address'
      });
    }

    res.json({
      success: true,
      message: 'Referral activated',
      referral: {
        id: referral.id,
        inviter: referral.inviter,
        invitee: referral.invitee,
        activatedAt: referral.activatedAt
      }
    });

  } catch (error: any) {
    console.error('❌ Failed to activate referral:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate referral'
    });
  }
});

// Check referral qualification status (7-day streak)
router.post('/qualify', async (req, res) => {
  try {
    const { invitee } = req.body;

    if (!ethers.isAddress(invitee)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid invitee address'
      });
    }

    // Get user's current streak
    const user = await leaderboardStorage.getUserByAddress(invitee);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user has 7+ day streak and referral exists
    if (user.streak >= 7) {
      const qualified = await leaderboardStorage.qualifyReferral(invitee);
      
      if (qualified) {
        res.json({
          success: true,
          message: 'Referral qualified for bonus',
          streak: user.streak
        });
      } else {
        res.json({
          success: false,
          error: 'No active referral found or already qualified'
        });
      }
    } else {
      res.json({
        success: false,
        error: `Need ${7 - user.streak} more days to qualify`,
        currentStreak: user.streak,
        requiredStreak: 7
      });
    }

  } catch (error: any) {
    console.error('❌ Failed to qualify referral:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check qualification'
    });
  }
});

// Get referral link (PUBLIC mode only)
router.get('/link/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address'
      });
    }

    // Only show referral links in PUBLIC mode
    if (process.env.VITE_APP_MODE !== 'PUBLIC') {
      return res.status(403).json({
        success: false,
        error: 'Referral links not available in current mode'
      });
    }

    // Generate referral link
    const baseUrl = req.get('host');
    const protocol = req.get('x-forwarded-proto') || 'http';
    const referralLink = `${protocol}://${baseUrl}/?ref=${address}`;

    res.json({
      success: true,
      address,
      referralLink,
      shortCode: address.slice(0, 8)
    });

  } catch (error: any) {
    console.error('❌ Failed to generate referral link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate link'
    });
  }
});

export default router;