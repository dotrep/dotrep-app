import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Eye, MessageCircle, FileBox, Award, Wallet } from 'lucide-react';
import '../styles/dashboard-extensions.css';

interface Notification {
  id: string;
  type: 'message' | 'file' | 'xp' | 'quest' | 'wallet' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
}

interface NotificationSystemProps {
  userId?: number | null;
}

/**
 * Real-time notification system for FreeSpace Network
 * Shows alerts for new messages, file activities, XP rewards, etc.
 */
const NotificationSystem: React.FC<NotificationSystemProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle size={18} />;
      case 'file':
        return <FileBox size={18} />;
      case 'xp':
      case 'quest':
        return <Award size={18} />;
      case 'wallet':
        return <Wallet size={18} />;
      default:
        return <Bell size={18} />;
    }
  };
  
  // Format notification timestamp (relative time)
  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };
  
  // Load notifications (would connect to API in production)
  useEffect(() => {
    if (!userId) return;
    
    // Example notifications (would be fetched from API in production)
    const demoNotifications: Notification[] = [
      {
        id: 'notif-1',
        type: 'message',
        title: 'New Message',
        message: 'You received a new message from ghost.fsn',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        read: false,
        action: {
          label: 'View Message',
          url: '/messages'
        }
      },
      {
        id: 'notif-2',
        type: 'xp',
        title: 'XP Earned',
        message: 'You earned 50 XP for completing a quest',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        read: false
      },
      {
        id: 'notif-3',
        type: 'file',
        title: 'File Upload',
        message: 'Your file was successfully uploaded to FSN Vault',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: true
      },
      {
        id: 'notif-4',
        type: 'system',
        title: 'System Update',
        message: 'FreeSpace Network was updated to v3.2',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        read: true
      }
    ];
    
    setNotifications(demoNotifications);
    setUnreadCount(demoNotifications.filter(notif => !notif.read).length);
    
    // Simulate receiving a new notification after a delay
    const timer = setTimeout(() => {
      const newNotification: Notification = {
        id: `notif-${Date.now()}`,
        type: 'quest',
        title: 'New Quest Available',
        message: 'A new quest is available: "Digital Pathfinder"',
        timestamp: new Date(),
        read: false,
        action: {
          label: 'View Quest',
          url: '/quests'
        }
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    }, 60000); // After 1 minute
    
    return () => clearTimeout(timer);
  }, [userId]);
  
  // Handle click outside to close notification panel
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };
  
  // Mark a single notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };
  
  // Clear a notification
  const clearNotification = (id: string) => {
    const notif = notifications.find(n => n.id === id);
    
    setNotifications(prev => 
      prev.filter(notif => notif.id !== id)
    );
    
    if (notif && !notif.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };
  
  return (
    <div className="notification-system" ref={notificationRef}>
      <button 
        className="notification-bell"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <div className="notification-badge">{unreadCount}</div>
        )}
      </button>
      
      {showNotifications && (
        <div className="notification-panel">
          <div className="notification-header">
            <div className="notification-title">Notifications</div>
            
            <div className="notification-actions">
              {unreadCount > 0 && (
                <button className="read-all-button" onClick={markAllAsRead}>
                  <Eye size={14} />
                  <span>Mark all as read</span>
                </button>
              )}
            </div>
          </div>
          
          {notifications.length === 0 ? (
            <div className="empty-notifications">
              <p>No notifications</p>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-item-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    
                    <div className="notification-meta">
                      <span className="notification-time">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                      
                      {notification.action && (
                        <a 
                          href={notification.action.url} 
                          className="notification-action"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {notification.action.label}
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    className="notification-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearNotification(notification.id);
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;