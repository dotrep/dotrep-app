import React, { useState, useEffect } from 'react';
import { X, Check, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOnboardingProgress } from '../utils/onboardingDetection';

const OnboardingOverlay = ({ 
  user, 
  onComplete, 
  onSkip,
  onTaskAction 
}) => {
  const [tasks, setTasks] = useState({
    claimFsn: false,
    recastBeacon: false,
    uploadVault: false,
    updateProfile: false
  });
  const [isCompleting, setIsCompleting] = useState(false);
  const { toast } = useToast();

  // Load existing progress from user profile and detect completed tasks
  useEffect(() => {
    if (user?.onboardingTasks) {
      setTasks({
        claimFsn: user.onboardingTasks.fsn_claimed || false,
        recastBeacon: user.onboardingTasks.beacon_recast || false,
        uploadVault: user.onboardingTasks.vault_uploaded || false,
        updateProfile: user.onboardingTasks.profile_updated || false
      });
    } else {
      // Initialize all tasks as false if no data available
      setTasks({
        claimFsn: false,
        recastBeacon: false,
        uploadVault: false,
        updateProfile: false
      });
    }
    
    // Skip auto-detection for now to ensure all tasks are clickable
    console.log('🎯 Onboarding tasks loaded:', user?.onboardingTasks);
  }, [user]);

  // Listen for custom completion events from other components
  useEffect(() => {
    const handleTaskCompletion = (event) => {
      const { taskType } = event.detail;
      console.log('🎉 Task completion event received:', taskType);
      
      // Update local state immediately
      setTasks(prev => {
        const updated = { ...prev };
        
        switch (taskType) {
          case 'fsn-claim':
            updated.claimFsn = true;
            break;
          case 'beacon-recast':
            updated.recastBeacon = true;
            break;
          case 'vault-upload':
            updated.uploadVault = true;
            break;
          case 'profile-update':
            updated.updateProfile = true;
            break;
        }
        
        return updated;
      });
    };

    // Listen for custom task completion events
    window.addEventListener('onboarding-task-complete', handleTaskCompletion);

    return () => {
      window.removeEventListener('onboarding-task-complete', handleTaskCompletion);
    };
  }, []);

  // Calculate progress
  const completedTasks = Object.values(tasks).filter(Boolean).length;
  const totalTasks = 4;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);

  // Check if all tasks completed
  useEffect(() => {
    if (completedTasks === totalTasks && !isCompleting) {
      handleCompletion();
    }
  }, [completedTasks, totalTasks, isCompleting]);

  const handleCompletion = async () => {
    setIsCompleting(true);
    
    try {
      // Award XP bonus and mark as onboarded
      const response = await fetch('/api/user/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Onboarding Complete! 🎉",
          description: `You earned ${data.xpAwarded} XP bonus!`,
          className: "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-emerald-400"
        });
        
        // Wait for animation then complete
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const updateTaskProgress = async (taskKey, completed) => {
    const newTasks = { ...tasks, [taskKey]: completed };
    setTasks(newTasks);

    // Update server
    try {
      await fetch('/api/user/update-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tasks: newTasks })
      });
    } catch (error) {
      console.error('Error updating onboarding progress:', error);
    }
  };

  const taskItems = [
    {
      key: 'claimFsn',
      title: 'Claim your .fsn name',
      description: 'Secure your unique FSN identity',
      completed: tasks.claimFsn,
      action: () => onTaskAction('fsn-claim')
    },
    {
      key: 'recastBeacon',
      title: 'Recast your Beacon',
      description: 'Broadcast your first signal',
      completed: tasks.recastBeacon,
      action: () => onTaskAction('beacon-recast')
    },
    {
      key: 'uploadVault',
      title: 'Upload your first Vault file',
      description: 'Secure your digital assets',
      completed: tasks.uploadVault,
      action: () => onTaskAction('vault-upload')
    },
    {
      key: 'updateProfile',
      title: 'Update your profile',
      description: 'Complete your identity',
      completed: tasks.updateProfile,
      action: () => onTaskAction('profile-update')
    }
  ];

  // Show completion state
  if (completedTasks === totalTasks) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          padding: '48px',
          borderRadius: '16px',
          border: '2px solid #00ff88',
          boxShadow: '0 0 32px rgba(0, 255, 136, 0.3)',
          textAlign: 'center',
          maxWidth: '400px',
          animation: 'pulse 2s infinite'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '24px'
          }}>🎉</div>
          
          <h2 style={{
            fontSize: '28px',
            color: '#00ff88',
            fontFamily: 'Orbitron, sans-serif',
            fontWeight: 'bold',
            marginBottom: '16px',
            textShadow: '0 0 8px rgba(0, 255, 136, 0.6)'
          }}>
            You're Done!
          </h2>
          
          <p style={{
            fontSize: '18px',
            color: '#cccccc',
            marginBottom: '8px'
          }}>
            Onboarding Complete
          </p>
          
          <p style={{
            fontSize: '24px',
            color: '#00bcd4',
            fontWeight: 'bold',
            textShadow: '0 0 8px rgba(0, 188, 212, 0.6)'
          }}>
            +100 XP 🎉
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        padding: '32px',
        borderRadius: '16px',
        border: '2px solid #00bcd4',
        boxShadow: '0 0 24px rgba(0, 188, 212, 0.3)',
        maxWidth: '500px',
        width: '90%',
        position: 'relative'
      }}>
        {/* Close/Dismiss Button */}
        <button
          onClick={onSkip}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#666666',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '8px 12px',
            borderRadius: '6px',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.background = '#333333';
            e.target.style.color = '#ffffff';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'none';
            e.target.style.color = '#666666';
          }}
        >
          Close
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '32px',
            color: '#00bcd4',
            fontFamily: 'Orbitron, sans-serif',
            fontWeight: 'bold',
            marginBottom: '8px',
            textShadow: '0 0 8px rgba(0, 188, 212, 0.6)'
          }}>
            Welcome to FreeSpace Network 🚀
          </h1>
          
          <p style={{
            fontSize: '16px',
            color: '#cccccc',
            marginBottom: '24px'
          }}>
            Complete these essential steps to get started
          </p>

          {/* Progress Bar */}
          <div style={{
            background: '#333333',
            height: '8px',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            <div style={{
              background: 'linear-gradient(90deg, #00bcd4 0%, #00ff88 100%)',
              height: '100%',
              width: `${progressPercent}%`,
              transition: 'width 0.5s ease',
              borderRadius: '4px'
            }} />
          </div>
          
          <p style={{
            fontSize: '14px',
            color: '#00bcd4',
            fontWeight: 'bold'
          }}>
            {completedTasks}/{totalTasks} completed ({progressPercent}%)
          </p>
        </div>

        {/* Task List */}
        <div style={{ marginBottom: '24px' }}>
          {taskItems.map((task) => (
            <div
              key={task.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px',
                marginBottom: '12px',
                background: task.completed ? 
                  'rgba(0, 255, 136, 0.1)' : 
                  'rgba(51, 51, 51, 0.5)',
                border: task.completed ? 
                  '1px solid #00ff88' : 
                  '1px solid #333333',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={task.action}
              onMouseOver={(e) => {
                if (!task.completed) {
                  e.currentTarget.style.background = 'rgba(0, 188, 212, 0.1)';
                  e.currentTarget.style.borderColor = '#00bcd4';
                }
              }}
              onMouseOut={(e) => {
                if (!task.completed) {
                  e.currentTarget.style.background = 'rgba(51, 51, 51, 0.5)';
                  e.currentTarget.style.borderColor = '#333333';
                }
              }}
            >
              {/* Completion Icon */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: task.completed ? '#00ff88' : '#333333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '16px',
                flexShrink: 0
              }}>
                {task.completed ? (
                  <Check size={16} color="#000000" />
                ) : (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#666666'
                  }} />
                )}
              </div>

              {/* Task Content */}
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: '16px',
                  color: task.completed ? '#00ff88' : '#ffffff',
                  fontFamily: 'Orbitron, sans-serif',
                  fontWeight: 'bold',
                  marginBottom: '4px'
                }}>
                  {task.title}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#cccccc',
                  margin: 0
                }}>
                  {task.description}
                </p>
              </div>

              {/* Arrow Icon - Always show to indicate clickability */}
              <ChevronRight 
                size={20} 
                color={task.completed ? "#00ff88" : "#666666"}
                style={{ marginLeft: '12px' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingOverlay;