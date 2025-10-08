// Vault file list component
import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { VaultKeyManager } from '../lib/encryption';

interface VaultFile {
  itemId: string;
  originalName: string;
  mimeType: string;
  size: number;
  cid: string;
  uploadedAt: string;
  encrypted: boolean;
  gateway?: string;
}

interface VaultFileListProps {
  refreshTrigger?: number;
}

const VaultFileList: React.FC<VaultFileListProps> = ({ refreshTrigger }) => {
  // Temporarily disabled to prevent fetch errors
  const address = undefined;
  const isConnected = false;
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appMode, setAppMode] = useState<'STEALTH' | 'PUBLIC'>('STEALTH');

  const loadVaultFiles = async () => {
    if (!isConnected || !address) {
      setFiles([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/vault/list?address=${address}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load files');
      }

      setFiles(data.items || []);
      setAppMode(data.mode || 'STEALTH');
    } catch (err: any) {
      console.error('Failed to load vault files:', err);
      setError(err.message || 'Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVaultFiles();
  }, [address, isConnected, refreshTrigger]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown date';
    }
  };

  const getMimeTypeIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.startsWith('text/')) return '📝';
    return '📁';
  };

  const getKeyStatus = (itemId: string): { hasKey: boolean; checksum?: string } => {
    const checksum = VaultKeyManager.getKeyChecksum(itemId);
    return {
      hasKey: checksum !== null,
      checksum: checksum || undefined
    };
  };

  const handleDeleteFile = async (itemId: string) => {
    if (!address) return;

    const confirmDelete = window.confirm(
      'Are you sure you want to delete this file? This will hide it from your vault but the file will remain on IPFS.'
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/vault/item/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: address })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Delete failed');
      }

      // Remove from local list
      setFiles(files.filter(f => f.itemId !== itemId));
      
      // Remove encryption key
      VaultKeyManager.removeKey(itemId);

    } catch (err: any) {
      console.error('Delete failed:', err);
      alert(`Delete failed: ${err.message}`);
    }
  };

  if (!isConnected) {
    return (
      <div className="vault-files">
        <div className="connect-notice">
          <div className="notice-icon">🔗</div>
          <div>
            <strong>Connect Wallet to View Files</strong>
            <div>Your encrypted files are linked to your wallet address</div>
          </div>
        </div>

        <style>{`
          .vault-files {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
          }

          .connect-notice {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 24px;
            background: rgba(10, 25, 41, 0.8);
            border: 1px solid rgba(0, 240, 255, 0.3);
            border-radius: 16px;
            text-align: center;
          }

          .notice-icon {
            font-size: 32px;
          }

          .connect-notice strong {
            color: #00f0ff;
            font-size: 16px;
            display: block;
            margin-bottom: 4px;
          }

          .connect-notice div div {
            color: #66fcf1;
            font-size: 14px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="vault-files">
      <div className="files-header">
        <h3>Your Vault Files</h3>
        <div className="mode-indicator">
          <span className={`mode-badge ${appMode.toLowerCase()}`}>
            {appMode} Mode
          </span>
        </div>
      </div>

      {isLoading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Loading your files...</span>
        </div>
      )}

      {error && (
        <div className="error-state">
          <div className="error-icon">❌</div>
          <div>
            <strong>Failed to load files</strong>
            <div>{error}</div>
          </div>
          <button onClick={loadVaultFiles} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && files.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <div>
            <strong>No files in your vault</strong>
            <div>Upload your first file to get started</div>
          </div>
        </div>
      )}

      {!isLoading && !error && files.length > 0 && (
        <div className="files-grid">
          {files.map((file) => {
            const keyStatus = getKeyStatus(file.itemId);
            
            return (
              <div key={file.itemId} className="file-card">
                <div className="file-header">
                  <div className="file-icon">
                    {getMimeTypeIcon(file.mimeType)}
                  </div>
                  <div className="file-info">
                    <div className="file-name" title={file.originalName}>
                      {file.originalName}
                    </div>
                    <div className="file-meta">
                      {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                    </div>
                  </div>
                </div>

                <div className="file-status">
                  <div className="encryption-status">
                    <span className="status-icon">🔐</span>
                    <span>Encrypted</span>
                  </div>
                  
                  {keyStatus.hasKey ? (
                    <div className="key-status available">
                      <span className="status-icon">🔑</span>
                      <span>Key Available</span>
                    </div>
                  ) : (
                    <div className="key-status missing">
                      <span className="status-icon">⚠️</span>
                      <span>Key Missing</span>
                    </div>
                  )}
                </div>

                <div className="file-actions">
                  {appMode === 'PUBLIC' && file.gateway && (
                    <button 
                      className="action-button view"
                      onClick={() => window.open(file.gateway, '_blank')}
                    >
                      View on IPFS
                    </button>
                  )}
                  
                  {appMode === 'STEALTH' && (
                    <div className="stealth-notice">
                      Gateway links hidden in STEALTH mode
                    </div>
                  )}

                  <button 
                    className="action-button delete"
                    onClick={() => handleDeleteFile(file.itemId)}
                  >
                    Delete
                  </button>
                </div>

                <div className="file-details">
                  <div className="detail-item">
                    <span>CID:</span>
                    <code>{file.cid.substring(0, 20)}...</code>
                  </div>
                  {keyStatus.checksum && (
                    <div className="detail-item">
                      <span>Key:</span>
                      <code>{keyStatus.checksum}</code>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .vault-files {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
        }

        .files-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .files-header h3 {
          color: #00f0ff;
          margin: 0;
          font-size: 24px;
        }

        .mode-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .mode-badge.stealth {
          background: rgba(255, 193, 7, 0.2);
          color: #ffc107;
          border: 1px solid #ffc107;
        }

        .mode-badge.public {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid #22c55e;
        }

        .loading-state,
        .error-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 40px;
          background: rgba(10, 25, 41, 0.8);
          border: 1px solid rgba(0, 240, 255, 0.3);
          border-radius: 16px;
          text-align: center;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(0, 240, 255, 0.2);
          border-top: 3px solid #00f0ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .error-icon,
        .empty-icon {
          font-size: 48px;
        }

        .retry-button {
          background: #00f0ff;
          color: #000;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .retry-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 240, 255, 0.4);
        }

        .files-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .file-card {
          background: rgba(10, 25, 41, 0.8);
          border: 1px solid rgba(0, 240, 255, 0.3);
          border-radius: 16px;
          padding: 20px;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .file-card:hover {
          border-color: #00f0ff;
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(0, 240, 255, 0.2);
        }

        .file-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
        }

        .file-icon {
          font-size: 32px;
          flex-shrink: 0;
        }

        .file-info {
          flex: 1;
          min-width: 0;
        }

        .file-name {
          color: #00f0ff;
          font-weight: bold;
          font-size: 16px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 4px;
        }

        .file-meta {
          color: #66fcf1;
          font-size: 12px;
        }

        .file-status {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }

        .encryption-status,
        .key-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }

        .encryption-status {
          color: #22c55e;
        }

        .key-status.available {
          color: #22c55e;
        }

        .key-status.missing {
          color: #ef4444;
        }

        .status-icon {
          font-size: 14px;
        }

        .file-actions {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .action-button {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
        }

        .action-button.view {
          background: #00f0ff;
          color: #000;
        }

        .action-button.delete {
          background: transparent;
          color: #ef4444;
          border: 1px solid #ef4444;
        }

        .action-button:hover {
          transform: translateY(-1px);
        }

        .stealth-notice {
          color: #ffc107;
          font-size: 11px;
          font-style: italic;
        }

        .file-details {
          border-top: 1px solid rgba(0, 240, 255, 0.2);
          padding-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
        }

        .detail-item span {
          color: #66fcf1;
          font-weight: bold;
        }

        .detail-item code {
          color: #00f0ff;
          background: rgba(0, 240, 255, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .files-grid {
            grid-template-columns: 1fr;
          }

          .files-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .file-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export { VaultFileList };
export default VaultFileList;