// Task Trigger Utilities for FSN Pulse Task System
// These functions help automatically complete tasks when users perform specific actions

export const triggerTaskCompletion = async (taskId, hzReward = 3) => {
  try {
    // Call the API to actually award XP and Hz
    const response = await fetch('/api/pulse/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, hzReward })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`Task completed: ${taskId}`, result);
      
      // Use localStorage to communicate task completion across components
      localStorage.setItem('fsn_task_completed', taskId);
      
      // Trigger a storage event for components listening for task completions
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'fsn_task_completed',
        newValue: taskId,
        url: window.location.href
      }));
      
      return result;
    } else {
      const error = await response.json();
      console.log('Task completion response:', error.error);
      // Don't throw error for "already completed" tasks
      if (error.error === "Task already completed") {
        console.log(`Task ${taskId} was already completed`);
        return null;
      }
    }
  } catch (error) {
    console.error('Error triggering task completion:', error);
  }
};

// Specific task completion triggers with proper Hz rewards
export const taskTriggers = {
  // File upload task
  uploadFile: () => triggerTaskCompletion('upload_file', 5),
  
  // Signal broadcast task
  sendSignal: () => triggerTaskCompletion('send_signal', 4),
  
  // Profile update task
  updateProfile: () => triggerTaskCompletion('update_profile', 6),
  
  // Social page visit task
  visitSocial: () => triggerTaskCompletion('visit_social', 3),
  
  // Weekly task tracking
  trackWeeklyProgress: (taskId, progress) => {
    try {
      const weeklyProgress = JSON.parse(localStorage.getItem('fsn_weekly_progress') || '{}');
      weeklyProgress[taskId] = (weeklyProgress[taskId] || 0) + progress;
      localStorage.setItem('fsn_weekly_progress', JSON.stringify(weeklyProgress));
      
      // Check if weekly task thresholds are met
      checkWeeklyTaskCompletion(taskId, weeklyProgress[taskId]);
    } catch (error) {
      console.error('Error tracking weekly progress:', error);
    }
  }
};

// Check if weekly tasks should be completed based on progress
const checkWeeklyTaskCompletion = (taskId, currentProgress) => {
  const thresholds = {
    'earn_500_xp': 500,
    'complete_5_daily': 5,
    'signal_master': 10,
    'vault_collector': 3
  };
  
  if (thresholds[taskId] && currentProgress >= thresholds[taskId]) {
    triggerTaskCompletion(taskId);
  }
};

// Auto-track XP gains for weekly task
export const trackXPGain = (amount) => {
  taskTriggers.trackWeeklyProgress('earn_500_xp', amount);
};

// Auto-track daily task completions for weekly task
export const trackDailyTaskCompletion = () => {
  taskTriggers.trackWeeklyProgress('complete_5_daily', 1);
};

// Auto-track signal broadcasts for weekly task
export const trackSignalBroadcast = () => {
  taskTriggers.sendSignal(); // Complete daily task
  taskTriggers.trackWeeklyProgress('signal_master', 1); // Track for weekly
};

// Auto-track vault uploads for weekly task
export const trackVaultUpload = () => {
  taskTriggers.trackWeeklyProgress('vault_collector', 1);
};

// Mission completion tracking for XP context integration
export const trackMissionCompletion = (taskId) => {
  // This will be called by XP context when missions are completed
  const missionTasks = JSON.parse(localStorage.getItem('missionTasks') || '{}');
  if (!missionTasks[taskId]) {
    triggerTaskCompletion(`mission_${taskId}`);
  }
};

// Auto-track file uploads for weekly task
export const trackFileUpload = () => {
  taskTriggers.uploadFile(); // Complete daily task
  taskTriggers.trackWeeklyProgress('vault_collector', 1); // Track for weekly
};

// Reset weekly progress at the start of each week
export const resetWeeklyProgress = () => {
  try {
    localStorage.removeItem('fsn_weekly_progress');
    console.log('Weekly progress reset');
  } catch (error) {
    console.error('Error resetting weekly progress:', error);
  }
};

// Get current weekly progress
export const getWeeklyProgress = () => {
  try {
    return JSON.parse(localStorage.getItem('fsn_weekly_progress') || '{}');
  } catch (error) {
    console.error('Error getting weekly progress:', error);
    return {};
  }
};