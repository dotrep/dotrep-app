import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import '../styles/fsn.css';

interface Picture6FullScreenProps {
  userId: number;
  fsnName: string;
}

const Picture6FullScreen: React.FC<Picture6FullScreenProps> = ({ userId, fsnName }) => {
  const [uploading, setUploading] = useState(false);
  const [showXpGain, setShowXpGain] = useState(false);
  const queryClient = useQueryClient();

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: [`/api/user/stats/${userId}`],
    enabled: !!userId,
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

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
            setTimeout(() => setShowXpGain(false), 2000);
          }
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

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
      setTimeout(() => setShowXpGain(false), 2000);
    } catch (error) {
      console.error('Error adding XP:', error);
    }
  };

  return (
    <div className="picture6-fullscreen-overlay">
      <div className="picture6-grid">
        {/* Left Column - FSN Pulse Ring */}
        <div className="left-column">
          <div className="pulse-container">
            {/* XP Gain Indicator */}
            {showXpGain && (
              <div className="xp-gain-popup">+50 XP</div>
            )}
            
            {/* FSN Pulse Ring */}
            <div className="fsn-pulse-ring">
              <div className="pulse-ring-outer"></div>
              <div className="pulse-ring-middle"></div>
              <div className="pulse-ring-inner">
                <div className="fsn-center-text">
                  <span className="fsn-dot">•</span>
                  <span className="fsn-text">fsn</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Rank Display */}
          <div className="rank-display">
            <div className="rank-shield">🛡️</div>
            <div className="rank-name">Sentinel</div>
            <div className="rank-status">Initial Pulse</div>
          </div>
        </div>

        {/* Right Column - Controls and Info */}
        <div className="right-column">
          {/* Upload Button */}
          <div className="upload-section">
            <input
              type="file"
              id="file-upload-p6"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <button
              className="upload-button"
              onClick={() => document.getElementById('file-upload-p6')?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>

          {/* My Vault Files */}
          <div className="vault-files-section">
            <div className="files-header">
              <span className="folder-icon">📁</span>
              <span className="files-title">My Vault Files</span>
            </div>
            <div className="files-list">
              <div className="file-item">
                <span className="file-icon">📄</span>
                <div className="file-details">
                  <div className="file-name">report.pdf</div>
                  <div className="file-date">4/24/2024</div>
                </div>
              </div>
              <div className="file-item">
                <span className="file-icon">🖼️</span>
                <div className="file-details">
                  <div className="file-name">photo.png</div>
                  <div className="file-date">4/24/2024</div>
                </div>
              </div>
            </div>
          </div>

          {/* XP Progress */}
          <div className="xp-section">
            <div className="xp-header">
              <span className="play-icon">▶</span>
              <span className="xp-rank">Sentinel</span>
            </div>
            <div className="xp-bar">
              <div className="xp-fill" style={{ width: '96%' }}></div>
            </div>
            <div className="xp-numbers">960 / 1000 XP</div>
          </div>

          {/* Debug Panel */}
          <div className="debug-inline">
            <span className="debug-title">Debug Panel</span>
            <div className="debug-buttons">
              <button className="debug-btn" onClick={handleAddXP}>+10 XP</button>
              <button className="debug-btn" onClick={() => setShowXpGain(true)}>Sim Upload</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Picture6FullScreen;