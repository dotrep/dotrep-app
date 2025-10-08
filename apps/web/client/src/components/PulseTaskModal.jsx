import React, { useState, useRef } from 'react';
import NextPulseTask from './NextPulseTask';
import PulseHistory from './PulseHistory';
import PulseTaskSystem from './PulseTaskSystem';
import XPRing from './XPRing';
import './PulseTaskModal.css';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { trackFileUpload } from '../utils/taskTriggers';
import { useXP } from '../context/XPContext';

const PulseTaskModal = ({ isOpen, onClose, completedTasks, currentPulse }) => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [isUploading, setIsUploading] = useState(false);
  const [fileUploadCompleted, setFileUploadCompleted] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();
  const { rewardUpload } = useXP();

  // Check if upload file task is already completed
  const isUploadTaskCompleted = completedTasks.includes('upload_file');

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('pulse-task-modal-overlay')) {
      onClose();
    }
  };

  // Enhanced file upload handler
  const handleFileUpload = async (file) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', 'Uploaded via Pulse Task');
      formData.append('type', 'general');

      const response = await fetch('/api/vault/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        // Trigger task completion for pulse task system
        trackFileUpload();
        
        // Award XP for file upload using Batch 5 reward system
        rewardUpload(file.name);

        setFileUploadCompleted(true);
        toast({
          title: "Added to your vault!",
          description: `${file.name} uploaded successfully. +5Hz earned!`,
          variant: "default",
        });

        // Refresh the page to show updated stats
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle drag and drop
  const handleDrop = (e) => {
    e.preventDefault();
    if (fileUploadCompleted || isUploadTaskCompleted) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="pulse-task-modal-overlay" onClick={handleOverlayClick}>
      <div className="pulse-task-modal">
        <div className="pulse-task-modal-header">
          <h2>PULSE COMMAND CENTER</h2>
          <button className="pulse-task-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="pulse-task-tabs">
          <button 
            className={`pulse-tab ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            TASKS
          </button>
          <button 
            className={`pulse-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            HISTORY
          </button>
        </div>
        
        <div className="pulse-task-modal-content">
          <div className="pulse-current-status">
            <div className="pulse-status-left">
              <div className="pulse-status-item">
                <span className="pulse-status-label">Current Pulse:</span>
                <span className="pulse-status-value">{currentPulse} Hz</span>
              </div>
              <div className="pulse-status-item">
                <span className="pulse-status-label">Status:</span>
                <span className={`pulse-status-value ${currentPulse > 50 ? 'strong' : 'building'}`}>
                  {currentPulse > 50 ? 'Strong Signal' : 'Building Power'}
                </span>
              </div>
            </div>
            <div className="pulse-status-right">
              <XPRing />
            </div>
          </div>

          {activeTab === 'tasks' && (
            <>
              {/* New Pulse Task System */}
              <PulseTaskSystem />
              
              {/* Legacy task section - keeping for backward compatibility */}
              <div className="pulse-task-section legacy-tasks" style={{ marginTop: '40px', opacity: '0.8' }}>
                <h3>Legacy Actions</h3>
                <NextPulseTask 
                  completedTasks={completedTasks}
                  currentPulse={currentPulse}
                  onFileUpload={handleFileUpload}
                  fileInputRef={fileInputRef}
                  isUploading={isUploading}
                />
              </div>

              <div className="pulse-task-tips">
                <h4>⚡ Quick Actions</h4>
                <div className="pulse-tips-grid">
                  <div 
                    className={`pulse-tip-action ${(fileUploadCompleted || isUploadTaskCompleted) ? 'completed' : ''} ${isUploading ? 'uploading' : ''}`}
                    onClick={() => !(fileUploadCompleted || isUploadTaskCompleted) && !isUploading && fileInputRef.current?.click()}
                    onDrop={!(fileUploadCompleted || isUploadTaskCompleted) && !isUploading ? handleDrop : undefined}
                    onDragOver={!(fileUploadCompleted || isUploadTaskCompleted) && !isUploading ? (e) => e.preventDefault() : undefined}
                    style={{ 
                      opacity: (fileUploadCompleted || isUploadTaskCompleted) ? 0.7 : 1, 
                      cursor: (fileUploadCompleted || isUploadTaskCompleted) ? 'not-allowed' : 'pointer' 
                    }}
                  >
                    <span className="tip-icon">
                      {(fileUploadCompleted || isUploadTaskCompleted) ? '✅' : isUploading ? '⏳' : '📤'}
                    </span>
                    <span className="tip-text">
                      {(fileUploadCompleted || isUploadTaskCompleted) ? 'File Uploaded' : isUploading ? 'Uploading...' : 'Upload File'}
                    </span>
                    <span className="tip-hz">
                      {(fileUploadCompleted || isUploadTaskCompleted) ? 'Complete!' : isUploading ? 'Processing...' : '+5Hz'}
                    </span>
                  </div>
                  <div className="pulse-tip-action" onClick={async () => {
                    try {
                      await apiRequest('/api/pulse/complete', {
                        method: 'POST',
                        body: { taskId: 'complete_profile', hzReward: 6 }
                      });
                      toast({
                        title: "Profile Task Started!",
                        description: "Update your avatar or bio on the Social page. +6Hz earned!",
                        variant: "default",
                      });
                      setTimeout(() => {
                        window.location.href = '/social';
                      }, 1000);
                    } catch (error) {
                      // Navigate anyway if task already completed
                      window.location.href = '/social';
                    }
                  }}>
                    <span className="tip-icon">👤</span>
                    <span className="tip-text">Update Avatar/Bio</span>
                    <span className="tip-hz">+6Hz</span>
                  </div>
                  <div className="pulse-tip-action" onClick={async () => {
                    try {
                      await apiRequest('/api/pulse/complete', {
                        method: 'POST',
                        body: { taskId: 'access_vault', hzReward: 4 }
                      });
                      toast({
                        title: "Vault Access!",
                        description: "Opening your secure vault. +4Hz earned!",
                        variant: "default",
                      });
                      setTimeout(() => {
                        window.location.href = '/vault';
                      }, 800);
                    } catch (error) {
                      // Navigate anyway if task already completed
                      window.location.href = '/vault';
                    }
                  }}>
                    <span className="tip-icon">🗄️</span>
                    <span className="tip-text">Access Vault</span>
                    <span className="tip-hz">+4Hz</span>
                  </div>
                  <div className="pulse-tip-action" onClick={async () => {
                    try {
                      // Create a sample message to core.fsn
                      const messageData = {
                        toUser: 'core.fsn',
                        message: 'Hello from FSN Pulse system! Testing message functionality.',
                        subject: 'Pulse System Test Message'
                      };

                      const response = await fetch('/api/messages/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(messageData)
                      });

                      if (response.ok) {
                        await apiRequest('/api/pulse/complete', {
                          method: 'POST',
                          body: { taskId: 'send_message', hzReward: 4 }
                        });
                        toast({
                          title: "Message Sent!",
                          description: "Test message sent to core.fsn. +4Hz earned!",
                          variant: "default",
                        });
                      } else {
                        throw new Error('Message sending failed');
                      }
                    } catch (error) {
                      console.error('Message error:', error);
                      toast({
                        title: "Message Failed",
                        description: "Unable to send message. Try again later.",
                        variant: "destructive",
                      });
                    }
                  }}>
                    <span className="tip-icon">💬</span>
                    <span className="tip-text">Send Message</span>
                    <span className="tip-hz">+4Hz</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'history' && (
            <PulseHistory />
          )}
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0] && !(fileUploadCompleted || isUploadTaskCompleted)) {
              handleFileUpload(e.target.files[0]);
            }
          }}
          accept="*/*"
        />
      </div>
    </div>
  );
};

export default PulseTaskModal;