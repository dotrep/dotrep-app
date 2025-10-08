import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import VerificationBadge from '../VerificationBadge';
import { isUserVerified } from '../../utils/verification';
import '../../styles/verification.css';

interface Contact {
  contactFsn: string;
  userId: number;
  id: number;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTime?: string;
  isAiAgent?: boolean;
}

interface ChatListProps {
  userId: number;
  userFsn: string;
  onSelectChat: (contact: Contact) => void;
  selectedContact: Contact | null;
  contacts: Contact[];
  onlineUsers?: string[];
  loadingContacts: boolean;
}

const ChatList: React.FC<ChatListProps> = ({
  userId,
  userFsn,
  onSelectChat,
  selectedContact,
  contacts,
  onlineUsers = [],
  loadingContacts
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);

  // Update filtered contacts when contacts or search term changes
  useEffect(() => {
    const filtered = contacts.filter(contact => 
      contact.contactFsn.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Sort by unread count first, then by last message time
    filtered.sort((a, b) => {
      if ((a.unreadCount || 0) > 0 && (b.unreadCount || 0) === 0) return -1;
      if ((a.unreadCount || 0) === 0 && (b.unreadCount || 0) > 0) return 1;
      
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      
      return timeB - timeA; // Most recent first
    });
    
    setFilteredContacts(filtered);
  }, [contacts, searchTerm]);

  // Check if user is an AI agent
  const isAiAgent = (contactFsn: string): boolean => {
    return ['ghost', 'core', 'vault', 'forge', 'echo'].includes(contactFsn);
  };

  // Get agent icon
  const getAgentIcon = (agentName: string): string => {
    switch (agentName) {
      case 'ghost': return '👻';
      case 'core': return '🔷';
      case 'vault': return '🧰';
      case 'forge': return '🧱';
      case 'echo': return '📓';
      default: return '🤖';
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="chat-list" style={{
      backgroundColor: 'rgba(17, 25, 40, 0.75)',
      borderRadius: '8px',
      border: '1px solid rgba(100, 255, 255, 0.2)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        padding: '15px',
        borderBottom: '1px solid rgba(100, 255, 255, 0.2)'
      }}>
        <h3 style={{
          margin: '0 0 12px 0',
          fontSize: '16px',
          color: '#38bdf8',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>💬</span> Conversations
        </h3>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px 8px 30px',
              borderRadius: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(100, 255, 255, 0.2)',
              color: 'white',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <span style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 0.7,
            fontSize: '14px'
          }}>
            🔍
          </span>
        </div>
      </div>
      
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px'
      }}>
        {loadingContacts ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255, 255, 255, 0.6)' }}>
            Loading contacts...
          </div>
        ) : filteredContacts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255, 255, 255, 0.6)' }}>
            {searchTerm ? 'No contacts found' : 'No conversations yet'}
          </div>
        ) : (
          filteredContacts.map(contact => {
            const isSelected = selectedContact?.contactFsn === contact.contactFsn;
            const isOnline = onlineUsers.includes(contact.contactFsn);
            const isAgent = isAiAgent(contact.contactFsn);
            
            return (
              <div
                key={contact.id}
                data-contact={contact.contactFsn}
                onClick={() => onSelectChat(contact)}
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  backgroundColor: isSelected 
                    ? 'rgba(56, 189, 248, 0.15)' 
                    : 'rgba(0, 0, 0, 0.2)',
                  border: isSelected
                    ? '1px solid rgba(56, 189, 248, 0.4)'
                    : '1px solid rgba(100, 255, 255, 0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      position: 'relative',
                      width: '32px',
                      height: '32px',
                      backgroundColor: isAgent ? 'rgba(100, 255, 255, 0.1)' : 'rgba(56, 189, 248, 0.1)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      border: isAgent 
                        ? '1px solid rgba(100, 255, 255, 0.3)'
                        : '1px solid rgba(56, 189, 248, 0.3)'
                    }}>
                      {isAgent ? getAgentIcon(contact.contactFsn) : contact.contactFsn.charAt(0).toUpperCase()}
                      
                      {isOnline && !isAgent && (
                        <div style={{
                          position: 'absolute',
                          bottom: '0',
                          right: '0',
                          width: '10px',
                          height: '10px',
                          backgroundColor: '#10b981',
                          borderRadius: '50%',
                          border: '2px solid rgba(17, 25, 40, 0.75)'
                        }} />
                      )}
                    </div>
                    
                    <div style={{ 
                      fontWeight: (contact.unreadCount || 0) > 0 ? 'bold' : 'normal',
                      color: (contact.unreadCount || 0) > 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span className={`fsn-name ${isUserVerified(contact.contactFsn) ? 'fsn-name-verified' : ''}`}>
                        {contact.contactFsn}.fsn
                      </span>
                      {isUserVerified(contact.contactFsn) && (
                        <VerificationBadge size={14} glow={true} className="chat-username" />
                      )}
                      {isAgent && (
                        <span style={{
                          fontSize: '12px',
                          backgroundColor: 'rgba(100, 255, 255, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          marginLeft: '6px',
                          color: '#89ddff'
                        }}>
                          AI Agent
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {contact.lastMessageTime && (
                    <div style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      {formatTimestamp(contact.lastMessageTime)}
                    </div>
                  )}
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '180px'
                  }}>
                    {contact.lastMessage || 'No messages yet'}
                  </div>
                  
                  {(contact.unreadCount || 0) > 0 && (
                    <div style={{
                      backgroundColor: '#38bdf8',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      minWidth: '20px',
                      height: '20px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 5px'
                    }}>
                      {contact.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;