// Environment configuration utilities for feature flags

// Check if rewards UI is enabled
export const isRewardsUIEnabled = () => {
  return import.meta.env.VITE_REWARDS_UI_ENABLED === 'true';
};

// Check if theme system is enabled  
export const isThemeEnabled = () => {
  return import.meta.env.VITE_FEATURE_THEME_UNIFIED !== 'off';
};

// Check if rewards feedback is enabled
export const isRewardsFeedbackEnabled = () => {
  return import.meta.env.VITE_FEATURE_REWARDS_FEEDBACK !== 'off';
};

// Get environment config for debugging
export const getEnvConfig = () => {
  return {
    rewardsUI: isRewardsUIEnabled(),
    theme: isThemeEnabled(),
    rewardsFeedback: isRewardsFeedbackEnabled(),
    // Add other feature flags as needed
  };
};

export default {
  isRewardsUIEnabled,
  isThemeEnabled,
  isRewardsFeedbackEnabled,
  getEnvConfig
};