import React, { useState, useEffect } from 'react';
import { X, Upload, Download, Trash2, ExternalLink, Send, Flame, Pin, PinOff } from 'lucide-react';
import { useXP } from '../context/XPContext';
import { canUpload, getCurrentTier } from '../utils/vaultTiers';
import { getVaultLimits, canUploadFile, getUploadErrorMessage } from '../utils/vaultTierEnforcement';
import VaultUpgradeModal from './VaultUpgradeModal';
import BadgeCard from './BadgeCard';
import { getAllBadges } from '../utils/badgeLogic';
import { getBadgeIcon } from '../lib/badgeIcons';
import { useQuery } from '@tanstack/react-query';
import './DataManagerModal.css';

const DataManagerModal = ({ isOpen, onClose, defaultTab = 'FILES' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [files, setFiles] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [nftAction, setNftAction] = useState(null); // For NFT management actions
  const [transferAddress, setTransferAddress] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeType, setUpgradeType] = useState('file'); // Track whether showing file or NFT upgrade modal
  const [userProgress, setUserProgress] = useState(() => {
    const saved = localStorage.getItem('userProgress');
    return saved ? JSON.parse(saved) : {};
  });
  
  const { xpPoints, rewardUpload } = useXP();
  
  // Fetch user stats for badge calculations
  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats'],
    refetchInterval: 5000
  });

  // Update activeTab when defaultTab changes
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // Fetch vault data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchVaultData();
    }
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  const fetchVaultData = async () => {
    setLoading(true);
    try {
      // Fetch files from API
      const filesResponse = await fetch('/api/vault/items', {
        credentials: 'include'
      });
      
      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        
        // All vault files are of type general/file now
        const fileData = filesData;
        setFiles(fileData);
        
        // Fetch user stats for NFT badge system
        try {
          const statsResponse = await fetch('/api/user/stats', {
            credentials: 'include'
          });
          
          if (statsResponse.ok) {
            const userStats = await statsResponse.json();
            const { formatUserNFTs } = await import('../lib/badgeSystem');
            const userNFTs = formatUserNFTs(userStats);
            const collectibleNFTs = userNFTs.filter(nft => nft.type === 'collectible');
            
            // Convert collectibles to display format for consistency
            const processedNfts = collectibleNFTs.map((nft, index) => ({
              id: nft.id,
              name: nft.name,
              tokenId: `#${String(index + 1).padStart(3, '0')}`,
              collection: "FSN Network",
              image: nft.visual || "data:image/svg+xml;base64," + btoa(`
                <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#00f0ff;stop-opacity:1" />
                      <stop offset="100%" style="stop-color:#0080ff;stop-opacity:1" />
                    </linearGradient>
                  </defs>
                  <rect width="200" height="200" fill="url(#grad1)" rx="20"/>
                  <circle cx="100" cy="70" r="25" fill="#ffffff" opacity="0.9"/>
                  <text x="100" y="130" text-anchor="middle" fill="#ffffff" font-family="Orbitron" font-size="16" font-weight="bold">FSN</text>
                  <text x="100" y="150" text-anchor="middle" fill="#ffffff" font-family="Orbitron" font-size="12">NFT</text>
                </svg>
              `),
              chainUrl: "https://etherscan.io/token/0x" + nft.id,
              isPinned: false,
              rarity: nft.rarity,
              description: nft.description,
              count: nft.count || 1
            }));
            
            setNfts(processedNfts);
          } else {
            setNfts([]);
          }
        } catch (error) {
          console.error('Error fetching user stats for NFTs:', error);
          setNfts([]);
        }
      } else {
        console.error('Failed to fetch files:', await filesResponse.text());
      }
    } catch (error) {
      console.error('Error fetching vault data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check vault tier limits before upload
    const fileCount = files.filter(item => 
      item.type === 'general' || item.type === 'file'
    ).length;
    const nftCount = nfts.length;
    
    if (!canUpload(xpPoints, fileCount, nftCount, 'file')) {
      setUpgradeType('file');
      setShowUpgradeModal(true);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', `Uploaded via Data Manager`);
    formData.append('type', 'general');

    try {
      setLoading(true);
      setError(null);
      setUploadProgress(10);
      
      const response = await fetch('/api/vault/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include' // Include session cookies for authentication
      });

      if (response.ok) {
        await fetchVaultData(); // Refresh file list
        
        // Award XP for file upload using Batch 5 reward system
        rewardUpload(file.name);
        
        // Emit vault upload success event for onboarding tracking
        window.dispatchEvent(new CustomEvent('vault-upload-success', {
          detail: { filename: file.name, timestamp: new Date().toISOString() }
        }));
        
        console.log('File uploaded successfully');
      } else {
        const errorData = await response.json();
        console.error('Upload failed:', errorData);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileDelete = async (fileId) => {
    try {
      // Get userId from localStorage where it's stored
      const storedUser = localStorage.getItem('user');
      const userData = storedUser ? JSON.parse(storedUser) : null;
      const userId = userData ? userData.id : '7'; // Fallback to current user ID
      
      const response = await fetch(`/api/vault/items/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId: userId })
      });

      if (response.ok) {
        setFiles(files.filter(f => f.id !== fileId));
        setDeleteConfirm(null);
        console.log('File deleted successfully');
      } else {
        const errorData = await response.json();
        console.error('Delete failed:', errorData);
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recent';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Recent';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Recent';
    }
  };

  // NFT Management Functions
  const handleNFTTransfer = async (nftId) => {
    if (!transferAddress) return;
    
    // Simulate NFT transfer
    console.log(`Transferring NFT ${nftId} to ${transferAddress}`);
    setNftAction(null);
    setTransferAddress('');
    
    // Update NFT list to remove transferred NFT
    setNfts(nfts.filter(nft => nft.id !== nftId));
  };

  const handleNFTBurn = async (nftId) => {
    // Simulate NFT burn
    console.log(`Burning NFT ${nftId}`);
    setNftAction(null);
    
    // Remove NFT from list
    setNfts(nfts.filter(nft => nft.id !== nftId));
  };

  const handleNFTPin = async (nftId) => {
    // Toggle pin status
    setNfts(nfts.map(nft => 
      nft.id === nftId 
        ? { ...nft, isPinned: !nft.isPinned }
        : { ...nft, isPinned: false } // Unpin others
    ));
    setNftAction(null);
  };

  if (!isOpen) return null;

  return (
    <div className="data-manager-overlay" onClick={onClose}>
      <div className="data-manager-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">📁 Data Manager</h2>
            <p className="modal-subtitle">Secure decentralized storage view</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'FILES' ? 'active' : ''}`}
            onClick={() => setActiveTab('FILES')}
          >
            FILES
          </button>
          <button 
            className={`tab-btn ${activeTab === 'NFTS' ? 'active' : ''}`}
            onClick={() => setActiveTab('NFTS')}
          >
            NFTS
          </button>
        </div>

        {/* Content Area */}
        <div className="modal-content">
          {activeTab === 'FILES' && (
            <div className="files-view">
              {loading ? (
                <div className="loading-state">Loading files...</div>
              ) : files.length === 0 ? (
                <div className="empty-state">
                  <p>📂 No files uploaded yet. Your Vault is empty.</p>
                </div>
              ) : (
                <div className="files-grid">
                  <div className="files-header">
                    <span>Filename</span>
                    <span>Size</span>
                    <span>Date Uploaded</span>
                    <span>Actions</span>
                  </div>
                  {files.map(file => (
                    <div key={file.id} className="file-row">
                      <span className="file-name">{file.filename}</span>
                      <span className="file-size">{formatFileSize(file.size || 0)}</span>
                      <span className="file-date">{formatDate(file.uploadedAt)}</span>
                      <div className="file-actions">
                        <button 
                          className="action-btn download-btn"
                          onClick={() => window.open(`/api/vault/download/${file.id}`)}
                        >
                          <Download size={16} />
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => setDeleteConfirm(file.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="modal-actions">
                <label className="upload-btn">
                  <Upload size={16} />
                  Upload New File
                  <input 
                    type="file" 
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
                <button className="back-btn" onClick={onClose}>
                  Back to Vault
                </button>
              </div>
            </div>
          )}

          {activeTab === 'NFTS' && (
            <div className="nfts-view">
              {(() => {
                const allBadges = getAllBadges(userStats, userProgress);
                const earnedBadges = allBadges.filter(badge => badge.earned);
                
                return earnedBadges.length === 0 ? (
                  <div className="empty-state">
                    <p>Complete FSN challenges to earn your first badges 🧬</p>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '16px',
                    padding: '16px'
                  }}>
                    {earnedBadges.map(badge => (
                      <BadgeCard
                        key={badge.id}
                        title={badge.title}
                        earned={badge.earned}
                        icon={getBadgeIcon(badge.id)}
                        soulbound={badge.soulbound}
                        equipped={badge.equipped}
                        xpBonus={badge.xpBonus}
                        rarity={badge.rarity}
                        size="medium"
                        showActions={false}
                      />
                    ))}
                  </div>
                );
              })()}
              
              <div className="modal-actions">
                <button className="back-btn" onClick={onClose}>
                  Back to Vault
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="delete-overlay">
            <div className="delete-modal">
              <h3>⚠️ Are you sure you want to delete this file?</h3>
              <div className="delete-actions">
                <button 
                  className="confirm-delete-btn"
                  onClick={() => handleFileDelete(deleteConfirm)}
                >
                  Delete
                </button>
                <button 
                  className="cancel-btn"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NFT Action Modals */}
        {nftAction && (
          <div className="delete-overlay">
            <div className="delete-modal nft-action-modal">
              {nftAction.type === 'transfer' && (
                <>
                  <h3>🔁 Transfer NFT</h3>
                  <p>Enter the destination wallet address:</p>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={transferAddress}
                    onChange={(e) => setTransferAddress(e.target.value)}
                    className="transfer-input"
                  />
                  <div className="delete-actions">
                    <button 
                      className="confirm-delete-btn transfer-confirm"
                      onClick={() => handleNFTTransfer(nftAction.nftId)}
                      disabled={!transferAddress}
                    >
                      Transfer
                    </button>
                    <button 
                      className="cancel-btn"
                      onClick={() => setNftAction(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
              
              {nftAction.type === 'burn' && (
                <>
                  <h3>🔥 Burn NFT</h3>
                  <p>⚠️ This action is permanent and cannot be undone!</p>
                  <p>The NFT will be destroyed forever.</p>
                  <div className="delete-actions">
                    <button 
                      className="confirm-delete-btn burn-confirm"
                      onClick={() => handleNFTBurn(nftAction.nftId)}
                    >
                      Burn Forever
                    </button>
                    <button 
                      className="cancel-btn"
                      onClick={() => setNftAction(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Vault Upgrade Modal */}
      <VaultUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        uploadType={upgradeType || "file"}
        currentCount={upgradeType === 'nft' ? nfts.length : files.length}
        maxCount={upgradeType === 'nft' ? getCurrentTier(xpPoints).max_nfts : getCurrentTier(xpPoints).max_files}
      />
    </div>
  );
};

export default DataManagerModal;