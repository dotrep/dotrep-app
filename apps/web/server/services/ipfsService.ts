// IPFS service for secure vault file storage
import axios from 'axios';
import FormData from 'form-data';
import { Readable } from 'stream';

// Environment configuration for vault system
const config = {
  VAULT_MAX_MB: parseInt(process.env.VAULT_MAX_MB || '25'),
  VAULT_ALLOWED_MIME: (process.env.VAULT_ALLOWED_MIME || 'image/png,image/jpeg,application/pdf,text/plain').split(','),
  IPFS_PROVIDER: process.env.IPFS_PROVIDER || 'pinata',
  IPFS_API_KEY: process.env.IPFS_API_KEY || '',
  IPFS_SECRET_KEY: process.env.IPFS_SECRET_KEY || '',
  IPFS_GATEWAY: process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',
  APP_MODE: process.env.VITE_APP_MODE || 'STEALTH',
  FILES_ADDRESS: process.env.FILES_ADDRESS || '',
  VAULT_MAX_FILES_PER_DAY: parseInt(process.env.VAULT_MAX_FILES_PER_DAY || '20'),
};

export interface IPFSUploadResult {
  cid: string;
  size: number;
  gateway?: string;
}

export interface VaultUploadRequest {
  encryptedBuffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
  walletAddress: string;
}

// Validate file before processing
export function validateVaultFile(
  size: number, 
  mimeType: string, 
  filename: string
): { valid: boolean; error?: string } {
  // Check file size
  const maxBytes = config.VAULT_MAX_MB * 1024 * 1024;
  if (size > maxBytes) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${config.VAULT_MAX_MB}MB`
    };
  }

  // Check MIME type
  if (!config.VAULT_ALLOWED_MIME.includes(mimeType)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${config.VAULT_ALLOWED_MIME.join(', ')}`
    };
  }

  // Check for dangerous file extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.zip', '.rar'];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  if (dangerousExtensions.includes(ext)) {
    return {
      valid: false,
      error: 'Executable and archive files are not allowed'
    };
  }

  return { valid: true };
}

// Pin file to IPFS using Pinata
async function pinToPinata(
  encryptedBuffer: Buffer, 
  filename: string, 
  mimeType: string
): Promise<IPFSUploadResult> {
  if (!config.IPFS_API_KEY || !config.IPFS_SECRET_KEY) {
    throw new Error('Pinata API credentials not configured');
  }

  try {
    const formData = new FormData();
    
    // Create a readable stream from buffer
    const stream = Readable.from(encryptedBuffer);
    formData.append('file', stream, {
      filename: filename,
      contentType: mimeType,
    });

    // Add metadata
    const metadata = {
      name: filename,
      keyvalues: {
        encrypted: 'true',
        mime: mimeType,
        app: config.APP_MODE === 'STEALTH' ? 'vault' : 'fsn-vault',
        timestamp: new Date().toISOString()
      }
    };
    
    formData.append('pinataMetadata', JSON.stringify(metadata));

    // Pin options for private/public mode
    const pinataOptions = {
      cidVersion: 1,
      // In STEALTH mode, we can add custom pin policies
      ...(config.APP_MODE === 'STEALTH' ? {
        customPinPolicy: {
          regions: ['nyc1'], // Limit to specific regions in stealth
        }
      } : {})
    };
    
    formData.append('pinataOptions', JSON.stringify(pinataOptions));

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'pinata_api_key': config.IPFS_API_KEY,
          'pinata_secret_api_key': config.IPFS_SECRET_KEY,
        },
        maxContentLength: config.VAULT_MAX_MB * 1024 * 1024 * 2, // 2x buffer
        timeout: 60000, // 60 second timeout
      }
    );

    if (!response.data.IpfsHash) {
      throw new Error('No IPFS hash returned from Pinata');
    }

    const result: IPFSUploadResult = {
      cid: response.data.IpfsHash,
      size: response.data.PinSize || encryptedBuffer.length,
    };

    // Add gateway URL only in PUBLIC mode
    if (config.APP_MODE === 'PUBLIC') {
      result.gateway = `${config.IPFS_GATEWAY}${result.cid}`;
    }

    console.log(`✅ File pinned to IPFS: ${result.cid} (${result.size} bytes)`);
    return result;

  } catch (error: any) {
    console.error('❌ Pinata upload failed:', error.response?.data || error.message);
    throw new Error(`IPFS upload failed: ${error.message}`);
  }
}

// Pin file to Web3.Storage (alternative provider)
async function pinToWeb3Storage(
  encryptedBuffer: Buffer, 
  filename: string, 
  mimeType: string
): Promise<IPFSUploadResult> {
  if (!config.IPFS_API_KEY) {
    throw new Error('Web3.Storage API token not configured');
  }

  try {
    const formData = new FormData();
    const stream = Readable.from(encryptedBuffer);
    formData.append('file', stream, {
      filename: filename,
      contentType: mimeType,
    });

    const response = await axios.post(
      'https://api.web3.storage/upload',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${config.IPFS_API_KEY}`,
        },
        maxContentLength: config.VAULT_MAX_MB * 1024 * 1024 * 2,
        timeout: 60000,
      }
    );

    if (!response.data.cid) {
      throw new Error('No CID returned from Web3.Storage');
    }

    const result: IPFSUploadResult = {
      cid: response.data.cid,
      size: encryptedBuffer.length,
    };

    if (config.APP_MODE === 'PUBLIC') {
      result.gateway = `https://w3s.link/ipfs/${result.cid}`;
    }

    console.log(`✅ File pinned to Web3.Storage: ${result.cid}`);
    return result;

  } catch (error: any) {
    console.error('❌ Web3.Storage upload failed:', error.response?.data || error.message);
    throw new Error(`IPFS upload failed: ${error.message}`);
  }
}

// Main IPFS upload function
export async function uploadToIPFS(request: VaultUploadRequest): Promise<IPFSUploadResult> {
  // Validate file
  const validation = validateVaultFile(request.size, request.mimeType, request.originalName);
  if (!validation.valid) {
    throw new Error(validation.error!);
  }

  // Choose provider and upload
  switch (config.IPFS_PROVIDER) {
    case 'pinata':
      return await pinToPinata(request.encryptedBuffer, request.originalName, request.mimeType);
    case 'web3storage':
      return await pinToWeb3Storage(request.encryptedBuffer, request.originalName, request.mimeType);
    default:
      throw new Error(`Unsupported IPFS provider: ${config.IPFS_PROVIDER}`);
  }
}

// Generate CID hash for on-chain events (32 bytes)
export function generateCIDHash(cid: string): string {
  // Simple approach: keccak256(utf8(cid))
  const { keccak256, toUtf8Bytes } = require('ethers');
  return keccak256(toUtf8Bytes(cid));
}

// Get IPFS gateway URL (PUBLIC mode only)
export function getGatewayURL(cid: string): string | null {
  if (config.APP_MODE !== 'PUBLIC') {
    return null; // Hide gateway URLs in STEALTH mode
  }
  return `${config.IPFS_GATEWAY}${cid}`;
}

// Check daily upload limits for a wallet
export async function checkDailyUploadLimit(walletAddress: string): Promise<{ allowed: boolean; remaining: number }> {
  // This would typically query the database for today's uploads
  // For now, return a mock implementation
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  // TODO: Query actual database for uploads today
  const uploadsToday = 0; // Replace with actual query
  
  const remaining = Math.max(0, config.VAULT_MAX_FILES_PER_DAY - uploadsToday);
  
  return {
    allowed: uploadsToday < config.VAULT_MAX_FILES_PER_DAY,
    remaining
  };
}

export { config as vaultConfig };