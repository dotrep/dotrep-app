import React from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import './NextPulseTask.css';

// Pulse task data structure
const PULSE_TASKS = [
  { id: "upload_file", label: "Upload your first Vault file", hz: 5, icon: "📤" },
  { id: "join_discord", label: "Join the FSN Discord", hz: 7, icon: "💬" },
  { id: "play_mini_game", label: "Play a mini mission", hz: 5, icon: "🎮" },
  { id: "mint_nft", label: "Mint your first Vault NFT", hz: 5, icon: "🖼️" },
  { id: "enable_secure_mode", label: "Activate Vault Security Mode", hz: 7, icon: "🔒" },
  { id: "follow_user", label: "Follow a user", hz: 3, icon: "👥" },
  { id: "tune_signal", label: "Tune Signal to optimal frequency", hz: 4, icon: "📡" },
  { id: "complete_profile", label: "Complete your profile setup", hz: 6, icon: "👤" },
  { id: "send_message", label: "Send your first FSN message", hz: 4, icon: "📨" },
  { id: "backup_vault", label: "Create Vault backup", hz: 8, icon: "💾" }
];

const NextPulseTask = ({ completedTasks = [], currentPulse = 30, onFileUpload, fileInputRef, isUploading, ...props }) => {
  const { toast } = useToast();
  
  console.log('NextPulseTask rendered with:', { completedTasks, currentPulse });
  
  // Find the first task that hasn't been completed
  const nextTask = PULSE_TASKS.find(task => !completedTasks.includes(task.id));
  console.log('Next task found:', nextTask);

  const handleTaskClick = async () => {
    if (!nextTask) return;

    // Handle different task types with actual functionality
    switch (nextTask.id) {
      case 'upload_file':
        // Trigger file upload
        if (props.fileInputRef && props.fileInputRef.current) {
          props.fileInputRef.current.click();
        }
        return;
        
      case 'complete_profile':
        // Award points first, then navigate
        try {
          await fetch('/api/pulse/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId: 'complete_profile', hzReward: 6 })
          });
          toast({
            title: "Profile Task Started!",
            description: "Update your avatar or bio. +6Hz earned!",
            variant: "default",
          });
        } catch (error) {
          console.log('Task already completed or error:', error);
        }
        setTimeout(() => {
          window.location.href = '/social';
        }, 1000);
        return;
        
      case 'access_vault':
        // Award points first, then navigate  
        try {
          await fetch('/api/pulse/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId: 'access_vault', hzReward: 4 })
          });
          toast({
            title: "Vault Access!",
            description: "Opening your secure vault. +4Hz earned!",
            variant: "default",
          });
        } catch (error) {
          console.log('Task already completed or error:', error);
        }
        setTimeout(() => {
          window.location.href = '/vault';
        }, 800);
        return;
        
      case 'daily_login':
        // This should complete automatically since user is already logged in
        break;
        
      default:
        // For other tasks, complete them directly
        break;
    }

    try {
      console.log('Attempting to complete task:', nextTask);
      
      // Complete the pulse task using fetch directly
      const response = await fetch('/api/pulse/complete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          taskId: nextTask.id, 
          hzReward: nextTask.hz 
        })
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (response.ok && responseData.success) {
        toast({
          title: "Pulse Boosted!",
          description: `+${nextTask.hz}Hz from "${nextTask.label}"`,
          variant: "default",
        });
        
        // Refresh the page to show updated stats
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error(responseData.error || 'Failed to complete task');
      }
    } catch (error) {
      console.error('Error completing pulse task:', error);
      toast({
        title: "Task Error",
        description: error.message || "Failed to complete pulse task. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // If all tasks are completed, show a completion message
  if (!nextTask) {
    return (
      <div className="next-pulse-task completed">
        <div className="pulse-task-content">
          <span className="pulse-task-icon">✨</span>
          <span className="pulse-task-text">All Pulse tasks completed!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="next-pulse-task clickable" onClick={handleTaskClick}>
      <div className="pulse-task-content">
        <div className="pulse-task-left">
          <span className="pulse-task-icon">{nextTask.icon}</span>
          <span className="pulse-hz-reward">+{nextTask.hz}Hz:</span>
        </div>
        <span className="pulse-task-label">{nextTask.label}</span>
      </div>
      <div className="pulse-task-glow-bar"></div>
      <div className="pulse-task-click-hint">
        {nextTask.id === 'upload_file' ? 'Click to upload' : 
         nextTask.id === 'complete_profile' ? 'Click to update' :
         nextTask.id === 'access_vault' ? 'Click to access' :
         'Click to complete'}
        {isUploading && nextTask.id === 'upload_file' && ' (Uploading...)'}
      </div>
    </div>
  );
};

export default NextPulseTask;