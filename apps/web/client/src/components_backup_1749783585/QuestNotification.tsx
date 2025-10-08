import React from 'react';
import { X, Award } from 'lucide-react';

interface QuestNotificationProps {
  title: string;
  message: string;
  reward?: string;
  onClose: () => void;
  onAccept?: () => void;
}

const QuestNotification: React.FC<QuestNotificationProps> = ({
  title,
  message,
  reward,
  onClose,
  onAccept
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 bg-black/90 border border-teal-400 rounded-lg p-4 max-w-sm shadow-lg">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Award size={16} className="text-teal-400" />
          <h3 className="text-sm font-semibold text-teal-300">{title}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      
      <p className="text-xs text-gray-300 mb-3 leading-relaxed">
        {message}
      </p>
      
      {reward && (
        <div className="text-xs text-teal-400 mb-3">
          Reward: {reward}
        </div>
      )}
      
      <div className="flex gap-2">
        {onAccept && (
          <button
            onClick={onAccept}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-3 py-1 rounded transition-colors"
          >
            Continue Quest
          </button>
        )}
        <button
          onClick={onClose}
          className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-3 py-1 rounded transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default QuestNotification;