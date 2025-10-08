// Centralized runtime configuration
export interface AppConfig {
  appMode: 'STEALTH' | 'PUBLIC';
  appName: string;
  tldLabel: string;
  chainName: string;
  rpcUrl: string;
  enableAnalytics: boolean;
  enableShareLinks: boolean;
  enableEventBadges: boolean;
  enablePublicGateway: boolean;
  referralEnabled: boolean;
  referralBonusXP: number;
}

// Environment-based configuration
const getConfig = (): AppConfig => {
  const appMode = (import.meta.env.VITE_APP_MODE || 'STEALTH') as 'STEALTH' | 'PUBLIC';
  
  return {
    appMode,
    appName: import.meta.env.VITE_APP_NAME || (appMode === 'PUBLIC' ? 'FSN' : 'App'),
    tldLabel: import.meta.env.VITE_TLD_LABEL || (appMode === 'PUBLIC' ? '.fsn' : '.id'),
    chainName: import.meta.env.VITE_CHAIN_NAME || (appMode === 'PUBLIC' ? 'Base Sepolia' : 'Devnet'),
    rpcUrl: appMode === 'PUBLIC' 
      ? (import.meta.env.VITE_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org')
      : (import.meta.env.VITE_LOCAL_RPC_URL || 'http://127.0.0.1:8545'),
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true' && appMode === 'PUBLIC',
    enableShareLinks: import.meta.env.VITE_ENABLE_SHARE_LINKS === 'true' && appMode === 'PUBLIC',
    enableEventBadges: import.meta.env.VITE_ENABLE_EVENT_BADGES === 'true' && appMode === 'PUBLIC',
    enablePublicGateway: import.meta.env.VITE_ENABLE_PUBLIC_GATEWAY === 'true' && appMode === 'PUBLIC',
    referralEnabled: import.meta.env.VITE_REFERRAL_ENABLED === 'true',
    referralBonusXP: parseInt(import.meta.env.VITE_REFERRAL_BONUS_XP || '100')
  };
};

export const config = getConfig();

// Helper functions
export const isStealthMode = () => config.appMode === 'STEALTH';
export const isPublicMode = () => config.appMode === 'PUBLIC';
export const shouldShowBranding = () => config.appMode === 'PUBLIC';
export const shouldShowExplorerLinks = () => config.enableEventBadges;
export const shouldShowShareButtons = () => config.enableShareLinks;