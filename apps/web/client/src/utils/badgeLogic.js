// Badge logic and status checking utilities

export const badgeMeta = {
  onboarding: { 
    rarity: 'common', 
    soulbound: true, 
    xpBonus: 50,
    title: 'Onboarding',
    description: 'Complete FSN identity setup'
  },
  coreSignal: { 
    rarity: 'rare', 
    soulbound: true, 
    xpBonus: 0,
    title: 'Core Signal',
    description: 'Unlock Signal functionality'
  },
  trustVerified: { 
    rarity: 'uncommon', 
    soulbound: true, 
    xpBonus: 75,
    title: 'Trust Verified',
    description: 'Complete identity verification'
  },
  hexMapFragment: { 
    rarity: 'rare', 
    soulbound: true, 
    xpBonus: 100,
    title: 'Hex Map Fragment',
    description: 'Discover hidden frequency'
  },
  sentinel: { 
    rarity: 'uncommon', 
    soulbound: true, 
    xpBonus: 150,
    title: 'Sentinel',
    description: 'Maintain 7-day activity streak'
  },
  signalRank: { 
    rarity: 'rare', 
    soulbound: true, 
    xpBonus: 200,
    title: 'Signal Rank',
    description: 'Complete 10 signal broadcasts'
  },
  fsnRelinked: { 
    rarity: 'legendary', 
    soulbound: true, 
    xpBonus: 300,
    title: 'FSN Re-linked',
    description: 'Reconnect lost network nodes'
  },
  chainlinkMaster: { 
    rarity: 'legendary', 
    soulbound: true, 
    xpBonus: 500,
    title: 'Chainlink Master',
    description: 'Master blockchain integration'
  },
  genesis: { 
    rarity: 'legendary', 
    soulbound: true, 
    xpBonus: 1000,
    title: 'Genesis',
    description: 'First wave FSN pioneer'
  }
};

export const cosmeticItems = {
  signalCastParticleTrail: {
    id: "signalCastParticleTrail",
    type: "signalEffect",
    cost: 200,
    cosmetic: true,
    equipSlot: "signal",
    title: "Signal Cast Particle Trail",
    rarity: "uncommon"
  },
  vaultNeonFrame: {
    id: "vaultNeonFrame",
    type: "vaultEffect", 
    cost: 150,
    cosmetic: true,
    equipSlot: "vault",
    title: "Vault Neon Frame",
    rarity: "common"
  },
  rareBeaconBadge: {
    id: "rareBeaconBadge",
    type: "beaconEffect",
    cost: 350,
    cosmetic: true,
    equipSlot: "beacon", 
    title: "Rare Beacon Badge",
    rarity: "rare"
  }
};

/**
 * Check which badges a user has earned based on their progress
 */
export function checkBadgeStatus(userStats, userProgress = {}) {
  if (!userStats) return {};

  const earnedBadges = {};
  
  // Onboarding badge - complete profile setup
  earnedBadges.onboarding = Boolean(
    (userStats.xpPoints >= 15 && userProgress.profileComplete !== false) ||
    localStorage.getItem('onboardingBadgeUnlocked') === 'true'
  );
  
  // Core Signal badge - Signal functionality unlocked
  earnedBadges.coreSignal = Boolean(
    userStats.signalUnlocked === true ||
    userProgress.signalUnlocked === true ||
    userStats.xpPoints >= 50 || // Lowered XP threshold
    localStorage.getItem('coreSignalBadgeUnlocked') === 'true'
  );
  
  // Trust Verified badge - Complete verification process
  earnedBadges.trustVerified = Boolean(
    userProgress.trust?.verified === true ||
    userStats.verificationComplete === true ||
    userStats.xpPoints >= 100 || // Lowered XP threshold
    userStats.pulseScore >= 70 || // Pulse score indicates verification
    localStorage.getItem('trustBadgeUnlocked') === 'true' // Manual override for unlocked badge
  );
  
  // Hex Map Fragment - Discover special frequency
  earnedBadges.hexMapFragment = Boolean(
    userProgress.specialFrequencyFound === true ||
    (userStats.signalBroadcasts && userStats.signalBroadcasts >= 5)
  );
  
  // Sentinel - Maintain activity streak
  earnedBadges.sentinel = Boolean(
    userProgress.activityStreak >= 7 ||
    userStats.consecutiveDays >= 7
  );
  
  // Signal Rank - Complete broadcasts
  earnedBadges.signalRank = Boolean(
    userStats.signalBroadcasts >= 10 ||
    (userProgress.broadcasts && userProgress.broadcasts.length >= 10)
  );
  
  // FSN Re-linked - Advanced network activity
  earnedBadges.fsnRelinked = Boolean(
    userStats.xpPoints >= 1000 &&
    userStats.signalBroadcasts >= 25
  );
  
  // Chainlink Master - Blockchain integration
  earnedBadges.chainlinkMaster = Boolean(
    userStats.xpPoints >= 2000 &&
    userProgress.blockchainConnected === true
  );
  
  // Genesis - Pioneer status
  earnedBadges.genesis = Boolean(
    userProgress.betaTester === true ||
    userStats.accountAge >= 30 // Early adopter
  );

  return earnedBadges;
}

