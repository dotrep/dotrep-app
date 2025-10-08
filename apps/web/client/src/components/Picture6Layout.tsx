import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PulseRing from './PulseRing';
import XPBar from './XPBar';
import VaultFileList from './VaultFileList';
import DebugPanel from './DebugPanel';
import '../styles/fsn.css';

interface Picture6LayoutProps {
  userId: number;
  fsnName: string;
}

interface VaultItem {
  id: number;
  itemId: string;
  itemType: string;
  fsnName: string;
  createdAt: string;
  updatedAt: string;
  data?: {
    filename?: string;
    originalName?: string;
    content?: string;
  };
}

const Picture6Layout: React.FC<Picture6LayoutProps> = ({ userId, fsnName }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [debugMode, setDebugMode] = useState(false);
  const [showXpGain, setShowXpGain] = useState(false);
  const queryClient = useQueryClient();

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: [`/api/user/stats/${userId}`],
    enabled: !!userId,
  });

  // Fetch vault items
  const { data: vaultItems = [] } = useQuery<VaultItem[]>({
    queryKey: [`/api/vault/users/${userId}/items`],
    enabled: !!userId,
  });

  const totalXP = (userStats as any)?.xpPoints || 0;
  const maxXP = 1000;
  const currentRank = totalXP >= 1000 ? "Sentinel" : "Initial Pulse";

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileContent = e.target?.result as string;
        
        const uploadData = {
          userId,
          fsnName,
          itemType: 'file',
          data: fileContent,
          password: 'fsn-vault-access',
          fileName: file.name
        };

        const response = await fetch('/api/vault/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(uploadData),
        });

        if (response.ok) {
          const result = await response.json();
          queryClient.invalidateQueries({ queryKey: [`/api/vault/users/${userId}/items`] });
          queryClient.invalidateQueries({ queryKey: [`/api/user/stats/${userId}`] });
          
          if (!result.isDuplicate) {
            setShowXpGain(true);
          }
          
          if (result.isDuplicate) {
            setUploadError('File already exists - no XP awarded');
          }
        } else {
          const errorData = await response.json();
          setUploadError(errorData.error || 'Upload failed');
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Debug functions
  const handleAddXP = async () => {
    try {
      const currentStats = queryClient.getQueryData([`/api/user/stats/${userId}`]) as any;
      const newXP = (currentStats?.xpPoints || 0) + 10;
      
      await fetch(`/api/user/stats/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xpPoints: newXP })
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/user/stats/${userId}`] });
      setShowXpGain(true);
    } catch (error) {
      console.error('Error adding XP:', error);
    }
  };

  const handleSimUpload = () => {
    setShowXpGain(true);
  };

  const handleTriggerPulse = () => {
    setShowXpGain(true);
  };

  return (
    <div className="picture6-fullscreen">
      <div className="picture6-content">
        {/* Left Side - Pulse Ring and Rank */}
        <div className="left-section">
          <div className="pulse-area">
            <PulseRing 
              showXpGain={showXpGain}
              onAnimationComplete={() => setShowXpGain(false)}
            />
          </div>
          
          <div className="rank-section">
            <div className="rank-shield">🛡️</div>
            <div className="rank-name">Sentinel</div>
            <div className="rank-status">Initial Pulse</div>
          </div>
        </div>

        {/* Right Side - Upload and Files */}
        <div className="right-section">
          {/* Upload Button */}
          <div className="upload-area">
            <input
              type="file"
              id="file-upload-picture6"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <button
              className="upload-button"
              onClick={() => document.getElementById('file-upload-picture6')?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>

          {/* File List - Picture 6 Style */}
          <div className="vault-files-container">
            <div className="files-header">
              <span className="folder-icon">📁</span>
              <span className="files-title">My Vault Files</span>
            </div>
            <div className="files-list">
              <div className="file-entry">
                <span className="file-icon">📄</span>
                <div className="file-info">
                  <div className="file-name">report.pdf</div>
                  <div className="file-date">4/24/2024</div>
                </div>
              </div>
              <div className="file-entry">
                <span className="file-icon">🖼️</span>
                <div className="file-info">
                  <div className="file-name">photo.png</div>
                  <div className="file-date">4/24/2024</div>
                </div>
              </div>
            </div>
          </div>

          {/* XP Progress - Picture 6 Style */}
          <div className="xp-progress-container">
            <div className="xp-header">
              <span className="play-icon">▶</span>
              <span className="rank-title">Sentinel</span>
            </div>
            <div className="xp-progress-bar">
              <div className="xp-fill" style={{ width: '96%' }}></div>
            </div>
            <div className="xp-text">960 / 1000 XP</div>
          </div>

          {/* Debug Panel - Picture 6 Style */}
          <div className="debug-panel-inline">
            <span className="debug-label">Debug Panel</span>
            <div className="debug-controls">
              <button className="debug-btn-inline" onClick={handleAddXP}>+10 XP</button>
              <button className="debug-btn-inline" onClick={handleSimUpload}>Sim Upload</button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden Debug Panel */}
      <DebugPanel
        debugMode={debugMode}
        onToggleDebug={() => setDebugMode(!debugMode)}
        onAddXP={handleAddXP}
        onSimUpload={handleSimUpload}
        onTriggerPulse={handleTriggerPulse}
      />
    </div>
  );
};

export default Picture6Layout;