// Vault tier enforcement logic
export interface VaultLimits {
  files: number;
  nfts: number;
}

export function getVaultLimits(tier: string): VaultLimits {
  switch (tier) {
    case 'Sentinel':
      return { files: 20, nfts: 5 };
    case 'Navigator':
      return { files: 10, nfts: 3 };
    case 'Pioneer':
      return { files: 5, nfts: 1 };
    default:
      return { files: 5, nfts: 1 }; // Default tier
  }
}

export function canUploadFile(currentFileCount: number, tier: string): boolean {
  const limits = getVaultLimits(tier);
  return currentFileCount < limits.files;
}

export function canUploadNFT(currentNFTCount: number, tier: string): boolean {
  const limits = getVaultLimits(tier);
  return currentNFTCount < limits.nfts;
}

export function getUploadErrorMessage(type: 'file' | 'nft', tier: string): string {
  const limits = getVaultLimits(tier);
  
  if (type === 'file') {
    return `🚫 Vault file limit reached for ${tier} tier (${limits.files} files max)`;
  } else {
    return `🚫 NFT storage limit reached for ${tier} tier (${limits.nfts} NFTs max)`;
  }
}