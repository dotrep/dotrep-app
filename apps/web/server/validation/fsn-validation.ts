/**
 * FSN Name Validation Rules - FSN Phase 0 Compliant
 * 
 * Rules:
 * - Lowercase only (a–z, 0–9, one dash max, no underscores or spaces)
 * - Length between 4 and 25 characters
 * - Only allow one FSN name per user
 * - Reject forbidden characters: < > { } \ / : ; ' " $ % ^ & * !
 * - Block reserved names
 * - Sanitize and normalize input before saving
 * - Normalize and enforce lowercase at entry
 */

const RESERVED_NAMES = [
  'admin', 'support', 'fsn', 'coinbase', 'pulse', 'vault', 'root', 'system',
  'api', 'www', 'mail', 'ftp', 'ssh', 'http', 'https', 'tcp', 'udp',
  'localhost', 'domain', 'subdomain', 'email', 'user', 'users', 'account',
  'accounts', 'login', 'signup', 'register', 'auth', 'authentication',
  'password', 'pass', 'security', 'secure', 'ssl', 'tls', 'cert',
  'bitcoin', 'ethereum', 'crypto', 'blockchain', 'wallet', 'exchange',
  'binance', 'kraken', 'gemini', 'robinhood', 'meta', 'facebook',
  'google', 'apple', 'microsoft', 'amazon', 'netflix', 'twitter',
  'instagram', 'youtube', 'tiktok', 'snapchat', 'discord', 'telegram',
  'whatsapp', 'signal', 'slack', 'zoom', 'teams', 'skype', 'reddit',
  'pinterest', 'linkedin', 'github', 'gitlab', 'bitbucket', 'stackoverflow',
  'test', 'testing', 'demo', 'example', 'sample', 'temp', 'temporary',
  'null', 'undefined', 'void', 'none', 'empty', 'blank', 'default',
  'config', 'settings', 'preferences', 'options', 'help', 'about',
  'contact', 'privacy', 'terms', 'legal', 'policy', 'cookies',
  'moderator', 'mod', 'administrator', 'owner', 'founder', 'ceo',
  'cto', 'cfo', 'president', 'vice', 'director', 'manager',
  'staff', 'team', 'group', 'organization', 'company', 'corp',
  'official', 'verified', 'premium', 'pro', 'plus', 'elite',
  'vip', 'special', 'reserved', 'private', 'public', 'global'
];

const FORBIDDEN_CHARS = /[<>{}\\/:;'"$%^&*!]/;
const VALID_CHARS = /^[a-z0-9-]+$/;
const MULTIPLE_DASHES = /--+/;
const STARTS_OR_ENDS_WITH_DASH = /^-|-$/;

export interface FsnNameValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateFsnName(name: string): FsnNameValidationResult {
  // Step 1: Check if name is provided
  if (!name || typeof name !== 'string') {
    return { valid: false, reason: 'FSN name is required' };
  }

  // Step 2: Normalize - trim and convert to lowercase
  const normalizedName = name.trim().toLowerCase();

  // Step 3: Check length
  if (normalizedName.length < 4) {
    return { valid: false, reason: 'FSN name must be at least 4 characters long' };
  }

  if (normalizedName.length > 25) {
    return { valid: false, reason: 'FSN name cannot exceed 25 characters' };
  }

  // Step 4: Check for forbidden characters
  if (FORBIDDEN_CHARS.test(normalizedName)) {
    return { valid: false, reason: 'FSN name contains forbidden characters' };
  }

  // Step 5: Check for valid characters only (a-z, 0-9, single dashes)
  if (!VALID_CHARS.test(normalizedName)) {
    return { valid: false, reason: 'FSN name can only contain lowercase letters, numbers, and dashes' };
  }

  // Step 6: Check for multiple consecutive dashes
  if (MULTIPLE_DASHES.test(normalizedName)) {
    return { valid: false, reason: 'FSN name cannot contain multiple consecutive dashes' };
  }

  // Step 7: Check if starts or ends with dash
  if (STARTS_OR_ENDS_WITH_DASH.test(normalizedName)) {
    return { valid: false, reason: 'FSN name cannot start or end with a dash' };
  }

  // Step 8: Check against reserved names
  if (RESERVED_NAMES.includes(normalizedName)) {
    return { valid: false, reason: 'This FSN name is reserved and cannot be used' };
  }

  // Step 9: Additional pattern checks
  // Block common typosquatting patterns
  const suspiciousPatterns = [
    /^[0-9]+$/, // All numbers
    /^.{1,2}$/, // Too short (already covered by length but extra safety)
    /^x+$/, // All X's
    /^a+$/, // All A's
    /^admin/, // Starts with admin
    /^[a-z]\./, // Single letter followed by dot pattern
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(normalizedName)) {
      return { valid: false, reason: 'FSN name pattern is not allowed' };
    }
  }

  return { valid: true };
}

/**
 * Sanitize and normalize FSN name input
 */
export function sanitizeFsnName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '') // Remove all invalid characters
    .replace(/--+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
}

/**
 * Check if FSN name needs normalization
 */
export function needsNormalization(original: string, normalized: string): boolean {
  return original !== normalized;
}