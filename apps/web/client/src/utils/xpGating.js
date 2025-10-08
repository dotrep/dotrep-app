// XP-based gating logic for FSN features
// This module handles level calculation, unlock conditions, and progression tracking

// Level calculation based on XP with proper thresholds
export function getUserLevel(xp) {
  const safeXP = xp || 0;
  if (safeXP >= 750) return 5;
  if (safeXP >= 500) return 4;
  if (safeXP >= 250) return 3;
  if (safeXP >= 100) return 2;
  return 1;
}

// Get XP required for next level
export function getXPForNextLevel(currentXP) {
  const safeXP = currentXP || 0;
  if (safeXP >= 750) return 1000; // Max level cap
  if (safeXP >= 500) return 750;
  if (safeXP >= 250) return 500;
  if (safeXP >= 100) return 250;
  return 100;
}

// Get XP needed to reach next level
export function getXPToNextLevel(currentXP) {
  const safeXP = currentXP || 0;
  const nextLevelXP = getXPForNextLevel(safeXP);
  return Math.max(0, nextLevelXP - safeXP);
}

// Vault tier logic
export function getVaultTier(xp) {
  const safeXP = xp || 0;
  if (safeXP >= 750) return 'Sentinel';
  if (safeXP >= 250) return 'Navigator';
  return 'Explorer';
}

export function getVaultLimits(tier) {
  switch (tier) {
    case 'Sentinel':
      return { files: 20, nfts: 5 };
    case 'Navigator':
      return { files: 10, nfts: 3 };
    default:
      return { files: 5, nfts: 1 };
  }
}

export function getVaultTierRequirements(tier) {
  switch (tier) {
    case 'Sentinel':
      return { xp: 750, name: 'Sentinel', color: '#ff6b6b' };
    case 'Navigator':
      return { xp: 250, name: 'Navigator', color: '#4ecdc4' };
    default:
      return { xp: 0, name: 'Explorer', color: '#95a5a6' };
  }
}

// Signal unlock conditions
export function isSignalUnlocked(userStats) {
  const xp = userStats?.xpPoints || 0;
  
  return {
    unlocked: xp >= 60,
    conditions: {
      xp: { current: xp, required: 60, met: xp >= 60 }
    }
  };
}

// Beacon unlock conditions
export function isBeaconUnlocked(userStats, loginStreak) {
  const signalStatus = isSignalUnlocked(userStats);
  const xp = userStats?.xpPoints || 0;
  const streak = loginStreak || 0;
  
  return {
    unlocked: signalStatus.unlocked && xp >= 500 && streak >= 3,
    conditions: {
      signal: { met: signalStatus.unlocked },
      xp: { current: xp, required: 500, met: xp >= 500 },
      streak: { current: streak, required: 3, met: streak >= 3 }
    }
  };
}

// Safe XP calculation helper
export function safeXPCalc(value1, value2, operation = 'add') {
  const safe1 = parseFloat(value1) || 0;
  const safe2 = parseFloat(value2) || 0;
  
  switch (operation) {
    case 'subtract':
      return Math.max(0, safe1 - safe2);
    case 'multiply':
      return safe1 * safe2;
    case 'divide':
      return safe2 !== 0 ? safe1 / safe2 : 0;
    default:
      return safe1 + safe2;
  }
}

// Level up detection
export function checkLevelUp(oldXP, newXP) {
  const oldLevel = getUserLevel(oldXP);
  const newLevel = getUserLevel(newXP);
  
  if (newLevel > oldLevel) {
    return {
      leveledUp: true,
      newLevel,
      oldLevel,
      message: `Level Up! You're now Level ${newLevel} - ${getVaultTier(newXP)} Tier unlocked!`
    };
  }
  
  return { leveledUp: false, newLevel, oldLevel };
}

// Get level progress percentage
export function getLevelProgress(currentXP) {
  const safeXP = currentXP || 0;
  const currentLevel = getUserLevel(safeXP);
  const nextLevelXP = getXPForNextLevel(safeXP);
  
  let currentLevelMin = 0;
  if (currentLevel === 2) currentLevelMin = 100;
  else if (currentLevel === 3) currentLevelMin = 250;
  else if (currentLevel === 4) currentLevelMin = 500;
  else if (currentLevel === 5) currentLevelMin = 750;
  
  const progressInLevel = safeXP - currentLevelMin;
  const totalNeededForLevel = nextLevelXP - currentLevelMin;
  
  return {
    progress: Math.max(0, progressInLevel),
    total: totalNeededForLevel,
    percentage: totalNeededForLevel > 0 ? Math.min(100, (progressInLevel / totalNeededForLevel) * 100) : 100
  };
}

export default {
  getUserLevel,
  getXPForNextLevel,
  getXPToNextLevel,
  getVaultTier,
  getVaultLimits,
  getVaultTierRequirements,
  isSignalUnlocked,
  isBeaconUnlocked,
  safeXPCalc,
  checkLevelUp,
  getLevelProgress
};