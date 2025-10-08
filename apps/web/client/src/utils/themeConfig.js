// FSN Theme Configuration Utilities

export const getThemeConfig = () => {
  return {
    isEnabled: import.meta.env.VITE_FEATURE_THEME_UNIFIED !== 'off',
    defaultTheme: import.meta.env.VITE_THEME_DEFAULT || 'dark',
    allowSwitch: import.meta.env.VITE_THEME_ALLOW_SWITCH === 'true'
  };
};

export const isThemeEnabled = () => {
  return import.meta.env.VITE_FEATURE_THEME_UNIFIED !== 'off';
};

// Apply theme class conditionally
export const withTheme = (baseClasses, themeClasses = '') => {
  if (!isThemeEnabled()) {
    return baseClasses;
  }
  return `${baseClasses} ${themeClasses}`.trim();
};

// Get theme-aware CSS variables
export const getThemeVar = (variableName) => {
  if (!isThemeEnabled()) {
    return undefined;
  }
  return `var(--${variableName})`;
};

export default {
  getThemeConfig,
  isThemeEnabled,
  withTheme,
  getThemeVar
};