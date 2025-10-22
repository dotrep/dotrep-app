/**
 * Normalize Ethereum wallet address to lowercase for case-insensitive comparisons
 * @param a - Wallet address (optional)
 * @returns Normalized lowercase address or empty string
 */
export const normAddr = (a?: string): string => {
  return (a ?? '').trim().toLowerCase();
};
