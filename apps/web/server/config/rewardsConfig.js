// Rewards UI Feature Flag Configuration
export const rewardsConfig = {
  enabled: process.env.REWARDS_UI_ENABLED === 'true',
  
  // Canonical reason keys for XP rewards
  reasonKeys: {
    'onboarding.step_complete': 'Onboarding step completed',
    'onboarding.complete': 'Onboarding completed',
    'vault.upload': 'File stored in FreeSpace',
    'wallet.connect': 'Wallet connected',
    'beacon.recast': 'Beacon recast',
    'fsn.claim': 'FSN name claimed',
    'email.verify': 'Email verified',
    'login.daily': 'Daily login',
    'profile.update': 'Profile updated',
    'social.message': 'Message sent',
    'game.complete': 'Game completed'
  },
  
  // Get friendly reason text
  getFriendlyReason: (reasonKey) => {
    return rewardsConfig.reasonKeys[reasonKey] || 'XP earned';
  }
};

export default rewardsConfig;