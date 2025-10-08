// Vault upload component with client-side encryption
import React, { useState, useRef } from 'react';
import { useAccount } from 'wagmi';
import { VaultEncryption, VaultKeyManager } from '../lib/encryption';

interface UploadProgress {
  stage: 'idle' | 'encrypting' | 'uploading' | 'anchoring' | 'complete' | 'error';
  progress: number;
  message: string;
}

interface VaultUploadProps {
  onUploadComplete?: (result: any) => void;
  onUploadError?: (error: string) => void;
}

const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg', 
  'application/pdf',
  'text/plain'
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const VaultUpload: React.FC<VaultUploadProps> = ({
  onUploadComplete,
  onUploadError
}) => {
  const { address, isConnected } = useAccount();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    stage: 'idle',
    progress: 0,
    message: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProgress = (stage: UploadProgress['stage'], progress: number, message: string) => {
    setUploadProgress({ stage, progress, message });
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `File too large. Maximum size is 25MB` };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return { 
        valid: false, 
        error: `File type not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}` 
      };
    }

    return { valid: true };
  };

  const uploadFile = async (file: File) => {
    if (!isConnected || !address) {
      updateProgress('error', 0, 'Please connect your wallet first');
      onUploadError?.('Wallet not connected');
      return;
    }

    try {
      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        updateProgress('error', 0, validation.error!);
        onUploadError?.(validation.error!);
        return;
      }

      // Stage 1: Client-side encryption
      updateProgress('encrypting', 25, 'Generating encryption key...');
      const encryptionKey = await VaultEncryption.generateKey();
      
      updateProgress('encrypting', 50, 'Encrypting file...');
      const { encryptedData, iv, checksum } = await VaultEncryption.encryptFile(file, encryptionKey);
      
      // Create encrypted blob for upload
      const encryptedBlob = VaultEncryption.createEncryptedBlob(encryptedData, iv);

      // Stage 2: Upload to server
      updateProgress('uploading', 75, 'Uploading to IPFS...');
      
      const formData = new FormData();
      formData.append('file', encryptedBlob, file.name);
      formData.append('walletAddress', address);
      formData.append('filename', file.name);
      formData.append('mimeType', file.type);

      const response = await fetch('/api/vault/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Store encryption key locally
      await VaultKeyManager.storeKey(result.itemId, encryptionKey, checksum);

      // Stage 3: On-chain anchoring (PUBLIC mode only)
      if (result.requiresOnChainAnchor) {
        updateProgress('anchoring', 90, 'Anchoring on blockchain...');
        // TODO: Call Files contract to emit Pinned event
        // This would be handled by the Web3 contract operations
      }

      // Complete
      updateProgress('complete', 100, 'File uploaded successfully!');
      
      setTimeout(() => {
        updateProgress('idle', 0, '');
      }, 3000);

      onUploadComplete?.(result);

    } catch (error: any) {
      console.error('Upload failed:', error);
      updateProgress('error', 0, error.message || 'Upload failed');
      onUploadError?.(error.message || 'Upload failed');
      
      setTimeout(() => {
        updateProgress('idle', 0, '');
      }, 5000);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    uploadFile(files[0]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const isUploading = uploadProgress.stage !== 'idle' && uploadProgress.stage !== 'complete' && uploadProgress.stage !== 'error';

  return (
    <div className="vault-upload">
      {/* File drop zone */}
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          style={{ display: 'none' }}
          disabled={isUploading}
        />

        <div className="drop-zone-content">
          {uploadProgress.stage === 'idle' && (
            <>
              <div className="upload-icon">📁</div>
              <div className="upload-text">
                <strong>Click to upload or drag files here</strong>
                <div className="upload-hint">
                  Max 25MB • PNG, JPEG, PDF, TXT files only
                </div>
              </div>
            </>
          )}

          {isUploading && (
            <div className="upload-progress">
              <div className="progress-icon">
                {uploadProgress.stage === 'encrypting' && '🔐'}
                {uploadProgress.stage === 'uploading' && '☁️'}
                {uploadProgress.stage === 'anchoring' && '🔗'}
              </div>
              <div className="progress-text">
                <strong>{uploadProgress.message}</strong>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress.progress}%` }}
                  />
                </div>
                <div className="progress-percent">{uploadProgress.progress}%</div>
              </div>
            </div>
          )}

          {uploadProgress.stage === 'complete' && (
            <div className="upload-success">
              <div className="success-icon">✅</div>
              <div className="success-text">
                <strong>Upload Complete!</strong>
                <div>File encrypted and stored securely</div>
              </div>
            </div>
          )}

          {uploadProgress.stage === 'error' && (
            <div className="upload-error">
              <div className="error-icon">❌</div>
              <div className="error-text">
                <strong>Upload Failed</strong>
                <div>{uploadProgress.message}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Security notice */}
      {!isConnected && (
        <div className="security-notice">
          <div className="notice-icon">⚠️</div>
          <div>
            <strong>Connect wallet to upload files</strong>
            <div>Files are encrypted on your device before upload</div>
          </div>
        </div>
      )}

      <style>{`
        .vault-upload {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }

        .drop-zone {
          border: 2px dashed #00f0ff;
          border-radius: 16px;
          padding: 40px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(10, 25, 41, 0.5);
          backdrop-filter: blur(10px);
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .drop-zone:hover:not(.uploading) {
          border-color: #66fcf1;
          background: rgba(10, 25, 41, 0.7);
          transform: translateY(-2px);
        }

        .drop-zone.dragging {
          border-color: #66fcf1;
          background: rgba(0, 240, 255, 0.1);
          transform: scale(1.02);
        }

        .drop-zone.uploading {
          border-color: #66fcf1;
          cursor: not-allowed;
        }

        .drop-zone-content {
          width: 100%;
        }

        .upload-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .upload-text strong {
          color: #00f0ff;
          font-size: 18px;
          display: block;
          margin-bottom: 8px;
        }

        .upload-hint {
          color: #66fcf1;
          font-size: 14px;
        }

        .upload-progress {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .progress-icon {
          font-size: 48px;
          animation: pulse 2s infinite;
        }

        .progress-text {
          width: 100%;
          max-width: 300px;
        }

        .progress-text strong {
          color: #00f0ff;
          font-size: 16px;
          display: block;
          margin-bottom: 12px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(0, 240, 255, 0.2);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #00f0ff, #66fcf1);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-percent {
          color: #66fcf1;
          font-size: 14px;
          text-align: center;
        }

        .upload-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .success-icon {
          font-size: 48px;
        }

        .success-text strong {
          color: #22c55e;
          font-size: 18px;
          display: block;
          margin-bottom: 8px;
        }

        .success-text div {
          color: #66fcf1;
          font-size: 14px;
        }

        .upload-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .error-icon {
          font-size: 48px;
        }

        .error-text strong {
          color: #ef4444;
          font-size: 18px;
          display: block;
          margin-bottom: 8px;
        }

        .error-text div {
          color: #ef4444;
          font-size: 14px;
        }

        .security-notice {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(255, 193, 7, 0.1);
          border: 1px solid #ffc107;
          border-radius: 12px;
          margin-top: 20px;
        }

        .notice-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .security-notice strong {
          color: #ffc107;
          font-size: 14px;
          display: block;
          margin-bottom: 4px;
        }

        .security-notice div div {
          color: rgba(255, 193, 7, 0.8);
          font-size: 12px;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @media (max-width: 768px) {
          .drop-zone {
            padding: 30px 20px;
            min-height: 160px;
          }

          .upload-icon {
            font-size: 36px;
          }

          .upload-text strong {
            font-size: 16px;
          }

          .progress-icon {
            font-size: 36px;
          }
        }
      `}</style>
    </div>
  );
};

export { VaultUpload };
export default VaultUpload;