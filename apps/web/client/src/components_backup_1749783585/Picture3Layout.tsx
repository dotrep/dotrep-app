import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { computePulseLevel, getPulseLabel, isPulseActive } from '@/lib/xpEngine';
import '../styles/picture3-layout.css';

interface Picture3LayoutProps {
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
}

interface FileData {
  filename: string;
  content: string;
  mimeType?: string;
}

const Picture3Layout: React.FC<Picture3LayoutProps> = ({ userId, fsnName }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
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
  const pulseLevel = computePulseLevel(totalXP);
  const pulseActive = isPulseActive(totalXP);

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

  return (
    <div className="picture3-container">
      {/* Top Navigation */}
      <div className="picture3-nav">
        <div className="nav-item active">
          <span className="nav-icon">🏠</span>
          <span>Home</span>
        </div>
        <div className="nav-item">
          <span className="nav-icon">💬</span>
          <span>Messages</span>
        </div>
        <div className="nav-item">
          <span className="nav-icon">🗨️</span>
          <span>Chat</span>
        </div>
        <div className="nav-item">
          <span className="nav-icon">👤</span>
          <span>Profile</span>
        </div>
      </div>

      {/* Large Centered FSN PULSE Ring */}
      <div className="pulse-center-section">
        <div className="large-pulse-container">
          <div className="pulse-rings">
            <div className={`pulse-ring outer ${pulseActive ? 'active' : ''}`}></div>
            <div className={`pulse-ring middle ${pulseActive ? 'active' : ''}`}></div>
            <div className={`pulse-ring inner ${pulseActive ? 'active' : ''}`}></div>
          </div>
          
          <div className="pulse-content">
            <div className="pulse-level">LEVEL 1:</div>
            <div className="pulse-status">INITIAL PULSE</div>
            <div className="pulse-brand">FSN PULSE</div>
          </div>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="progress-tracker">
        <div className="tracker-step active">
          <div className="tracker-dot active">●</div>
          <span>Initial Pulse</span>
        </div>
        <div className="tracker-step">
          <div className="tracker-dot">○</div>
        </div>
        <div className="tracker-step">
          <div className="tracker-dot">○</div>
        </div>
        <div className="tracker-step final">
          <div className="tracker-dot">○</div>
          <span>Signal</span>
        </div>
      </div>

      {/* Your Stored Files Section */}
      <div className="stored-files-section">
        <h2 className="files-title">Your Stored Files</h2>
        
        <div className="files-grid">
          {vaultItems.map((item) => (
            <div key={item.itemId} className="file-card">
              <div className="file-icon">🔒</div>
              <div className="file-xp">+10 XP</div>
              <div className="file-date">Expired {new Date(item.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
          
          {/* Add empty slots if needed */}
          {vaultItems.length < 2 && (
            <div className="file-card empty">
              <div className="file-icon">🔒</div>
              <div className="file-xp">+10 XP</div>
              <div className="file-date">Expired 6/9/2025</div>
            </div>
          )}
        </div>
      </div>

      {/* Upload File Button */}
      <div className="upload-section">
        <input
          type="file"
          id="file-upload-picture3"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
          disabled={uploading}
        />
        <button
          className="upload-file-btn"
          onClick={() => document.getElementById('file-upload-picture3')?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
        
        {uploadError && (
          <div className="upload-error">{uploadError}</div>
        )}
      </div>
    </div>
  );
};

export default Picture3Layout;