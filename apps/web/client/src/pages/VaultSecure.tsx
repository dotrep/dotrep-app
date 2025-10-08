// Secure Vault page with encryption and IPFS storage
import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import VaultUpload from '../components/VaultUpload';
import VaultFileList from '../components/VaultFileList';
import { WalletConnect } from '../components/WalletConnect';

export default function VaultSecure() {
  const { isConnected } = useAccount();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadComplete = (result: any) => {
    console.log('Upload completed:', result);
    // Trigger file list refresh
    setRefreshTrigger(prev => prev + 1);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
  };

  return (
    <div className="vault-secure">
      <div className="vault-header">
        <h1>Secure Vault</h1>
        <p>Encrypted file storage with IPFS and blockchain verification</p>
        
        {!isConnected && (
          <div className="wallet-connect-section">
            <WalletConnect />
          </div>
        )}
      </div>

      <div className="vault-content">
        {/* Upload Section */}
        <section className="upload-section">
          <h2>Upload Files</h2>
          <VaultUpload 
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
          />
        </section>

        {/* Files List Section */}
        <section className="files-section">
          <VaultFileList refreshTrigger={refreshTrigger} />
        </section>

        {/* Security Information */}
        <section className="security-info">
          <h3>Security Features</h3>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <div>
                <strong>Client-Side Encryption</strong>
                <p>Files are encrypted on your device before upload. We never see your data.</p>
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">☁️</div>
              <div>
                <strong>IPFS Storage</strong>
                <p>Decentralized storage ensures your files are always accessible.</p>
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔗</div>
              <div>
                <strong>Blockchain Anchoring</strong>
                <p>File hashes are recorded on-chain for immutable proof of existence.</p>
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔑</div>
              <div>
                <strong>Local Key Storage</strong>
                <p>Encryption keys stay on your device. Only you can decrypt your files.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .vault-secure {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a1929 0%, #1e293b 100%);
          padding: 40px 20px;
        }

        .vault-header {
          text-align: center;
          margin-bottom: 60px;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }

        .vault-header h1 {
          color: #00f0ff;
          font-size: 48px;
          font-weight: bold;
          margin-bottom: 16px;
          text-shadow: 0 0 20px rgba(0, 240, 255, 0.5);
        }

        .vault-header p {
          color: #66fcf1;
          font-size: 18px;
          margin-bottom: 32px;
        }

        .wallet-connect-section {
          margin-top: 32px;
          display: flex;
          justify-content: center;
        }

        .vault-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 60px;
        }

        .upload-section {
          text-align: center;
        }

        .upload-section h2 {
          color: #00f0ff;
          font-size: 32px;
          margin-bottom: 32px;
          text-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
        }

        .files-section {
          width: 100%;
        }

        .security-info {
          text-align: center;
        }

        .security-info h3 {
          color: #00f0ff;
          font-size: 28px;
          margin-bottom: 32px;
          text-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .feature-card {
          background: rgba(10, 25, 41, 0.8);
          border: 1px solid rgba(0, 240, 255, 0.3);
          border-radius: 16px;
          padding: 24px;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          text-align: left;
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .feature-card:hover {
          border-color: #00f0ff;
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(0, 240, 255, 0.2);
        }

        .feature-icon {
          font-size: 32px;
          flex-shrink: 0;
          margin-top: 4px;
        }

        .feature-card strong {
          color: #00f0ff;
          font-size: 16px;
          display: block;
          margin-bottom: 8px;
        }

        .feature-card p {
          color: #66fcf1;
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
        }

        @media (max-width: 768px) {
          .vault-secure {
            padding: 20px 16px;
          }

          .vault-header h1 {
            font-size: 36px;
          }

          .vault-header p {
            font-size: 16px;
          }

          .upload-section h2,
          .security-info h3 {
            font-size: 24px;
          }

          .vault-content {
            gap: 40px;
          }

          .feature-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .feature-card {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}