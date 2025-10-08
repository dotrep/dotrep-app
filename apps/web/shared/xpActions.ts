// XP Action System - Single Source of Truth for FSN Phase 0 XP Values
// This defines all XP-earning actions and their point values for consistency across the app

export interface XPAction {
  points: number;
  description: string;
  category: 'identity' | 'social' | 'content' | 'engagement' | 'milestones' | 'gamification';
  oneTime?: boolean; // If true, can only be earned once per user
}

export const XP_ACTIONS: Record<string, XPAction> = {
  // Identity & Verification Actions
  claim_fsn: {
    points: 50,
    description: 'Claim your unique FSN identity',
    category: 'identity',
    oneTime: true
  },
  verify_email: {
    points: 25,
    description: 'Verify your email address',
    category: 'identity',
    oneTime: true
  },
  verify_phone: {
    points: 25,
    description: 'Verify your phone number',
    category: 'identity',
    oneTime: true
  },
  complete_profile: {
    points: 10,
    description: 'Complete your profile information',
    category: 'identity'
  },
  set_avatar: {
    points: 10,
    description: 'Set your profile avatar',
    category: 'identity',
    oneTime: true
  },

  // Content & Upload Actions
  upload_file: {
    points: 20,
    description: 'Upload a file to your vault',
    category: 'content'
  },
  upload_first_file: {
    points: 50,
    description: 'Upload your first file to the vault',
    category: 'content',
    oneTime: true
  },

  // Social & Engagement Actions
  chat_ai: {
    points: 5,
    description: 'Interact with AI agents',
    category: 'social'
  },
  post_feed: {
    points: 10,
    description: 'Post to the social feed',
    category: 'social'
  },
  share_referral: {
    points: 15,
    description: 'Share a referral link',
    category: 'social'
  },
  referral_verified: {
    points: 50,
    description: 'Friend joins via your referral',
    category: 'social'
  },

  // Login & Streak Actions
  daily_login: {
    points: 5,
    description: 'Daily login bonus',
    category: 'engagement'
  },
  login_streak_1: {
    points: 5,
    description: 'First day login streak',
    category: 'engagement'
  },
  login_streak_3: {
    points: 15,
    description: '3-day login streak bonus',
    category: 'engagement'
  },
  login_streak_7: {
    points: 35,
    description: '7-day login streak bonus',
    category: 'engagement'
  },
  login_streak_14: {
    points: 70,
    description: '14-day login streak bonus',
    category: 'engagement'
  },
  login_streak_30: {
    points: 150,
    description: '30-day login streak bonus',
    category: 'engagement'
  },

  // Gamification Actions
  play_game: {
    points: 5,
    description: 'Play a game in Game Center',
    category: 'gamification'
  },
  win_game: {
    points: 10,
    description: 'Win a game in Game Center',
    category: 'gamification'
  },
  game_milestone: {
    points: 15,
    description: 'Achieve a game milestone or high score',
    category: 'gamification'
  },
  perfect_game: {
    points: 25,
    description: 'Complete a game with perfect performance',
    category: 'gamification'
  },
  view_tutorial: {
    points: 5,
    description: 'Complete a tutorial',
    category: 'gamification'
  },

  // Milestone Actions
  reach_100_xp: {
    points: 10,
    description: 'Reach 100 total XP',
    category: 'milestones',
    oneTime: true
  },
  reach_500_xp: {
    points: 25,
    description: 'Reach 500 total XP',
    category: 'milestones',
    oneTime: true
  },
  reach_1000_xp: {
    points: 50,
    description: 'Reach 1000 total XP',
    category: 'milestones',
    oneTime: true
  },
  reach_2500_xp: {
    points: 100,
    description: 'Reach 2500 total XP',
    category: 'milestones',
    oneTime: true
  },
  reach_5000_xp: {
    points: 200,
    description: 'Reach 5000 total XP',
    category: 'milestones',
    oneTime: true
  },

  // System Actions
  profile_update: {
    points: 5,
    description: 'Update profile information',
    category: 'identity'
  },
  pulse_activity: {
    points: 5,
    description: 'Maintain steady pulse readings',
    category: 'engagement'
  },
  signal_tuning: {
    points: 8,
    description: 'Adjust signal frequency',
    category: 'engagement'
  },
  beacon_activation: {
    points: 15,
    description: 'Activate beacon status',
    category: 'engagement'
  },
  special_frequency: {
    points: 10,
    description: 'Discover a special frequency',
    category: 'engagement'
  }
};

// Utility functions for XP management
export const getXPValue = (action: string): number => {
  return XP_ACTIONS[action]?.points || 0;
};

export const getXPAction = (action: string): XPAction | undefined => {
  return XP_ACTIONS[action];
};

export const getXPActionsByCategory = (category: XPAction['category']): Record<string, XPAction> => {
  return Object.entries(XP_ACTIONS)
    .filter(([, action]) => action.category === category)
    .reduce((acc, [key, action]) => {
      acc[key] = action;
      return acc;
    }, {} as Record<string, XPAction>);
};

export const getAllXPActions = (): Record<string, XPAction> => {
  return XP_ACTIONS;
};

// XP Log interface for tracking earned XP
export interface XPLog {
  id?: number;
  userId: number;
  action: string;
  xpEarned: number;
  description: string;
  category: string;
  timestamp: Date;
  metadata?: any; // Additional context data
}

// Export action keys as constants for type safety
export const XP_ACTION_KEYS = Object.keys(XP_ACTIONS) as Array<keyof typeof XP_ACTIONS>;