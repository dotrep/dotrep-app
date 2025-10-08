/**
 * Enhanced file upload security middleware
 * 
 * Implements robust protections against malicious file uploads
 * including:
 * - File type validation
 * - Size limits
 * - Content scanning
 * - Filename sanitization
 */
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB max file size
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// List of allowed file extensions and their corresponding MIME types
const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.gif': ['image/gif'],
  '.pdf': ['application/pdf'],
  '.txt': ['text/plain'],
  '.doc': ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.xls': ['application/vnd.ms-excel'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  '.ppt': ['application/vnd.ms-powerpoint'],
  '.pptx': ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  '.zip': ['application/zip'],
  '.json': ['application/json'],
  '.md': ['text/markdown'],
};

// High-risk extensions that should never be allowed
const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.ps1', '.vbs', '.js', '.jar', '.dll', '.sh',
  '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl', '.htaccess'
];

/**
 * Validates the file type based on extension and MIME type
 */
export function validateFileType(fileName: string, mimeType: string): boolean {
  const ext = path.extname(fileName).toLowerCase();
  
  // Block disallowed extensions immediately
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return false;
  }
  
  // Check if extension is in allowed list
  const allowedMimeTypes = ALLOWED_FILE_TYPES[ext];
  
  // If extension not in allowed list or MIME type doesn't match, reject
  if (!allowedMimeTypes || !allowedMimeTypes.includes(mimeType)) {
    return false;
  }
  
  return true;
}

/**
 * Validates the file size
 */
export function validateFileSize(fileSize: number): boolean {
  return fileSize <= MAX_FILE_SIZE;
}

/**
 * Generates a secure random filename while preserving the extension
 */
export function generateSecureFilename(originalFilename: string): string {
  // Remove potentially dangerous characters
  const sanitizedName = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Extract extension
  const ext = path.extname(sanitizedName).toLowerCase();
  const baseName = path.basename(sanitizedName, ext);
  
  // Generate a random ID
  const randomId = crypto.randomBytes(16).toString('hex');
  
  // Combine with timestamp for additional uniqueness
  const timestamp = Date.now().toString();
  
  // Create a new filename with the random ID and timestamp
  return `${baseName}_${timestamp}_${randomId}${ext}`;
}

/**
 * Scans a file buffer for suspicious content
 * This is a simplified version - in production, you'd integrate with a real virus scanner
 */
export async function scanFileContent(fileBuffer: Buffer): Promise<{clean: boolean, threat?: string}> {
  try {
    // Simplified security scan - check for suspicious patterns
    const content = fileBuffer.toString('binary');
    
    // Check for executable file signatures
    const suspiciousPatterns = [
      /MZ/,  // PE executable header
      /\x7fELF/, // ELF executable header
      /<script[^>]*>/i, // Script tags
      /javascript:/i,
      /vbscript:/i,
      /<?php/i // PHP code
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        return {
          clean: false,
          threat: 'Suspicious file content detected'
        };
      }
    }
    
    return { clean: true };
  } catch (error) {
    console.error('Error scanning file:', error);
    // Default to allowing files if scan fails
    return { clean: true };
  }
}

/**
 * Extracts file content from base64 data URI
 */
export function extractFileFromBase64(base64Data: string): { buffer: Buffer, mimeType: string } {
  // Extract the data from the base64 string
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 string format');
  }
  
  const mimeType = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  
  return { buffer, mimeType };
}