import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Generate a secure filename for uploaded files
export function generateSecureFilename(originalFilename: string): string {
  // Remove potentially dangerous characters
  const sanitizedName = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Generate a unique random string to avoid filename collisions
  const randomId = crypto.randomBytes(16).toString('hex');
  
  // Extract extension
  const ext = path.extname(sanitizedName);
  const baseName = path.basename(sanitizedName, ext);
  
  // Create a new filename with the random ID
  return `${baseName}_${randomId}${ext}`;
}

// Save a file to the uploads directory
export function saveFile(base64Data: string, filename: string): string {
  // Extract the data from the base64 string
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 string format');
  }
  
  // Generate a secure filename
  const secureFilename = generateSecureFilename(filename);
  const filePath = path.join(UPLOADS_DIR, secureFilename);
  
  // Convert base64 to buffer and save to file
  const buffer = Buffer.from(matches[2], 'base64');
  fs.writeFileSync(filePath, buffer);
  
  // Return the path relative to uploads directory
  return `/uploads/${secureFilename}`;
}

// Delete a file from the uploads directory
export function deleteFile(fileUrl: string): boolean {
  try {
    // Extract filename from the URL
    const filename = path.basename(fileUrl);
    const filePath = path.join(UPLOADS_DIR, filename);
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}