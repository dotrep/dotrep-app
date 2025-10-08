import React, { useState, useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';
import '../styles/dashboard-extensions.css';

interface MessageNotificationProps {
  sender: string;
  message: string;
  onView: () => void;
  onClose: () => void;
}

/**
 * Pop-up notification for new messages
 * Displays a preview of incoming messages with action buttons
 */
const MessageNotification: React.FC<MessageNotificationProps> = ({
  sender,
  message,
  onView,
  onClose
}) => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => {
      setVisible(true);
    }, 100);
    
    // Auto-dismiss after 15 seconds
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 500); // Allow animation to complete
    }, 15000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(dismissTimer);
    };
  }, [onClose]);
  
  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 500); // Allow animation to complete
  };
  
  return (
    <div className={`message-notification ${visible ? 'visible' : ''}`}>
      <div className="message-notification-icon">
        <MessageSquare size={24} />
      </div>
      
      <div className="message-notification-content">
        <div className="message-sender">{sender}</div>
        <div className="message-preview">{message}</div>
        
        <div className="message-actions">
          <button className="view-message-button" onClick={onView}>
            View Message
          </button>
          
          <button className="dismiss-message-button" onClick={handleClose}>
            Dismiss
          </button>
        </div>
      </div>
      
      <button className="message-notification-close" onClick={handleClose}>
        <X size={16} />
      </button>
    </div>
  );
};

export default MessageNotification;