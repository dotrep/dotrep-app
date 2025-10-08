import React from 'react';
import '../styles/fsn.css';

interface VaultFile {
  itemId: string;
  createdAt: string;
  data?: {
    filename?: string;
    originalName?: string;
    content?: string;
  };
}

interface VaultFileListProps {
  files?: VaultFile[];
}

const VaultFileList: React.FC<VaultFileListProps> = ({ files = [] }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const getFileIcon = (filename?: string) => {
    if (!filename) return '📄';
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return '🖼️';
      case 'txt':
        return '📝';
      case 'doc':
      case 'docx':
        return '📋';
      default:
        return '📄';
    }
  };

  return (
    <div className="vault-file-list">
      <div className="file-list-header">
        <span className="folder-icon">📁</span>
        <span className="header-text">My Vault Files</span>
      </div>
      
      <div className="file-list-content">
        {files.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <div className="empty-text">No files uploaded yet</div>
            <div className="empty-subtext">Upload your first file to get started</div>
          </div>
        ) : (
          <div className="file-items">
            {files.map((file, index) => (
              <div key={file.itemId || index} className="file-item">
                <div className="file-icon">
                  {getFileIcon(file.data?.filename || file.data?.originalName)}
                </div>
                <div className="file-details">
                  <div className="file-name">
                    {file.data?.filename || file.data?.originalName || 'Untitled'}
                  </div>
                  <div className="file-date">
                    {formatDate(file.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VaultFileList;