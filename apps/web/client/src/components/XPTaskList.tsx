import React, { useState } from 'react';

interface XPTask {
  id: string;
  label: string;
  xp: number;
  completed: boolean;
  interactive: boolean;
  action?: () => void;
}

interface XPTaskListProps {
  userId: number;
  completedTasks: string[];
  onTaskClick: (taskId: string) => void;
}

const XPTaskList: React.FC<XPTaskListProps> = ({ userId, completedTasks, onTaskClick }) => {
  const xpTasks: XPTask[] = [
    {
      id: 'verify_email',
      label: 'Verify Email Address',
      xp: 25,
      completed: completedTasks.includes('verify_email'),
      interactive: true,
    },
    {
      id: 'upload_first_file',
      label: 'Upload First File to Vault',
      xp: 10,
      completed: completedTasks.includes('upload_first_file'),
      interactive: false,
    },
    {
      id: 'connect_wallet',
      label: 'Connect Cryptocurrency Wallet',
      xp: 50,
      completed: completedTasks.includes('connect_wallet'),
      interactive: true,
    },
    {
      id: 'send_message',
      label: 'Send First FSN Message',
      xp: 15,
      completed: completedTasks.includes('send_message'),
      interactive: false,
    },
    {
      id: 'complete_profile',
      label: 'Complete Profile Setup',
      xp: 20,
      completed: completedTasks.includes('complete_profile'),
      interactive: true,
    },
    {
      id: 'invite_friend',
      label: 'Invite a Friend to FSN',
      xp: 30,
      completed: completedTasks.includes('invite_friend'),
      interactive: true,
    }
  ];

  const handleTaskClick = (task: XPTask) => {
    if (task.interactive && !task.completed) {
      onTaskClick(task.id);
    }
  };

  return (
    <div className="bg-muted/20 border rounded-md p-4">
      <h3 className="text-lg font-semibold mb-3 text-teal-300">XP Tasks</h3>
      <div className="flex flex-col space-y-3">
        {xpTasks.map((task) => (
          task.completed ? (
            <div key={task.id} className="flex justify-between items-center opacity-50 line-through">
              <span className="text-sm">{task.label}</span>
              <span className="text-xs text-green-500">✓ +{task.xp} XP</span>
            </div>
          ) : (
            <div key={task.id} className="flex justify-between items-center">
              {task.interactive ? (
                <button 
                  onClick={() => handleTaskClick(task)}
                  className="text-left hover:text-blue-400 transition cursor-pointer text-sm flex-1 text-start"
                >
                  {task.label}
                </button>
              ) : (
                <span className="text-sm flex-1">{task.label}</span>
              )}
              <span className="text-xs text-muted-foreground">+{task.xp} XP</span>
            </div>
          )
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-muted">
        <div className="text-xs text-muted-foreground">
          Completed: {completedTasks.length} / {xpTasks.length} tasks
        </div>
        <div className="text-xs text-teal-300">
          Total XP Available: {xpTasks.reduce((sum, task) => sum + task.xp, 0)}
        </div>
      </div>
    </div>
  );
};

export default XPTaskList;