/**
 * Get user's equipped badge
 */
export function getEquippedBadge(userProgress = {}) {
  return userProgress.equippedBadge || null;
}

/**
 * Set user's equipped badge (only one at a time)
 */
export function setEquippedBadge(badgeId, userProgress = {}) {
  const earnedBadges = checkBadgeStatus(null, userProgress);
  
  if (earnedBadges[badgeId]) {
    return {
      ...userProgress,
      equippedBadge: badgeId
    };
  }
  
  return userProgress;
}

/**
 * Get badge display data with status
 */
export function getBadgeDisplayData(badgeId, userStats, userProgress = {}) {
  const meta = badgeMeta[badgeId];
  if (!meta) return null;
  
  const earnedBadges = checkBadgeStatus(userStats, userProgress);
  const equippedBadge = getEquippedBadge(userProgress);
  
  // Map badge IDs to their status keys
  const statusKeyMap = {
    'badge_onboarding': 'onboarding',
    'badge_trust_verified': 'trustVerified', 
    'badge_core_signal': 'coreSignal',
    'badge_hex_map_fragment': 'hexMapFragment',
    'badge_sentinel': 'sentinel',
    'badge_signal_rank': 'signalRank', 
    'badge_fsn_relinked': 'fsnRelinked',
    'badge_chainlink_master': 'chainlinkMaster',
    'badge_genesis': 'genesis'
  };
  
  const statusKey = statusKeyMap[badgeId] || badgeId;
  const isEarned = earnedBadges[statusKey] || false;
  
  console.log(`🔧 getBadgeDisplayData for ${badgeId}:`, {
    statusKey,
    isEarned,
    earnedBadges,
    userStatsXP: userStats?.xpPoints || 0
  });
  
  return {
    id: badgeId,
    ...meta,
    earned: isEarned,
    equipped: equippedBadge === badgeId
  };
}

/**
 * Filter and sort badges for display
 */
export function filterAndSortBadges(badges, filter = 'all', sortBy = 'rarity') {
  let filtered = badges;
  
  // Apply filter
  switch(filter) {
    case 'earned':
      filtered = badges.filter(badge => badge.earned);
      break;
    case 'locked':
      filtered = badges.filter(badge => !badge.earned);
      break;
    case 'all':
    default:
      break;
  }
  
  // Apply sort
  switch(sortBy) {
    case 'rarity':
      const rarityOrder = { legendary: 4, rare: 3, uncommon: 2, common: 1 };
      filtered.sort((a, b) => (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0));
      break;
    case 'xpValue':
      filtered.sort((a, b) => (b.xpBonus || 0) - (a.xpBonus || 0));
      break;
    case 'mostRecent':
      // Sort by earned status first, then by rarity
      filtered.sort((a, b) => {
        if (a.earned !== b.earned) return b.earned - a.earned;
        return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
      });
      break;
    default:
      break;
  }
  
  return filtered;
}

/**
 * Get all available badges with their current status
 */
export function getAllBadges(userStats, userProgress = {}) {
  return Object.keys(badgeMeta).map(badgeId => 
    getBadgeDisplayData(badgeId, userStats, userProgress)
  ).filter(Boolean);
}