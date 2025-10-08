import React, { useState, useEffect } from 'react';
import fsnLogoImage from "@assets/ChatGPT Image Jun 12, 2025, 11_46_43 PM_1749787174472.png";
import SharedNetworkAnimation from '@/components/SharedNetworkAnimation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

interface VaultItem {
  id: number;
  filename: string;
  type: string;
  size: number;
  uploadDate: string;
  description?: string;
  isEncrypted: boolean;
  sharedWith?: string[];
}

export default function Vault() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isTextPulsing, setIsTextPulsing] = useState(false);
  const [isIconsPulsing, setIsIconsPulsing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const triggerPulse = () => {
    if (isPulsing) return;
    
    setIsPulsing(true);
    
    // Trigger text pulse after 1000ms delay (signal propagation effect)
    setTimeout(() => {
      setIsTextPulsing(true);
    }, 1000);
    
    // Trigger icons pulse after 1500ms delay (continuing the wave)
    setTimeout(() => {
      setIsIconsPulsing(true);
    }, 1500);
    
    setTimeout(() => {
      setIsPulsing(false);
    }, 2400);
    
    // End text pulse after 3000ms duration for slower wave effect
    setTimeout(() => {
      setIsTextPulsing(false);
    }, 3000);
    
    // End icons pulse after 3500ms (500ms after text ends)
    setTimeout(() => {
      setIsIconsPulsing(false);
    }, 3500);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      triggerPulse();
    }, 5000);

    return () => clearInterval(interval);
  }, [isPulsing]);

  const { data: vaultItems = [] } = useQuery<VaultItem[]>({
    queryKey: ['/api/vault/items'],
  });

  const { data: stats } = useQuery<{ usedSpace: number; totalSpace: number }>({
    queryKey: ['/api/vault/stats'],
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/vault/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vault/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vault/stats'] });
      setSelectedFile(null);
      setIsUploading(false);
      toast({
        title: "File uploaded",
        description: "Your file has been securely stored in the vault.",
      });
    },
    onError: (error) => {
      setIsUploading(false);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', '');
    formData.append('type', 'general');
    uploadMutation.mutate(formData);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const usedSpace = stats?.usedSpace || 0;
  const usedGB = (usedSpace / (1024 * 1024 * 1024)).toFixed(1);

  return (
    <>
      <SharedNetworkAnimation />
      <section style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        position: 'relative',
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
        overflow: 'hidden',
        padding: '10px 20px',
        zIndex: 1
      }}>
      
      {/* Logout Button - Bottom Right */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 20
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ 
            cursor: 'pointer',
            padding: '8px',
            transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
            borderRadius: '6px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0,96,100,0.08)';
            e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
            const svg = e.currentTarget.querySelector('svg');
            if (svg) {
              svg.style.filter = 'drop-shadow(0 0 3px rgba(0,96,100,0.4)) drop-shadow(0 0 6px rgba(0,96,100,0.2))';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            const svg = e.currentTarget.querySelector('svg');
            if (svg) {
              svg.style.filter = 'drop-shadow(0 0 1px rgba(0,96,100,0.3))';
            }
          }}>
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              style={{
                filter: 'drop-shadow(0 0 1px rgba(0,96,100,0.3))'
              }}
            >
              <defs>
                <filter id="logout-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <g filter="url(#logout-glow)">
                {/* Outer bracket - left side */}
                <path 
                  d="M3 6 Q3 4 5 4 L12 4" 
                  stroke="#006064" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  fill="none"
                />
                <path 
                  d="M3 18 Q3 20 5 20 L12 20" 
                  stroke="#006064" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  fill="none"
                />
                <line 
                  x1="3" y1="6" x2="3" y2="18" 
                  stroke="#006064" 
                  strokeWidth="2" 
                  strokeLinecap="round"
                />
                
                {/* Exit arrow */}
                <line 
                  x1="9" y1="12" x2="19" y2="12" 
                  stroke="#006064" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                />
                <polyline 
                  points="15,8 19,12 15,16" 
                  stroke="#006064" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  fill="none"
                />
              </g>
            </svg>
          </div>
        </Link>
      </div>

      {/* Navigation Header */}
      <nav style={{
        display: 'flex',
        gap: '50px',
        marginBottom: '20px',
        fontSize: '16px',
        fontWeight: '500',
        letterSpacing: '0.5px',
        justifyContent: 'center'
      }}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>HOME</div>
        </Link>
        <div style={{ 
          color: '#00bcd4', 
          borderBottom: '2px solid #00bcd4',
          paddingBottom: '4px'
        }}>VAULT</div>
        <Link href="/social" style={{ textDecoration: 'none' }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>SOCIAL</div>
        </Link>
        <Link href="/game-center" style={{ textDecoration: 'none' }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>GAME CENTER</div>
        </Link>
      </nav>

      {/* Main Circle Container */}
      <div 
        style={{
          position: 'relative',
          width: '320px',
          height: '320px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          borderRadius: '50%',
          zIndex: 10,
          margin: '0 auto 10px',
          flexShrink: 0
        }}
        onClick={triggerPulse}
      >
        
        {/* Outermost Ring */}
        <div style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          border: '1px solid rgba(0, 188, 212, 0.3)',
          opacity: isPulsing ? 0.05 : 0.6,
          transform: isPulsing ? 'scale3d(1.28, 1.28, 1)' : 'scale3d(1, 1, 1)',
          transition: 'all 2.2s cubic-bezier(0.25, 0.1, 0.25, 1)',
          transitionDelay: '0.6s',
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d'
        }} />
        
        {/* Middle Ring */}
        <div style={{
          position: 'absolute',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          border: '1px solid rgba(0, 188, 212, 0.5)',
          opacity: isPulsing ? 0.1 : 0.8,
          transform: isPulsing ? 'scale3d(1.18, 1.18, 1)' : 'scale3d(1, 1, 1)',
          transition: 'all 2.0s cubic-bezier(0.25, 0.1, 0.25, 1)',
          transitionDelay: '0.3s',
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d'
        }} />
        
        {/* Inner Ring */}
        <div style={{
          position: 'absolute',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          border: '2px solid rgba(0, 188, 212, 0.7)',
          opacity: isPulsing ? 0.2 : 1,
          transform: isPulsing ? 'scale3d(1.08, 1.08, 1)' : 'scale3d(1, 1, 1)',
          transition: 'all 1.8s cubic-bezier(0.25, 0.1, 0.25, 1)',
          transitionDelay: '0s',
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d'
        }} />

        {/* FSN Logo */}
        <div style={{
          position: 'relative',
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '90px',
          height: '90px'
        }}>
          <img 
            src={fsnLogoImage}
            alt="FSN Logo"
            style={{
              width: '90px',
              height: '90px',
              minWidth: '90px',
              maxWidth: '90px',
              minHeight: '90px',
              maxHeight: '90px',
              filter: `
                drop-shadow(0 0 ${isPulsing ? 45 : 12}px rgba(0, 150, 168, ${isPulsing ? 1.0 : 0.4}))
                drop-shadow(0 0 ${isPulsing ? 65 : 20}px rgba(0, 188, 212, ${isPulsing ? 0.8 : 0.3}))
                drop-shadow(0 0 ${isPulsing ? 90 : 28}px rgba(64, 164, 188, ${isPulsing ? 0.7 : 0.2}))
                drop-shadow(0 0 ${isPulsing ? 120 : 0}px rgba(77, 208, 225, ${isPulsing ? 0.5 : 0}))
                brightness(${isPulsing ? 1.5 : 1.0})
                contrast(${isPulsing ? 1.4 : 1.0})
                saturate(${isPulsing ? 1.8 : 1.2})
                hue-rotate(${isPulsing ? 8 : 0}deg)
              `,
              transition: 'filter 1.5s cubic-bezier(0.25, 0.1, 0.25, 1)',
              objectFit: 'contain',
              background: 'transparent',
              position: 'relative',
              zIndex: 10,
              transform: 'none'
            }}
          />
        </div>
      </div>

      {/* Title Section */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        <h1 style={{
          fontSize: '20px',
          fontWeight: '300',
          color: '#fff',
          marginBottom: '8px',
          letterSpacing: '1px'
        }}>
          SECURE VAULT
        </h1>
        <div style={{
          fontSize: '14px',
          color: 'rgba(255,255,255,0.7)',
          letterSpacing: '0.5px'
        }}>
          Decentralized storage{' '}
          <span style={{
            color: isTextPulsing ? '#4dd0e1' : '#00bcd4',
            textShadow: isTextPulsing 
              ? `0 0 15px rgba(0, 188, 212, 0.8),
                 0 0 25px rgba(0, 188, 212, 0.5),
                 0 0 35px rgba(77, 208, 225, 0.3)`
              : `0 0 6px rgba(0, 188, 212, 0.3)`,
            filter: isTextPulsing
              ? `brightness(1.3) saturate(1.2)`
              : `brightness(1.0) saturate(1.0)`,
            transition: 'all 2.0s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isTextPulsing ? 'scale(1.05)' : 'scale(1.0)',
            display: 'inline-block',
            transformOrigin: 'center center'
          }}>
            YOU
          </span>
          {' '}control
        </div>
      </div>

      {/* Data Section */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: '600',
          color: '#fff',
          marginBottom: '20px',
          letterSpacing: '2px',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
          textTransform: 'uppercase'
        }}>
          Data
        </h2>
        
        {/* Data Categories Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '400px',
          marginBottom: '20px',
          textAlign: 'center',
          position: 'relative'
        }}>
          {/* Files */}
          <div style={{
            fontSize: '16px',
            color: '#00bcd4',
            fontWeight: '500',
            letterSpacing: '1px',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            textTransform: 'uppercase',
            textShadow: '0 0 8px rgba(0, 188, 212, 0.3)'
          }}>
            Files
          </div>

          {/* NFT */}
          <div style={{
            fontSize: '16px',
            color: '#00bcd4',
            fontWeight: '500',
            letterSpacing: '1px',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            textTransform: 'uppercase',
            textShadow: '0 0 8px rgba(0, 188, 212, 0.3)'
          }}>
            NFT
          </div>

          {/* Keys */}
          <div style={{
            fontSize: '16px',
            color: '#00bcd4',
            fontWeight: '500',
            letterSpacing: '1px',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            textTransform: 'uppercase',
            textShadow: '0 0 8px rgba(0, 188, 212, 0.3)'
          }}>
            Keys
          </div>
        </div>

        {/* Icons Row - Positioned between words */}
        <div style={{
          position: 'relative',
          width: '400px',
          height: '40px',
          marginBottom: '20px'
        }}>
          {/* Upload Icon - between Files and NFT */}
          <div style={{
            position: 'absolute',
            left: '25%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}>
            <svg 
              viewBox="0 0 24 24" 
              style={{ 
                width: isIconsPulsing ? '38px' : '32px', 
                height: isIconsPulsing ? '38px' : '32px', 
                stroke: isIconsPulsing ? '#4dd0e1' : '#00bcd4', 
                fill: 'none', 
                strokeWidth: 2, 
                cursor: 'pointer',
                filter: isIconsPulsing
                  ? `brightness(1.5) saturate(1.4) drop-shadow(0 0 20px rgba(0, 188, 212, 0.9)) drop-shadow(0 0 35px rgba(77, 208, 225, 0.4))`
                  : `brightness(1.0) saturate(1.0)`,
                transition: 'all 2.0s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <defs>
                <filter id="fsn-glow-upload" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <g filter="url(#fsn-glow-upload)">
                <line x1="12" y1="4" x2="12" y2="15" stroke="#00FFFF" strokeWidth="2.5" strokeLinecap="round" />
                <polyline points="8,8 12,4 16,8" stroke="#00FFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M5 19 L5 21 Q5 22 6 22 L18 22 Q19 22 19 21 L19 19" stroke="#00FFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </g>
            </svg>
          </div>

          {/* Download Icon - between NFT and Keys */}
          <div style={{
            position: 'absolute',
            left: '75%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}>
            <svg 
              viewBox="0 0 24 24" 
              style={{ 
                width: isIconsPulsing ? '38px' : '32px', 
                height: isIconsPulsing ? '38px' : '32px', 
                stroke: isIconsPulsing ? '#4dd0e1' : '#00bcd4', 
                fill: 'none', 
                strokeWidth: 2, 
                cursor: 'pointer',
                filter: isIconsPulsing
                  ? `brightness(1.5) saturate(1.4) drop-shadow(0 0 20px rgba(0, 188, 212, 0.9)) drop-shadow(0 0 35px rgba(77, 208, 225, 0.4))`
                  : `brightness(1.0) saturate(1.0)`,
                transition: 'all 2.0s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onClick={() => {
                if (Array.isArray(vaultItems) && vaultItems.length > 0) {
                  const latestItem = vaultItems[0];
                  window.open(`/api/vault/download/${latestItem.id}`, '_blank');
                }
              }}
            >
              <defs>
                <filter id="fsn-glow-download" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <g filter="url(#fsn-glow-download)">
                <line x1="12" y1="4" x2="12" y2="15" stroke="#00FFFF" strokeWidth="2.5" strokeLinecap="round" />
                <polyline points="8,12 12,16 16,12" stroke="#00FFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M5 19 L5 21 Q5 22 6 22 L18 22 Q19 22 19 21 L19 19" stroke="#00FFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        id="file-upload"
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
        disabled={isUploading}
      />
      
      </section>
    </>
  );
}