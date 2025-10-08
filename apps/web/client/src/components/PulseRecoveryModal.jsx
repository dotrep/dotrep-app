import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import './PulseRecoveryModal.css';

const PulseRecoveryModal = ({ onClose, onRecoveryComplete }) => {
  const [completedTasks, setCompletedTasks] = useState({
    login: false,
    upload: false,
    miniMission: false
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const recoveryTasks = [
    { id: 'login', label: 'Log in again', icon: '🔑', completed: completedTasks.login },
    { id: 'upload', label: 'Upload 1 Vault item', icon: '📤', completed: completedTasks.upload },
    { id: 'miniMission', label: 'Play 1 Mini Mission', icon: '🎮', completed: completedTasks.miniMission }
  ];

  // Check if all tasks are completed
  const allTasksCompleted = Object.values(completedTasks).every(task => task);

  // Handle task completion
  const handleTaskComplete = async (taskId) => {
    try {
      // Mark task as completed
      setCompletedTasks(prev => ({
        ...prev,
        [taskId]: true
      }));

      // Check if all tasks are now completed
      const updatedTasks = { ...completedTasks, [taskId]: true };
      if (Object.values(updatedTasks).every(task => task)) {
        setShowSuccess(true);
        
        // Complete recovery after short delay
        setTimeout(() => {
          if (onRecoveryComplete) {
            onRecoveryComplete();
          }
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Error completing recovery task:', error);
    }
  };

  return (
    <div className="pulse-recovery-overlay">
      <div className="pulse-recovery-modal">
        
        {/* Modal Header */}
        <div className="recovery-header">
          <div className="pulse-icon-dead">💀</div>
          <h1>Signal Dark</h1>
          <p>Your Pulse has gone dark.</p>
        </div>

        {/* Recovery Instructions */}
        <div className="recovery-content">
          <h2>Reignite your Pulse by completing:</h2>
          
          <div className="recovery-tasks">
            {recoveryTasks.map(task => (
              <div 
                key={task.id}
                className={`recovery-task ${task.completed ? 'completed' : 'pending'}`}
                onClick={() => !task.completed && handleTaskComplete(task.id)}
              >
                <span className="task-icon">{task.icon}</span>
                <span className="task-label">{task.label}</span>
                <span className="task-status">
                  {task.completed ? '✅' : '⬜'}
                </span>
              </div>
            ))}
          </div>

          {allTasksCompleted && (
            <div className="recovery-success">
              <div className="success-icon">🔥</div>
              <h3>Pulse Restored!</h3>
              <p>+50 XP – Pulse Recovered</p>
              <p>Pulse restored to 30Hz</p>
            </div>
          )}

          {!allTasksCompleted && (
            <div className="recovery-reward">
              <p>✨ Complete all to restore to <strong>30Hz</strong> and gain <strong>+50 XP</strong></p>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button className="recovery-close" onClick={onClose}>
          {allTasksCompleted ? 'Continue' : 'Close'}
        </button>

      </div>
    </div>
  );
};

export default PulseRecoveryModal;