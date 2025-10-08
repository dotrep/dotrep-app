// Feature flags for Phase 0 Beacon RECAST simplification
export const FEATURE_FLAGS = {
  TRUST: process.env.FEATURE_TRUST === 'on' ? true : false,
  BEACON_RECAST: process.env.FEATURE_BEACON_RECAST || 'phase0', // 'phase0' or 'trust'
  XP_RECAST_AWARD: parseInt(process.env.XP_RECAST_AWARD || '10'),
  RECAST_COOLDOWN_SECONDS: parseInt(process.env.RECAST_COOLDOWN_SECONDS || '86400'), // 24 hours production
  XP_ONBOARDING_BONUS: parseInt(process.env.XP_ONBOARDING_BONUS || '100'), // One-time onboarding completion bonus
};

console.log('Feature flags loaded:', FEATURE_FLAGS);