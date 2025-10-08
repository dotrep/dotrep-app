import React, { createContext, useContext, useEffect, useState } from 'react';

// Theme context
const ThemeContext = createContext({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
  isEnabled: false
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Analytics helper for theme events
const emitThemeAnalytics = (event, data) => {
  console.log(`[Theme Analytics] ${event}:`, data);
  // In production, this would send to analytics service
};

export const ThemeProvider = ({ children }) => {
  // Check feature flags
  const isEnabled = import.meta.env.VITE_FEATURE_THEME_UNIFIED !== 'off';
  const defaultTheme = import.meta.env.VITE_THEME_DEFAULT || 'dark';
  const allowSwitch = import.meta.env.VITE_THEME_ALLOW_SWITCH === 'true';
  
  const [theme, setTheme] = useState(defaultTheme);

  // Apply theme to HTML element
  useEffect(() => {
    if (!isEnabled) return;
    
    const htmlElement = document.documentElement;
    htmlElement.setAttribute('data-theme', theme);
    
    // Analytics
    emitThemeAnalytics('theme_applied', { theme });
  }, [theme, isEnabled]);

  // Breakpoint tracking for analytics
  useEffect(() => {
    if (!isEnabled) return;

    const checkBreakpoint = () => {
      const width = window.innerWidth;
      let bp = 'xs';
      if (width >= 1536) bp = '2xl';
      else if (width >= 1280) bp = 'xl'; 
      else if (width >= 1024) bp = 'lg';
      else if (width >= 768) bp = 'md';
      else if (width >= 360) bp = 'sm';
      
      emitThemeAnalytics('breakpoint_rendered', { bp, width });
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, [isEnabled]);

  // Check for reduced motion preference
  useEffect(() => {
    if (!isEnabled) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    emitThemeAnalytics('a11y_reduced_motion', { enabled: prefersReducedMotion });
  }, [isEnabled]);

  const toggleTheme = () => {
    if (!isEnabled || !allowSwitch) return;
    
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const value = {
    theme,
    setTheme: (newTheme) => {
      if (!isEnabled || !allowSwitch) return;
      setTheme(newTheme);
    },
    toggleTheme,
    isEnabled,
    allowSwitch
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;