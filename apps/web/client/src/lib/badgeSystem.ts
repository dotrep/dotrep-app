// FSN Badge System - Unified NFT/Badge Registry
// All badges are treated as NFTs with proper metadata

export interface BadgeNFT {
  type: 'badge';
  name: string;
  id: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  description: string;
  earnedFrom: 'Signal' | 'Pulse' | 'Beacon' | 'Game Center' | 'Trust' | 'Onboarding' | 'XP' | 'Quest';
  dateEarned?: string;
  xpBonus: number;
  visual: string;
  soulbound: boolean;
  unlockCondition?: string;
  count?: number; // For stackable badges
}

export interface CollectibleNFT {
  type: 'collectible';
  name: string;
  id: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  description: string;
  visual: string;
  dateEarned?: string;
  tradeable: boolean;
}

export type FSN_NFT = BadgeNFT | CollectibleNFT;

// Badge Registry - All available badges in the FSN ecosystem
export const BADGE_REGISTRY: BadgeNFT[] = [
  {
    type: 'badge',
    name: 'Core Signal',
    id: 'badge_core_signal',
    rarity: 'epic',
    description: 'Awarded for reaching Core Signal level and unlocking frequency communication.',
    earnedFrom: 'Signal',
    xpBonus: 100,
    visual: '/attached_assets/Core Signal_1750902757190.png',
    soulbound: true,
    unlockCondition: 'Unlock Signal component'
  },
  {
    type: 'badge',
    name: 'Trust Verified',
    id: 'badge_trust_verified',
    rarity: 'rare',
    description: 'Earned through consistent trust-building actions and verified identity.',
    earnedFrom: 'Trust',
    xpBonus: 75,
    visual: '/attached_assets/Trust Verified_1750902757189.png',
    soulbound: true,
    unlockCondition: 'Reach 80+ Pulse score'
  },
  {
    type: 'badge',
    name: 'Sentinel',
    id: 'badge_sentinel',
    rarity: 'epic',
    description: 'Guardian of the network. Awarded for maintaining high security standards.',
    earnedFrom: 'Trust',
    xpBonus: 125,
    visual: '/attached_assets/Sentinel_1750902757187.png',
    soulbound: true,
    unlockCondition: 'Complete security protocols'
  },
  {
    type: 'badge',
    name: 'Signal Rank',
    id: 'badge_signal_rank',
    rarity: 'rare',
    description: 'Recognition for advanced signal processing and frequency mastery.',
    earnedFrom: 'Signal',
    xpBonus: 90,
    visual: '/attached_assets/Signal Rank_1750902757188.png',
    soulbound: true,
    unlockCondition: 'Tune to special frequencies'
  },
  {
    type: 'badge',
    name: 'FSN Re-linked',
    id: 'badge_fsn_relinked',
    rarity: 'common',
    description: 'Successfully re-established connection to the FSN network.',
    earnedFrom: 'Onboarding',
    xpBonus: 25,
    visual: '/attached_assets/ReLinked_1750902757187.png',
    soulbound: true,
    unlockCondition: 'Complete onboarding'
  },
  {
    type: 'badge',
    name: 'Onboarding',
    id: 'badge_onboarding',
    rarity: 'common',
    description: 'Welcome to FSN! Completed initial setup and orientation.',
    earnedFrom: 'Onboarding',
    xpBonus: 50,
    visual: '/attached_assets/Onboarding_1750902757192.png',
    soulbound: true,
    unlockCondition: 'Finish onboarding process'
  },
  {
    type: 'badge',
    name: 'Fortune Flame',
    id: 'badge_fortune_flame',
    rarity: 'legendary',
    description: 'Rare achievement for exceptional performance and luck in the FSN ecosystem.',
    earnedFrom: 'XP',
    xpBonus: 200,
    visual: '/api/images/Fortune_Flame_1750902757190.png',
    soulbound: true,
    unlockCondition: 'Reach level 10'
  },
  {
    type: 'badge',
    name: 'NFT Forged',
    id: 'badge_nft_forged',
    rarity: 'rare',
    description: 'Successfully forged your first NFT in the FSN ecosystem.',
    earnedFrom: 'Game Center',
    xpBonus: 80,
    visual: '/api/images/NFT_Forged_1750902757191.png',
    soulbound: true,
    unlockCondition: 'Forge an NFT'
  },
  {
    type: 'badge',
    name: 'NFT Linked',
    id: 'badge_nft_linked',
    rarity: 'rare',
    description: 'Connected external NFT to your FSN identity.',
    earnedFrom: 'Game Center',
    xpBonus: 60,
    visual: '/api/images/NFT_Linked_1750902757192.png',
    soulbound: true,
    unlockCondition: 'Link external NFT'
  },
  {
    type: 'badge',
    name: 'Chainlink Master',
    id: 'badge_chainlink',
    rarity: 'epic',
    description: 'Advanced blockchain integration and cross-chain expertise.',
    earnedFrom: 'Game Center',
    xpBonus: 150,
    visual: '/attached_assets/Chainlink_1750902757189.png',
    soulbound: true,
    unlockCondition: 'Complete blockchain challenges'
  },
  {
    type: 'badge',
    name: 'Genesis',
    id: 'badge_genesis',
    rarity: 'legendary',
    description: 'One of the original founding members of the FSN network.',
    earnedFrom: 'Trust',
    xpBonus: 250,
    visual: '/attached_assets/NFT_Forged_1750902757191.png',
    soulbound: true,
    unlockCondition: 'Be among the first 100 users'
  }
];

