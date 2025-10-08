// Vault routes for secure file storage with IPFS
import { Router } from 'express';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import { storage } from '../storage';
import { uploadToIPFS, generateCIDHash, getGatewayURL, checkDailyUploadLimit, vaultConfig } from '../services/ipfsService';
import { ethers } from 'ethers';

const router = Router();

// Rate limiting by IP address (simple implementation)
const uploadAttempts = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempts = uploadAttempts.get(ip) || [];
  
  // Keep only attempts from last hour
  const recentAttempts = attempts.filter(time => now - time < 60 * 60 * 1000);
  uploadAttempts.set(ip, recentAttempts);
  
  // Allow max 10 uploads per hour per IP
  return recentAttempts.length < 10;
}

// Upload encrypted file to vault
router.post('/upload', async (req, res) => {
  try {
    // Check rate limiting
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Try again later.'
      });
    }

    // Parse multipart form data
    const form = formidable({
      maxFileSize: vaultConfig.VAULT_MAX_MB * 1024 * 1024,
      maxTotalFileSize: vaultConfig.VAULT_MAX_MB * 1024 * 1024,
      allowEmptyFiles: false,
    });

    const [fields, files] = await form.parse(req);
    
    // Extract required fields
    const walletAddress = Array.isArray(fields.walletAddress) ? fields.walletAddress[0] : fields.walletAddress;
    const originalName = Array.isArray(fields.filename) ? fields.filename[0] : fields.filename;
    const mimeType = Array.isArray(fields.mimeType) ? fields.mimeType[0] : fields.mimeType;

    if (!walletAddress || !originalName || !mimeType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: walletAddress, filename, mimeType'
      });
    }

    // Validate Ethereum address
    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      });
    }

    // Check daily upload limit
    const limitCheck = await checkDailyUploadLimit(walletAddress);
    if (!limitCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: `Daily upload limit reached. Limit: ${vaultConfig.VAULT_MAX_FILES_PER_DAY} files per day`
      });
    }

    // Get uploaded file
    const fileArray = files.file;
    const uploadedFile = Array.isArray(fileArray) ? fileArray[0] : fileArray;
    
    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Read encrypted file buffer
    const encryptedBuffer = await fs.readFile(uploadedFile.filepath);
    
    // Validate file size matches declared size
    if (encryptedBuffer.length > vaultConfig.VAULT_MAX_MB * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        error: `File too large. Maximum size: ${vaultConfig.VAULT_MAX_MB}MB`
      });
    }

    console.log(`📁 Processing vault upload: ${originalName} (${encryptedBuffer.length} bytes) for ${walletAddress}`);

    // Upload to IPFS
    const ipfsResult = await uploadToIPFS({
      encryptedBuffer,
      originalName,
      mimeType,
      size: encryptedBuffer.length,
      walletAddress
    });

    // Generate unique item ID
    const itemId = `vault_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save metadata to database
    const vaultItem = await storage.createVaultItem({
      userId: 0, // We'll need to map wallet address to user ID
      fsnName: 'unknown', // We'll need to get this from wallet
      itemId,
      itemType: 'encrypted_file',
      data: JSON.stringify({
        cid: ipfsResult.cid,
        originalName,
        mimeType,
        size: encryptedBuffer.length,
        walletAddress,
        gateway: ipfsResult.gateway,
        encrypted: true,
        uploadedAt: new Date().toISOString(),
        appMode: vaultConfig.APP_MODE
      })
    });

    // Record rate limit attempt
    const now = Date.now();
    const attempts = uploadAttempts.get(clientIP) || [];
    attempts.push(now);
    uploadAttempts.set(clientIP, attempts);

    // Prepare response
    const response: any = {
      success: true,
      itemId,
      cid: ipfsResult.cid,
      size: encryptedBuffer.length,
      message: 'File uploaded and pinned to IPFS successfully'
    };

    // Add gateway URL only in PUBLIC mode
    if (vaultConfig.APP_MODE === 'PUBLIC' && ipfsResult.gateway) {
      response.gateway = ipfsResult.gateway;
    }

    // In PUBLIC mode, we would also emit on-chain event here
    if (vaultConfig.APP_MODE === 'PUBLIC' && vaultConfig.FILES_ADDRESS) {
      const cidHash = generateCIDHash(ipfsResult.cid);
      response.cidHash = cidHash;
      response.requiresOnChainAnchor = true;
      console.log(`🔗 On-chain anchor required: ${cidHash}`);
    }

    // Clean up temporary file
    try {
      await fs.unlink(uploadedFile.filepath);
    } catch (error) {
      console.warn('Failed to clean up temp file:', error);
    }

    console.log(`✅ Vault upload complete: ${ipfsResult.cid}`);
    res.json(response);

  } catch (error: any) {
    console.error('❌ Vault upload failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Upload failed'
    });
  }
});

// List vault files for a wallet address
router.get('/list', async (req, res) => {
  try {
    const { address } = req.query;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Wallet address required'
      });
    }

    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      });
    }

    // TODO: Query vault items by wallet address
    // For now, return empty list since we need to implement the storage method
    const vaultItems: any[] = [];

    // Transform items for client
    const items = vaultItems.map((item: any) => {
      const data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
      
      const result: any = {
        itemId: item.itemId,
        originalName: data.originalName,
        mimeType: data.mimeType,
        size: data.size,
        cid: data.cid,
        uploadedAt: data.uploadedAt,
        encrypted: data.encrypted
      };

      // Add gateway URL only in PUBLIC mode
      if (vaultConfig.APP_MODE === 'PUBLIC' && data.cid) {
        result.gateway = getGatewayURL(data.cid);
      }

      return result;
    });

    res.json({
      success: true,
      address,
      items,
      count: items.length,
      mode: vaultConfig.APP_MODE
    });

  } catch (error: any) {
    console.error('❌ Failed to list vault items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve vault items'
    });
  }
});

// Mark vault item as deleted (soft delete)
router.delete('/item/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { walletAddress } = req.body;

    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Valid wallet address required'
      });
    }

    // TODO: Implement soft delete in storage
    // await storage.softDeleteVaultItem(itemId, walletAddress);

    res.json({
      success: true,
      message: 'Item marked as deleted (hidden from UI)',
      note: 'File remains on IPFS network'
    });

  } catch (error: any) {
    console.error('❌ Failed to delete vault item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete item'
    });
  }
});

// Get vault statistics for a wallet
router.get('/stats', async (req, res) => {
  try {
    const { address } = req.query;

    if (!address || typeof address !== 'string' || !ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Valid wallet address required'
      });
    }

    // Check daily limits
    const limitCheck = await checkDailyUploadLimit(address);

    res.json({
      success: true,
      address,
      limits: {
        maxFileSizeMB: vaultConfig.VAULT_MAX_MB,
        maxFilesPerDay: vaultConfig.VAULT_MAX_FILES_PER_DAY,
        remainingToday: limitCheck.remaining,
        allowedMimeTypes: vaultConfig.VAULT_ALLOWED_MIME
      },
      config: {
        mode: vaultConfig.APP_MODE,
        provider: vaultConfig.IPFS_PROVIDER,
        hasFilesContract: !!vaultConfig.FILES_ADDRESS
      }
    });

  } catch (error: any) {
    console.error('❌ Failed to get vault stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
});

export default router;