// Main storage exports for FSN application
export { leaderboardStorage as storage } from './storage/leaderboard';
export { simpleStorage } from './storage/simpleStorage';

// Export types for compatibility
export type { InsertUser, InsertXpLog, InsertVaultItem } from '../shared/schema';