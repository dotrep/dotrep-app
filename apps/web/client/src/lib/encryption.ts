// Client-side encryption for vault files
import { fromByteArray, toByteArray } from 'base64-js';

// AES-GCM encryption using Web Crypto API
export class VaultEncryption {
  // Generate a random encryption key
  static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }

  // Export key to base64 string for storage
  static async exportKey(key: CryptoKey): Promise<string> {
    const keyBuffer = await crypto.subtle.exportKey('raw', key);
    return fromByteArray(new Uint8Array(keyBuffer));
  }

  // Import key from base64 string
  static async importKey(keyString: string): Promise<CryptoKey> {
    const keyBuffer = toByteArray(keyString);
    return await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );
  }

  // Generate key checksum for verification
  static async getKeyChecksum(key: CryptoKey): Promise<string> {
    const keyBuffer = await crypto.subtle.exportKey('raw', key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyBuffer);
    return fromByteArray(new Uint8Array(hashBuffer)).substring(0, 8); // Short checksum
  }

  // Encrypt file with AES-GCM
  static async encryptFile(file: File, key: CryptoKey): Promise<{
    encryptedData: Uint8Array;
    iv: Uint8Array;
    checksum: string;
  }> {
    try {
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Read file as ArrayBuffer
      const fileBuffer = await file.arrayBuffer();
      
      // Encrypt the file
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        fileBuffer
      );

      // Generate checksum for integrity verification
      const checksum = await this.getKeyChecksum(key);

      return {
        encryptedData: new Uint8Array(encryptedBuffer),
        iv,
        checksum
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt file');
    }
  }

  // Decrypt file with AES-GCM
  static async decryptFile(
    encryptedData: Uint8Array, 
    iv: Uint8Array, 
    key: CryptoKey
  ): Promise<ArrayBuffer> {
    try {
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        encryptedData
      );

      return decryptedBuffer;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt file - invalid key or corrupted data');
    }
  }

  // Create encrypted blob for upload
  static createEncryptedBlob(encryptedData: Uint8Array, iv: Uint8Array): Blob {
    // Prepend IV to encrypted data for storage
    const combined = new Uint8Array(iv.length + encryptedData.length);
    combined.set(iv, 0);
    combined.set(encryptedData, iv.length);
    
    return new Blob([combined], { type: 'application/octet-stream' });
  }

  // Extract IV and data from encrypted blob
  static extractFromBlob(blob: Blob): Promise<{ iv: Uint8Array; encryptedData: Uint8Array }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const buffer = reader.result as ArrayBuffer;
          const combined = new Uint8Array(buffer);
          
          // First 12 bytes are IV
          const iv = combined.slice(0, 12);
          const encryptedData = combined.slice(12);
          
          resolve({ iv, encryptedData });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(blob);
    });
  }
}

// Local storage for encryption keys (encrypted with master password if needed)
export class VaultKeyManager {
  private static readonly STORAGE_KEY = 'vault_encryption_keys';
  private static readonly CHECKSUM_KEY = 'vault_key_checksums';

  // Store encryption key locally
  static storeKey(fileId: string, key: CryptoKey, checksum: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Export key to string
        const keyString = await VaultEncryption.exportKey(key);
        
        // Get existing keys
        const keys = this.getStoredKeys();
        const checksums = this.getStoredChecksums();
        
        // Store new key and checksum
        keys[fileId] = keyString;
        checksums[fileId] = checksum;
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys));
        localStorage.setItem(this.CHECKSUM_KEY, JSON.stringify(checksums));
        
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Retrieve encryption key
  static async getKey(fileId: string): Promise<CryptoKey | null> {
    try {
      const keys = this.getStoredKeys();
      const keyString = keys[fileId];
      
      if (!keyString) {
        return null;
      }
      
      return await VaultEncryption.importKey(keyString);
    } catch (error) {
      console.error('Failed to retrieve key:', error);
      return null;
    }
  }

  // Get key checksum for verification
  static getKeyChecksum(fileId: string): string | null {
    const checksums = this.getStoredChecksums();
    return checksums[fileId] || null;
  }

  // Remove key from storage
  static removeKey(fileId: string): void {
    const keys = this.getStoredKeys();
    const checksums = this.getStoredChecksums();
    
    delete keys[fileId];
    delete checksums[fileId];
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys));
    localStorage.setItem(this.CHECKSUM_KEY, JSON.stringify(checksums));
  }

  // Get all stored keys
  private static getStoredKeys(): Record<string, string> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to parse stored keys:', error);
      return {};
    }
  }

  // Get all stored checksums
  private static getStoredChecksums(): Record<string, string> {
    try {
      const stored = localStorage.getItem(this.CHECKSUM_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to parse stored checksums:', error);
      return {};
    }
  }

  // Clear all stored keys (logout/reset)
  static clearAllKeys(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.CHECKSUM_KEY);
  }

  // Get count of stored keys
  static getKeyCount(): number {
    const keys = this.getStoredKeys();
    return Object.keys(keys).length;
  }
}