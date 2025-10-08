// Vault Tier System Configuration
export const VAULT_TIERS = [
  { 
    tier: 1, 
    max_files: 5, 
    max_nfts: 1, 
    required_xp: 0,
    name: "Explorer",
    color: "#00f0ff"
  },
  { 
    tier: 2, 
    max_files: 10, 
    max_nfts: 3, 
    required_xp: 250,
    name: "Navigator",
    color: "#00ff80"
  },
  { 
    tier: 3, 
    max_files: 25, 
    max_nfts: 10, 
    required_xp: 750,
    required_trust: true,
    name: "Sentinel",
    color: "#8000ff"
  },
  { 
    tier: 4, 
    max_files: 50, 
    max_nfts: 25, 
    required_xp: 2000,
    name: "Guardian",
    color: "#ff8000"
  },
  { 
    tier: 5, 
    max_files: 100, 
    max_nfts: 50, 
    required_xp: 5000,
    name: "Archivist",
    color: "#ff0080"
  }
];

export function getCurrentTier(xpPoints) {
  for (let i = VAULT_TIERS.length - 1; i >= 0; i--) {
    if (xpPoints >= VAULT_TIERS[i].required_xp) {
      return VAULT_TIERS[i];
    }
  }
  return VAULT_TIERS[0]; // Default to tier 1
}

export function getNextTier(xpPoints) {
  const currentTier = getCurrentTier(xpPoints);
  const currentIndex = VAULT_TIERS.findIndex(tier => tier.tier === currentTier.tier);
  
  if (currentIndex < VAULT_TIERS.length - 1) {
    return VAULT_TIERS[currentIndex + 1];
  }
  return null; // Max tier reached
}

export function getVaultLimits(xpPoints) {
  const tier = getCurrentTier(xpPoints);
  return {
    maxFiles: tier.max_files,
    maxNfts: tier.max_nfts,
    tierName: tier.name,
    tierNumber: tier.tier,
    tierColor: tier.color
  };
}

export function canUpload(xpPoints, currentFiles, currentNfts, uploadType, isVerified = false) {
  // Get user progress from localStorage to check trust status
  const userProgress = JSON.parse(localStorage.getItem('userProgress') || '{}');
  const trustVerified = userProgress.trust?.verified === true || isVerified;
  const limits = getVaultLimits(xpPoints);
  
  if (uploadType === 'file') {
    return currentFiles < limits.maxFiles;
  } else if (uploadType === 'nft') {
    return currentNfts < limits.maxNfts;
  }
  
  return false;
}

export function getDisplayLimits(xpPoints, currentFiles, currentNfts) {
  const limits = getVaultLimits(xpPoints);
  
  return {
    fileLimit: Math.max(limits.maxFiles, currentFiles),
    nftLimit: Math.max(limits.maxNfts, currentNfts),
    isFileOverLimit: currentFiles > limits.maxFiles,
    isNftOverLimit: currentNfts > limits.maxNfts
  };
}