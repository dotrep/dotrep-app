import { Router } from "express";
import { storage } from "../storage";
import { 
  insertDiscStatsSchema, 
  insertDiscLeaderboardSchema, 
  insertDiscAchievementsSchema,
  type DiscStats,
  type DiscLeaderboard 
} from "@shared/schema";

const router = Router();

// Get user's DISC stats
router.get("/disc-stats/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const stats = await storage.getDiscStats(userId);
    
    if (!stats) {
      // Create initial stats
      const newStats = await storage.createDiscStats({
        userId,
        highScore: 0,
        currentXp: 0,
        level: 1,
        gamesPlayed: 0,
        totalTargetsHit: 0,
        totalDiscsThrown: 0,
        bestAccuracy: 0
      });
      return res.json(newStats);
    }
    
    res.json(stats);
  } catch (error) {
    console.error("Error fetching DISC stats:", error);
    res.status(500).json({ message: "Failed to fetch DISC stats" });
  }
});

// Update user's DISC stats
router.post("/disc-stats", async (req, res) => {
  try {
    const { userId, score, xp, level } = req.body;
    
    // Get current stats
    let stats = await storage.getDiscStats(userId);
    
    if (!stats) {
      // Create new stats
      stats = await storage.createDiscStats({
        userId,
        highScore: score,
        currentXp: xp,
        level,
        gamesPlayed: 1,
        totalTargetsHit: 0,
        totalDiscsThrown: 0,
        bestAccuracy: 0
      });
    } else {
      // Update existing stats
      const updateData = {
        ...stats,
        highScore: Math.max(stats.highScore || 0, score),
        currentXp: xp,
        level,
        gamesPlayed: (stats.gamesPlayed || 0) + 1,
      };
      
      stats = await storage.updateDiscStats(userId, updateData);
    }
    
    // Add to leaderboard if high score
    if (score > 0) {
      await storage.addToDiscLeaderboard({
        userId,
        score,
        level,
        accuracy: 100, // Calculate based on actual gameplay
        seasonId: "season_1"
      });
    }
    
    res.json(stats);
  } catch (error) {
    console.error("Error updating DISC stats:", error);
    res.status(500).json({ message: "Failed to update DISC stats" });
  }
});

// Get leaderboard
router.get("/disc-leaderboard", async (req, res) => {
  try {
    const { season = "season_1", limit = 10 } = req.query;
    const leaderboard = await storage.getDiscLeaderboard(season as string, parseInt(limit as string));
    res.json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
});

// Get user achievements
router.get("/disc-achievements/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const achievements = await storage.getDiscAchievements(userId);
    res.json(achievements);
  } catch (error) {
    console.error("Error fetching achievements:", error);
    res.status(500).json({ message: "Failed to fetch achievements" });
  }
});

// Award XP to user's main FSN account
router.post("/disc-award-xp", async (req, res) => {
  try {
    const { userId, xpAmount } = req.body;
    
    // Get current user stats
    const userStats = await storage.getUserStats(userId);
    if (userStats) {
      const newXpPoints = (userStats.xpPoints || 0) + xpAmount;
      await storage.updateUserStats(userId, { xpPoints: newXpPoints });
    }
    
    res.json({ success: true, xpAwarded: xpAmount });
  } catch (error) {
    console.error("Error awarding XP:", error);
    res.status(500).json({ message: "Failed to award XP" });
  }
});

export default router;