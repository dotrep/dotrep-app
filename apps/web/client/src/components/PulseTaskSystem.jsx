import React, { useState, useEffect } from 'react';
import { useXP } from '../context/XPContext';
import { useToast } from '@/hooks/use-toast';
import './PulseTaskSystem.css';

const PulseTaskSystem = () => {
  const { addXP } = useXP();
  const { toast } = useToast();
  const [tasks, setTasks] = useState({ daily: [], weekly: [] });
  const [claimedTasks, setClaimedTasks] = useState(new Set());

  // Default task templates
  const defaultDailyTasks = [
    {
      task_id: "upload_file",
      title: "Upload a File to Your Vault",
      type: "daily",
      xp_reward: 50,
      completed: false,
      claimed: false
    },
    {
      task_id: "send_signal",
      title: "Broadcast a Signal",
      type: "daily", 
      xp_reward: 30,
      completed: false,
      claimed: false
    },
    {
      task_id: "update_profile",
      title: "Update Your Profile",
      type: "daily",
      xp_reward: 25,
      completed: false,
      claimed: false
    },
    {
      task_id: "visit_social",
      title: "Visit Social Page",
      type: "daily",
      xp_reward: 15,
      completed: false,
      claimed: false
    }
  ];

  const defaultWeeklyTasks = [
    {
      task_id: "earn_500_xp",
      title: "Earn 500 XP This Week",
      type: "weekly",
      xp_reward: 100,
      completed: false,
      claimed: false
    },
    {
      task_id: "complete_5_daily",
      title: "Complete 5 Daily Tasks",
      type: "weekly",
      xp_reward: 150,
      completed: false,
      claimed: false
    },
    {
      task_id: "signal_master",
      title: "Broadcast 10 Signals",
      type: "weekly",
      xp_reward: 200,
      completed: false,
      claimed: false
    },
    {
      task_id: "vault_collector",
      title: "Upload 3 Files to Vault",
      type: "weekly",
      xp_reward: 120,
      completed: false,
      claimed: false
    }
  ];

  // Initialize tasks on component mount
  useEffect(() => {
    initializeTasks();
    const interval = setInterval(checkForResets, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const initializeTasks = () => {
    const savedTasks = localStorage.getItem('fsn_pulse_tasks');
    const savedClaimed = localStorage.getItem('fsn_claimed_tasks');
    const lastReset = localStorage.getItem('fsn_last_task_reset');
    
    const now = new Date();
    const today = now.toDateString();
    const currentWeek = getWeekKey(now);

    if (!savedTasks || !lastReset || shouldReset(lastReset, now)) {
      // Initialize or reset tasks
      const newTasks = {
        daily: [...defaultDailyTasks],
        weekly: [...defaultWeeklyTasks]
      };
      
      setTasks(newTasks);
      setClaimedTasks(new Set());
      
      localStorage.setItem('fsn_pulse_tasks', JSON.stringify(newTasks));
      localStorage.setItem('fsn_claimed_tasks', JSON.stringify([]));
      localStorage.setItem('fsn_last_task_reset', JSON.stringify({ daily: today, weekly: currentWeek }));
    } else {
      // Load existing tasks
      const parsedTasks = JSON.parse(savedTasks);
      const parsedClaimed = savedClaimed ? new Set(JSON.parse(savedClaimed)) : new Set();
      
      setTasks(parsedTasks);
      setClaimedTasks(parsedClaimed);
    }
  };

  const shouldReset = (lastResetStr, now) => {
    const lastReset = JSON.parse(lastResetStr);
    const today = now.toDateString();
    const currentWeek = getWeekKey(now);
    
    return lastReset.daily !== today || lastReset.weekly !== currentWeek;
  };

  const getWeekKey = (date) => {
    const monday = new Date(date);
    monday.setDate(date.getDate() - (date.getDay() + 6) % 7);
    return monday.toDateString();
  };

  const checkForResets = () => {
    const now = new Date();
    const lastReset = localStorage.getItem('fsn_last_task_reset');
    
    if (lastReset && shouldReset(lastReset, now)) {
      initializeTasks();
    }
  };

  const handleClaimTask = async (taskId, xpReward) => {
    if (claimedTasks.has(taskId)) return;

    try {
      // Add XP with animation
      addXP(xpReward);
      
      // Update claimed tasks
      const newClaimedTasks = new Set([...claimedTasks, taskId]);
      setClaimedTasks(newClaimedTasks);
      
      // Update tasks state
      const updatedTasks = { ...tasks };
      ['daily', 'weekly'].forEach(type => {
        updatedTasks[type] = updatedTasks[type].map(task => 
          task.task_id === taskId ? { ...task, claimed: true } : task
        );
      });
      setTasks(updatedTasks);
      
      // Save to localStorage
      localStorage.setItem('fsn_pulse_tasks', JSON.stringify(updatedTasks));
      localStorage.setItem('fsn_claimed_tasks', JSON.stringify([...newClaimedTasks]));
      
      // Show success toast
      toast({
        title: "Task Completed!",
        description: `+${xpReward} XP earned!`,
        variant: "default",
      });

    } catch (error) {
      console.error('Error claiming task:', error);
      toast({
        title: "Error",
        description: "Failed to claim task rewards",
        variant: "destructive",
      });
    }
  };

  const markTaskCompleted = (taskId) => {
    const updatedTasks = { ...tasks };
    ['daily', 'weekly'].forEach(type => {
      updatedTasks[type] = updatedTasks[type].map(task => 
        task.task_id === taskId ? { ...task, completed: true } : task
      );
    });
    setTasks(updatedTasks);
    localStorage.setItem('fsn_pulse_tasks', JSON.stringify(updatedTasks));
  };

  // Auto-complete tasks based on user actions (this would be called from other components)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'fsn_task_completed') {
        const taskId = e.newValue;
        if (taskId) {
          markTaskCompleted(taskId);
          localStorage.removeItem('fsn_task_completed');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [tasks]);

  const renderTask = (task) => {
    const isCompleted = task.completed;
    const isClaimed = claimedTasks.has(task.task_id);
    
    return (
      <div key={task.task_id} className={`pulse-task-item ${isCompleted ? 'completed' : ''} ${isClaimed ? 'claimed' : ''}`}>
        <div className="pulse-task-icon">
          {isClaimed ? (
            <div className="claimed-checkmark">✅</div>
          ) : isCompleted ? (
            <div className="completed-checkmark">✓</div>
          ) : (
            <div className="pending-circle">○</div>
          )}
        </div>
        
        <div className="pulse-task-content">
          <h4 className="pulse-task-title">{task.title}</h4>
          <div className="pulse-task-reward">+{task.xp_reward} XP</div>
        </div>
        
        <div className="pulse-task-action">
          {isClaimed ? (
            <div className="claimed-badge">CLAIMED</div>
          ) : isCompleted ? (
            <button 
              className="claim-btn"
              onClick={() => handleClaimTask(task.task_id, task.xp_reward)}
            >
              CLAIM
            </button>
          ) : (
            <div className="pending-badge">PENDING</div>
          )}
        </div>
      </div>
    );
  };

  const allDailyCompleted = tasks.daily.every(task => claimedTasks.has(task.task_id));
  const allWeeklyCompleted = tasks.weekly.every(task => claimedTasks.has(task.task_id));

  return (
    <div className="pulse-task-system">
      {/* Daily Tasks Section */}
      <div className="pulse-task-section">
        <div className="pulse-task-section-header">
          <h3>DAILY TASKS</h3>
          {allDailyCompleted && (
            <div className="completion-badge daily-complete">
              <span>🌟 ALL DAILY TASKS COMPLETE!</span>
            </div>
          )}
        </div>
        <div className="pulse-task-list">
          {tasks.daily.map(renderTask)}
        </div>
      </div>

      {/* Weekly Tasks Section */}
      <div className="pulse-task-section">
        <div className="pulse-task-section-header">
          <h3>WEEKLY TASKS</h3>
          {allWeeklyCompleted && (
            <div className="completion-badge weekly-complete">
              <span>🏆 ALL WEEKLY TASKS COMPLETE!</span>
            </div>
          )}
        </div>
        <div className="pulse-task-list">
          {tasks.weekly.map(renderTask)}
        </div>
      </div>

      {/* Reset Information */}
      <div className="pulse-task-reset-info">
        <div className="reset-timer">
          <span>Daily tasks reset: Every 24h UTC</span>
          <span>Weekly tasks reset: Every Monday UTC</span>
        </div>
      </div>
    </div>
  );
};

export default PulseTaskSystem;