/**
 * Verification utility functions
 * Determines which FSN users should display verification badges
 */

// List of verified FSN usernames
const VERIFIED_USERS = [
  'jason',
  'core',
  'ghost', 
  'vault',
  'forge',
  'echo'
];

/**
 * Check if a username is verified
 * @param username - The FSN username (without .fsn suffix)
 * @returns boolean indicating if user is verified
 */
export function isUserVerified(username: string): boolean {
  if (!username) return false;
  
  // Remove .fsn suffix if present
  const cleanUsername = username.replace(/\.fsn$/, '').toLowerCase();
  
  return VERIFIED_USERS.includes(cleanUsername);
}

/**
 * Add a user to the verified list (for future admin functionality)
 * @param username - The FSN username to verify
 */
export function addVerifiedUser(username: string): void {
  const cleanUsername = username.replace(/\.fsn$/, '').toLowerCase();
  
  if (!VERIFIED_USERS.includes(cleanUsername)) {
    VERIFIED_USERS.push(cleanUsername);
  }
}

/**
 * Remove a user from the verified list
 * @param username - The FSN username to unverify
 */
export function removeVerifiedUser(username: string): void {
  const cleanUsername = username.replace(/\.fsn$/, '').toLowerCase();
  const index = VERIFIED_USERS.indexOf(cleanUsername);
  
  if (index > -1) {
    VERIFIED_USERS.splice(index, 1);
  }
}