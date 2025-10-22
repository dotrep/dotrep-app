/**
 * Shared validation utilities for .rep name validation
 * Used by both client and server to ensure consistent validation
 */

/**
 * Canonicalize a .rep name to lowercase and trim whitespace
 */
export function canonicalize(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Validate a .rep name according to platform rules:
 * - 3-32 characters
 * - Lowercase letters, numbers, hyphens only
 * - Must start with a letter
 * - Cannot start or end with hyphen
 * - Cannot contain consecutive hyphens
 */
export function isValidName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const canonical = canonicalize(name);
  
  // Length check: 3-32 characters
  if (canonical.length < 3 || canonical.length > 32) {
    return false;
  }

  // Must start with a letter
  if (!/^[a-z]/.test(canonical)) {
    return false;
  }

  // Can only contain lowercase letters, numbers, and hyphens
  if (!/^[a-z0-9-]+$/.test(canonical)) {
    return false;
  }

  // Cannot end with hyphen
  if (canonical.endsWith('-')) {
    return false;
  }

  // Cannot contain consecutive hyphens
  if (canonical.includes('--')) {
    return false;
  }

  return true;
}

/**
 * Get a user-friendly error message for an invalid name
 */
export function getNameValidationError(name: string): string | null {
  if (!name) {
    return 'Name is required';
  }

  const canonical = canonicalize(name);

  if (canonical.length < 3) {
    return 'Name must be at least 3 characters';
  }

  if (canonical.length > 32) {
    return 'Name must be at most 32 characters';
  }

  if (!/^[a-z]/.test(canonical)) {
    return 'Name must start with a letter';
  }

  if (!/^[a-z0-9-]+$/.test(canonical)) {
    return 'Name can only contain lowercase letters, numbers, and hyphens';
  }

  if (canonical.endsWith('-')) {
    return 'Name cannot end with a hyphen';
  }

  if (canonical.includes('--')) {
    return 'Name cannot contain consecutive hyphens';
  }

  return null;
}
