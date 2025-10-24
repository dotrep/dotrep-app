/**
 * Enhanced .rep name validation with security hardening
 * Protects against: profanity, impersonation, reserved names, prompt injection
 */

// Profanity blocklist - common variants and leetspeak
const PROFANITY_LIST = new Set([
  'fuck', 'shit', 'bitch', 'asshole', 'damn', 'crap', 'piss', 'dick', 'cock',
  'pussy', 'fag', 'bastard', 'whore', 'slut', 'nigger', 'nigga', 'cunt', 'twat',
  'f**k', 'sh*t', 'b*tch', 'a**hole', 'd*mn', 'p*ss', 'd*ck', 'c*ck',
  'f4ck', 'sh1t', 'b1tch', 'a55hole', 'd4mn', 'p1ss', 'd1ck', 'c0ck',
  'fck', 'sht', 'btch', 'ahole', 'dmn', 'dck', 'cck', 'psy',
  // Extend with more variants as needed
]);

// Reserved system names and protocol identifiers
const RESERVED_NAMES = new Set([
  // System
  'admin', 'moderator', 'mod', 'support', 'help', 'system', 'root', 'user',
  'official', 'verified', 'team', 'staff', 'owner', 'founder', 'ceo',
  // .rep platform
  'rep', 'replit', 'dot-rep', 'dotrep', 'base', 'blockchain', 'web3',
  // Impersonation targets
  'vitalik', 'satoshi', 'coinbase', 'ethereum', 'bitcoin', 'openai', 'google',
  'facebook', 'meta', 'twitter', 'x', 'apple', 'microsoft', 'amazon',
  // Protocol/placeholder
  'null', 'undefined', 'void', 'none', 'test', 'example', 'demo', 'sample',
  'localhost', 'api', 'www', 'http', 'https', 'ftp', 'ssh',
]);

// Prompt injection patterns (LLM security)
const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|above)\s+(instructions?|prompts?)/i,
  /system\s*:/i,
  /you\s+are\s+(now|a)/i,
  /(act|pretend|roleplay)\s+as/i,
  /\[INST\]/i,
  /<\|.*?\|>/i, // Special tokens
  /\{.*?system.*?\}/i,
];

/**
 * Levenshtein distance for fuzzy matching
 */
function levenshtein(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= bn; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= an; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[bn][an];
}

/**
 * Check if name is too similar to a reserved name (fuzzy match)
 */
function isTooSimilarToReserved(name: string): boolean {
  const threshold = 2; // Max Levenshtein distance allowed
  for (const reserved of RESERVED_NAMES) {
    const distance = levenshtein(name.toLowerCase(), reserved.toLowerCase());
    if (distance <= threshold && name.length >= 4) {
      return true;
    }
  }
  return false;
}

/**
 * Normalize leetspeak and special characters for profanity detection
 */
function normalizeLeetspeak(text: string): string {
  return text
    .toLowerCase()
    .replace(/[0]/g, 'o')
    .replace(/[1]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[4]/g, 'a')
    .replace(/[5]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[@]/g, 'a')
    .replace(/[\$]/g, 's')
    .replace(/[!]/g, 'i')
    .replace(/[*]/g, '')
    .replace(/[-_]/g, '');
}

/**
 * Check if name contains profanity (including obfuscated variants)
 */
function containsProfanity(name: string): boolean {
  const normalized = normalizeLeetspeak(name);
  
  // Check exact matches
  if (PROFANITY_LIST.has(normalized)) {
    return true;
  }
  
  // Check if profanity is substring
  for (const word of PROFANITY_LIST) {
    if (normalized.includes(word)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if name contains prompt injection patterns
 */
function containsPromptInjection(name: string): boolean {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Basic format validation
 */
function isValidFormat(name: string): boolean {
  // Length: 2-20 characters
  if (name.length < 2 || name.length > 20) {
    return false;
  }
  
  // Only lowercase letters, numbers, hyphens, underscores
  if (!/^[a-z0-9_-]+$/.test(name)) {
    return false;
  }
  
  // Cannot start/end with hyphen or underscore
  if (/^[-_]|[-_]$/.test(name)) {
    return false;
  }
  
  // Cannot have consecutive special characters
  if (/[-_]{2,}/.test(name)) {
    return false;
  }
  
  return true;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: string;
}

/**
 * Comprehensive .rep name validation
 */
export function validateRepName(name: string): ValidationResult {
  // Normalize to lowercase
  const normalized = name.toLowerCase().trim();
  
  // 1. Format validation
  if (!isValidFormat(normalized)) {
    if (normalized.length < 2) {
      return { valid: false, error: 'Name must be at least 2 characters', errorCode: 'too_short' };
    }
    if (normalized.length > 20) {
      return { valid: false, error: 'Name must be 20 characters or less', errorCode: 'too_long' };
    }
    if (!/^[a-z0-9_-]+$/.test(normalized)) {
      return { valid: false, error: 'Name can only contain letters, numbers, hyphens, and underscores', errorCode: 'invalid_chars' };
    }
    if (/^[-_]|[-_]$/.test(normalized)) {
      return { valid: false, error: 'Name cannot start or end with special characters', errorCode: 'invalid_format' };
    }
    if (/[-_]{2,}/.test(normalized)) {
      return { valid: false, error: 'Name cannot have consecutive special characters', errorCode: 'invalid_format' };
    }
    return { valid: false, error: 'Invalid name format', errorCode: 'invalid_format' };
  }
  
  // 2. Profanity check
  if (containsProfanity(normalized)) {
    return { valid: false, error: 'Name contains inappropriate language', errorCode: 'profanity' };
  }
  
  // 3. Reserved names (exact match)
  if (RESERVED_NAMES.has(normalized)) {
    return { valid: false, error: 'This name is reserved', errorCode: 'reserved' };
  }
  
  // 4. Reserved names (fuzzy match)
  if (isTooSimilarToReserved(normalized)) {
    return { valid: false, error: 'Name is too similar to a reserved name', errorCode: 'reserved_similar' };
  }
  
  // 5. Prompt injection detection
  if (containsPromptInjection(name)) {
    return { valid: false, error: 'Name contains invalid patterns', errorCode: 'invalid_pattern' };
  }
  
  return { valid: true };
}

/**
 * Canonicalize name for storage (lowercase)
 */
export function canonicalizeName(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Check if a name is valid (boolean helper)
 */
export function isValidName(name: string): boolean {
  return validateRepName(name).valid;
}

/**
 * Normalize wallet address to lowercase
 */
export function toLowerAddress(address: string): string {
  return address.toLowerCase().trim();
}
