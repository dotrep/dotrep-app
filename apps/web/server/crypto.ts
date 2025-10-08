/**
 * Crypto utilities for FSN Vault
 * 
 * Provides encryption/decryption functions for secure storage
 * of vault items using the user's FSN name as a pseudonym.
 */

import crypto from 'crypto';

// Encryption algorithm and key derivation parameters
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

// Derive encryption key from master password and salt
export function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256');
}

// Encrypt data using password
export function encrypt(plaintext: string, password: string): string {
  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Derive key from password and salt
  const key = deriveKey(password, salt);
  
  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  // Encrypt data
  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  
  // Get authentication tag
  const tag = cipher.getAuthTag();
  
  // Combine components: salt + iv + tag + ciphertext
  return Buffer.concat([
    salt,
    iv,
    tag,
    Buffer.from(ciphertext, 'hex')
  ]).toString('base64');
}

// Decrypt data using password
export function decrypt(encryptedData: string, password: string): string {
  if (!password) {
    throw new Error('Password is required for decryption');
  }
  try {
    // Decode from base64
    const data = Buffer.from(encryptedData, 'base64');
    
    // Extract components
    const salt = data.subarray(0, SALT_LENGTH);
    const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const ciphertext = data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH).toString('hex');
    
    // Derive key from password and salt
    const key = deriveKey(password, salt);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt data
    let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');
    
    return plaintext;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data. Invalid password or corrupted data.');
  }
}

// Generate a unique item ID
export function generateItemId(): string {
  return crypto.randomBytes(16).toString('hex');
}