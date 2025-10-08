/**
 * Sanitize user inputs to prevent XSS attacks
 */

// Simple HTML sanitizer for message content
export function sanitizeHTML(input: string): string {
  if (!input) return '';
  
  // Convert special characters to HTML entities
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Validate FSN name format
export function isValidFsnName(name: string): boolean {
  // FSN names can only contain letters, numbers, underscores and hyphens
  const validFormat = /^[a-zA-Z0-9_-]+$/;
  
  // Check format and length (3-50 characters)
  return validFormat.test(name) && name.length >= 3 && name.length <= 50;
}

// Format FSN name consistently
export function formatFsnName(name: string): string {
  // Remove any .fsn suffix if present
  return name.replace(/\.fsn$/, '').toLowerCase();
}