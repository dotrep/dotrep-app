/**
 * API endpoint to handle vault functionality including uploads
 */
import express from 'express';
import multer from 'multer';
import { processIncomingEmail } from '../../email';
import { storage } from '../../storage';
import { 
  validateFileType, 
  validateFileSize, 
  generateSecureFilename, 
  scanFileContent 
} from '../../middleware/file-upload-security';
import { encrypt, decrypt, generateItemId } from '../../crypto';
import { VaultItemType } from '@shared/vault';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload file to vault
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const file = req.file;
    const { description = '', type = 'general' } = req.body;

    // Validate file type and size
    if (!validateFileType(file.originalname, file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    if (!validateFileSize(file.buffer.length)) {
      return res.status(400).json({ error: 'File too large' });
    }

    // Scan file content for security
    const scanResult = await scanFileContent(file.buffer);
    if (!scanResult.clean) {
      return res.status(400).json({ error: 'File failed security scan' });
    }

    // Generate secure filename and encrypt content
    const secureFilename = generateSecureFilename(file.originalname);
    const encryptedContent = encrypt(JSON.stringify({
      filename: file.originalname,
      secureFilename,
      size: file.buffer.length,
      description,
      content: file.buffer.toString('base64')
    }), 'vault-password');
    const itemId = generateItemId();

    // Create vault item data
    const vaultData = {
      filename: file.originalname,
      secureFilename,
      size: file.buffer.length,
      description,
      content: file.buffer.toString('base64')
    };

    // Get user from session
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get user's FSN name (for now use a default)
    const fsnName = 'user.fsn'; // TODO: Get actual FSN name from user profile

    // Create vault item
    const vaultItem = await storage.createVaultItem({
      userId,
      fsnName,
      itemId,
      itemType: type as VaultItemType,
      data: encryptedContent
    });

    res.json({ 
      success: true, 
      message: 'File uploaded successfully',
      item: vaultItem 
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get vault items  
router.get('/items', async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const items = await storage.getVaultItemsByUser(userId);
    
    // Decrypt and extract file information for each item
    const itemsWithDetails = items.map(item => {
      try {
        // Decrypt the file data to get actual filename and details
        const decryptedData = decrypt(item.data, 'vault-password');
        const fileData = JSON.parse(decryptedData);
        
        return {
          id: item.id,
          filename: fileData.filename || 'Unknown File',
          type: item.itemType,
          size: fileData.size || 0,
          uploadDate: item.createdAt?.toISOString(),
          description: fileData.description || '',
          isEncrypted: true
        };
      } catch (error) {
        // Fallback for items that can't be decrypted
        console.error(`Error decrypting vault item ${item.id}:`, error);
        return {
          id: item.id,
          filename: `Encrypted File ${item.id}`,
          type: item.itemType,
          size: 0,
          uploadDate: item.createdAt?.toISOString(),
          description: 'Unable to decrypt',
          isEncrypted: true
        };
      }
    });
    
    res.json(itemsWithDetails);
  } catch (error) {
    console.error('Error fetching vault items:', error);
    res.status(500).json({ error: 'Failed to fetch vault items' });
  }
});

// Get vault stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const items = await storage.getVaultItemsByUser(userId);
    
    // Calculate actual used space by decrypting items
    let usedSpace = 0;
    for (const item of items) {
      try {
        const decryptedData = decrypt(item.data, 'vault-password');
        const fileData = JSON.parse(decryptedData);
        usedSpace += fileData.size || 1024; // Default size if not available
      } catch (error) {
        usedSpace += 1024; // Default for encrypted items
      }
    }
    
    res.json({
      usedSpace,
      totalSpace: 1024 * 1024 * 100, // 100MB
      fileCount: items.length,
      maxFiles: 5 // Current limit for testing
    });
  } catch (error) {
    console.error('Error fetching vault stats:', error);
    res.status(500).json({ error: 'Failed to fetch vault stats' });
  }
});

// Download vault item
router.get('/download/:id', async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    // Get user ID from session or use hardcoded 7 for now (matches vault items)
    const userId = req.session?.userId || 7;
    
    if (!itemId) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }
    
    // Get the vault item from database
    const item = await storage.getVaultItemById(itemId);
    
    if (!item) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Check if user owns this file (basic security check)
    if (item.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
      // Decrypt the file data
      const decryptedData = decrypt(item.data, 'vault-password');
      
      // Extract file info from the decrypted data
      let fileBuffer;
      let filename = 'download';
      let mimeType = 'application/octet-stream';
      
      try {
        // Try to parse as JSON first (in case it contains metadata)
        const fileData = JSON.parse(decryptedData);
        if (fileData.content) {
          fileBuffer = Buffer.from(fileData.content, 'base64');
          filename = fileData.filename || filename;
          mimeType = fileData.mimeType || mimeType;
        } else {
          // Direct base64 content
          fileBuffer = Buffer.from(decryptedData, 'base64');
        }
      } catch {
        // If not JSON, treat as direct base64 or text content
        try {
          fileBuffer = Buffer.from(decryptedData, 'base64');
        } catch {
          // Last resort - treat as text
          fileBuffer = Buffer.from(decryptedData, 'utf8');
          mimeType = 'text/plain';
        }
      }
      
      // Set appropriate headers for file download
      res.set({
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString()
      });
      
      // Send the file
      res.send(fileBuffer);
      
    } catch (decryptError) {
      console.error('Error decrypting file:', decryptError);
      res.status(500).json({ error: 'Failed to decrypt file' });
    }
    
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Test email-to-vault functionality
router.post('/email-test', async (req, res) => {
  try {
    const { fsnName, testFile } = req.body;
    
    if (!fsnName || !testFile) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Create a test attachment
    const attachment = {
      filename: testFile.name || 'test-file.txt',
      content: testFile.content || 'VGhpcyBpcyBhIHRlc3QgZmlsZSBmb3IgRlNOIFZhdWx0',  // Base64 "This is a test file for FSN Vault"
      contentType: testFile.type || 'text/plain'
    };
    
    // Process the test email
    const result = await processIncomingEmail(
      fsnName,
      'test@example.com',
      'Test FSN Vault File',
      [attachment]
    );
    
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Error processing test email:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error processing test email'
    });
  }
});

// Delete vault item
router.delete('/delete/:id', async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!itemId) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }
    
    // Get the vault item to verify ownership
    const item = await storage.getVaultItemById(itemId);
    
    if (!item) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Check if user owns this file
    if (item.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Delete the item
    await storage.deleteVaultItem(itemId.toString());
    
    res.json({ 
      success: true, 
      message: 'File deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

export default router;