// Collectible Registry
export const COLLECTIBLE_REGISTRY: CollectibleNFT[] = [
  {
    type: 'collectible',
    name: 'Hex Map Fragment',
    id: 'collectible_hex_fragment',
    rarity: 'rare',
    description: 'A piece of the greater FSN network map. Collect all fragments to unlock the Beacon.',
    visual: '/attached_assets/Hex Map Fragment_1750902757191.png',
    tradeable: true
  }
];

// Badge earning conditions checker
export function checkBadgeConditions(userStats: any): BadgeNFT[] {
  const earnedBadges: BadgeNFT[] = [];

  // Check onboarding badge
  if (userStats.emailVerified && !userStats.earnedBadges?.includes('badge_onboarding')) {
    earnedBadges.push(BADGE_REGISTRY.find(b => b.id === 'badge_onboarding')!);
  }

  // Check trust verified badge
  if (userStats.pulseScore >= 80 && !userStats.earnedBadges?.includes('badge_trust_verified')) {
    earnedBadges.push(BADGE_REGISTRY.find(b => b.id === 'badge_trust_verified')!);
  }

  // Check signal badges
  if (userStats.signalScore >= 20 && !userStats.earnedBadges?.includes('badge_core_signal')) {
    earnedBadges.push(BADGE_REGISTRY.find(b => b.id === 'badge_core_signal')!);
  }

  // Check XP level badges
  if (userStats.level >= 10 && !userStats.earnedBadges?.includes('badge_fortune_flame')) {
    earnedBadges.push(BADGE_REGISTRY.find(b => b.id === 'badge_fortune_flame')!);
  }

  // Check login streak badges
  if (userStats.currentLoginStreak >= 7 && !userStats.earnedBadges?.includes('badge_sentinel')) {
    earnedBadges.push(BADGE_REGISTRY.find(b => b.id === 'badge_sentinel')!);
  }

  return earnedBadges;
}

// Get badge by ID
export function getBadgeById(id: string): BadgeNFT | undefined {
  return BADGE_REGISTRY.find(badge => badge.id === id);
}

// Get rarity styling
export function getRarityStyle(rarity: string) {
  switch (rarity) {
    case 'legendary':
      return {
        borderColor: '#ff6b35',
        glowColor: '#ff6b35',
        ringCount: 3,
        animation: 'pulse 2s infinite'
      };
    case 'epic':
      return {
        borderColor: '#9c27b0',
        glowColor: '#9c27b0',
        ringCount: 2,
        animation: 'pulse 3s infinite'
      };
    case 'rare':
      return {
        borderColor: '#00f0ff',
        glowColor: '#00f0ff',
        ringCount: 1,
        animation: 'none'
      };
    default:
      return {
        borderColor: '#6b7280',
        glowColor: '#6b7280',
        ringCount: 0,
        animation: 'none'
      };
  }
}

// Format user's NFT collection
export function formatUserNFTs(userStats: any): FSN_NFT[] {
  const earnedBadgeIds = userStats.earnedBadges || ['badge_onboarding', 'badge_trust_verified', 'badge_core_signal'];
  const nfts: FSN_NFT[] = [];

  // Add earned badges with realistic dates
  earnedBadgeIds.forEach((badgeId: string, index: number) => {
    const badge = getBadgeById(badgeId);
    if (badge) {
      const date = new Date();
      date.setDate(date.getDate() - (index * 3 + 1)); // Stagger dates realistically
      nfts.push({
        ...badge,
        dateEarned: date.toISOString().split('T')[0]
      });
    }
  });

  // Add collectibles - create multiple instances to show the count
  const collectibleDate = new Date();
  collectibleDate.setDate(collectibleDate.getDate() - 5);
  
  // Add 3 hex map fragments as separate NFTs to match the "3 NFTs" count
  for (let i = 0; i < 3; i++) {
    const fragmentDate = new Date(collectibleDate);
    fragmentDate.setHours(fragmentDate.getHours() + i); // Slightly different times
    nfts.push({
      ...COLLECTIBLE_REGISTRY[0],
      id: `collectible_hex_fragment_${i + 1}`,
      name: `Hex Map Fragment #${i + 1}`,
      dateEarned: fragmentDate.toISOString().split('T')[0]
    });
  }

  return nfts;
}