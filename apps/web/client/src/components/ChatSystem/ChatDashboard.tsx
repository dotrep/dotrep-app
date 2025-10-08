import React, { useState, useEffect } from 'react';
import ChatList from './ChatList';
import FixedChatInterface from './FixedChatInterface';
import VerificationBadge from '../VerificationBadge';
import { isUserVerified } from '../../utils/verification';
import '../../styles/verification.css';

// Mock data for demonstration purposes until server is fixed
const MOCK_AI_AGENTS = [
  { name: 'ghost', id: 1, description: 'Secret challenges with XP rewards' },
  { name: 'core', id: 2, description: 'Central AI for onboarding and quests' },
  { name: 'vault', id: 3, description: 'XP tracker and inventory management' },
  { name: 'forge', id: 4, description: 'Cosmetic upgrades and customizations' },
  { name: 'echo', id: 5, description: 'Journaling and history tracking' }
];

interface Contact {
  contactFsn: string;
  userId: number;
  id: number;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTime?: string;
  isAiAgent?: boolean;
}

interface FsnMessage {
  id: number;
  fromFsn: string;
  toFsn: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
}

interface ChatDashboardProps {
  userId: number;
  userFsn: string;
  onClose?: () => void;
}

const ChatDashboard: React.FC<ChatDashboardProps> = ({
  userId,
  userFsn,
  onClose
}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [error, setError] = useState('');

  // Listen for popup navigation to specific agents
  useEffect(() => {
    const handleOpenAgentChat = (event: CustomEvent) => {
      const agentName = event.detail.agentName;
      console.log('ChatDashboard: Opening chat for agent:', agentName);
      
      const agentContact = contacts.find(contact => 
        contact.contactFsn === agentName || 
        contact.contactFsn === `${agentName}.fsn` ||
        contact.contactFsn.includes(agentName)
      );
      
      if (agentContact) {
        console.log('ChatDashboard: Found existing agent contact:', agentContact);
        setSelectedContact(agentContact);
        setActiveChat(agentContact);
      } else {
        // Create AI agent contact if it doesn't exist
        const newAgentContact: Contact = {
          contactFsn: agentName,
          userId: 0,
          id: Date.now(),
          isAiAgent: true,
          unreadCount: 0
        };
        console.log('ChatDashboard: Creating new agent contact:', newAgentContact);
        setContacts(prev => [newAgentContact, ...prev]);
        setSelectedContact(newAgentContact);
        setActiveChat(newAgentContact);
      }
    };

    const handleForceCreateAgentChat = (event: CustomEvent) => {
      const { agentName, message } = event.detail;
      console.log('ChatDashboard: Force creating agent chat for:', agentName, 'with message:', message);
      
      // Always create a fresh contact for the agent
      const newAgentContact: Contact = {
        contactFsn: agentName,
        userId: 0,
        id: Date.now(),
        isAiAgent: true,
        unreadCount: 1, // Mark as having unread message
        lastMessage: message,
        lastMessageTime: new Date().toISOString()
      };
      
      setContacts(prev => {
        // Remove existing agent if present, then add new one
        const filtered = prev.filter(c => 
          c.contactFsn !== agentName && 
          c.contactFsn !== `${agentName}.fsn`
        );
        return [newAgentContact, ...filtered];
      });
      setSelectedContact(newAgentContact);
      setActiveChat(newAgentContact);
      
      // Store the popup message to be displayed in the chat
      sessionStorage.setItem(`popupMessage_${agentName}`, JSON.stringify({
        fromFsn: `${agentName}.fsn`,
        toFsn: userFsn,
        message: message,
        timestamp: new Date().toISOString(),
        isPopupMessage: true
      }));
    };

    window.addEventListener('openAgentChat', handleOpenAgentChat as EventListener);
    window.addEventListener('forceCreateAgentChat', handleForceCreateAgentChat as EventListener);
    
    return () => {
      window.removeEventListener('openAgentChat', handleOpenAgentChat as EventListener);
      window.removeEventListener('forceCreateAgentChat', handleForceCreateAgentChat as EventListener);
    };
  }, [contacts]);
  const [showSettings, setShowSettings] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [openChats, setOpenChats] = useState<Contact[]>([]);
  const [activeChat, setActiveChat] = useState<Contact | null>(null);
  
  // User preference settings
  const [blockNonContacts, setBlockNonContacts] = useState(false);
  
  // Mock data for demonstration
  const mockContacts = [
    ...MOCK_AI_AGENTS.map(agent => ({
      contactFsn: agent.name,
      userId: userId,
      id: -agent.id,
      isAiAgent: true,
      lastMessage: `Hello, I'm ${agent.name}.fsn. ${agent.description}`,
      lastMessageTime: new Date().toISOString(),
      unreadCount: Math.floor(Math.random() * 3)
    })),
    {
      contactFsn: "user1",
      userId: userId,
      id: 100,
      lastMessage: "Hey, how's it going?",
      lastMessageTime: new Date(Date.now() - 120000).toISOString(),
      unreadCount: 2
    },
    {
      contactFsn: "alice",
      userId: userId,
      id: 101,
      lastMessage: "Did you check the latest FSN update?",
      lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
      unreadCount: 0
    }
  ];
  
  // Initialize - Fetch contacts and AI agents
  useEffect(() => {
    // Use mock data while server APIs are fixed
    setContacts(mockContacts);
    setLoadingContacts(false);
    
    // In a live environment, these would fetch real data:
    // fetchContacts();
    // fetchAiAgents();
    // fetchUserSettings();
    
    // Mock online users
    setOnlineUsers(['user1', 'alice']);
    
    // Periodically check for new messages and update unread counts
    const messageCheckInterval = setInterval(() => {
      // In live environment: updateMessageCounts();
      // For now, just simulate a new message occasionally
      const randomContact = mockContacts[Math.floor(Math.random() * mockContacts.length)];
      if (Math.random() < 0.3) { // 30% chance of new message
        setContacts(currentContacts => 
          currentContacts.map(contact => 
            contact.id === randomContact.id
              ? { ...contact, unreadCount: (contact.unreadCount || 0) + 1 }
              : contact
          )
        );
      }
    }, 15000); // Check every 15 seconds
    
    return () => {
      clearInterval(messageCheckInterval);
    };
  }, [userId, userFsn]);

  // Fetch user contact list - would be used with live API
  const fetchContacts = async () => {
    try {
      setLoadingContacts(true);
      setError('');
      
      // In a live environment:
      // const response = await fetch(`/api/fsn/contacts/${userId}`);
      // const data = await response.json();
      
      // For demonstration, using mock data:
      const mockResponse = { success: true, contacts: mockContacts };
      
      if (mockResponse.success) {
        // Process contacts
        const contactList = mockResponse.contacts || [];
        setContacts(contactList);
        
        // Update contacts with last message info
        // updateContactsWithMessageInfo(contactList);
      } else {
        console.error('Failed to fetch contacts:', 'Mock error');
        setError('Failed to load contacts');
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setError('Failed to load contacts');
    } finally {
      setLoadingContacts(false);
    }
  };

  // Fetch AI agents and add them to contacts
  const fetchAiAgents = async () => {
    // Available AI agents
    const aiAgents = [
      { name: 'ghost', id: 1 },
      { name: 'core', id: 2 },
      { name: 'vault', id: 3 },
      { name: 'forge', id: 4 },
      { name: 'echo', id: 5 }
    ];
    
    // Format AI agents as contacts
    const aiContacts = aiAgents.map(agent => ({
      contactFsn: agent.name,
      userId: userId,
      id: -agent.id, // Use negative IDs for AI agents to avoid conflicts
      isAiAgent: true
    }));
    
    setContacts(prev => {
      // Filter out any existing AI agents (to avoid duplicates)
      const userContacts = prev.filter(c => !aiContacts.some(ai => ai.contactFsn === c.contactFsn));
      return [...userContacts, ...aiContacts];
    });
    
    // Update AI contacts with message info
    updateContactsWithMessageInfo(aiContacts);
  };

  // Update contacts with last message and unread count info
  const updateContactsWithMessageInfo = async (contactList: Contact[]) => {
    try {
      // Fetch all inbox messages
      const inboxResponse = await fetch(`/api/fsn/messages/inbox/${userFsn}`);
      const inboxData = await inboxResponse.json();
      
      // Fetch all sent messages
      const sentResponse = await fetch(`/api/fsn/messages/sent/${userFsn}`);
      const sentData = await sentResponse.json();
      
      if (inboxData.success && sentData.success) {
        const inboxMessages = inboxData.messages || [];
        const sentMessages = sentData.messages || [];
        
        // Combine all messages
        const allMessages: FsnMessage[] = [...inboxMessages, ...sentMessages];
        
        // Sort by timestamp (newest first)
        allMessages.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        // Update contact info
        const updatedContacts = contactList.map(contact => {
          // Get all messages with this contact
          const contactMessages = allMessages.filter(msg => 
            msg.fromFsn === contact.contactFsn || msg.toFsn === contact.contactFsn
          );
          
          // Get last message (if any)
          const lastMessage = contactMessages[0];
          
          // Count unread messages from this contact
          const unreadCount = inboxMessages.filter((msg: FsnMessage) => 
            msg.fromFsn === contact.contactFsn && !msg.isRead
          ).length;
          
          return {
            ...contact,
            lastMessage: lastMessage?.message 
              ? lastMessage.message.substring(0, 50) + (lastMessage.message.length > 50 ? '...' : '')
              : undefined,
            lastMessageTime: lastMessage?.timestamp,
            unreadCount
          };
        });
        
        // Update contacts with the new info
        setContacts(prev => {
          // Merge updated contacts with existing ones
          const mergedContacts = prev.map(c => {
            const updated = updatedContacts.find(uc => uc.contactFsn === c.contactFsn);
            return updated || c;
          });
          
          // Add any new contacts from updatedContacts
          updatedContacts.forEach(uc => {
            if (!mergedContacts.some(c => c.contactFsn === uc.contactFsn)) {
              mergedContacts.push(uc);
            }
          });
          
          return mergedContacts;
        });
      }
    } catch (error) {
      console.error('Error updating message counts:', error);
    }
  };

  // Update message counts and last messages periodically
  const updateMessageCounts = () => {
    updateContactsWithMessageInfo(contacts);
  };

  // Fetch user chat settings
  const fetchUserSettings = async () => {
    try {
      const response = await fetch(`/api/user/settings/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setBlockNonContacts(data.settings.blockNonContacts || false);
        }
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    }
  };

  // Save user chat settings
  const saveUserSettings = async () => {
    try {
      await fetch(`/api/user/settings/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          blockNonContacts
        })
      });
    } catch (error) {
      console.error('Error saving user settings:', error);
    }
  };

  // Handle selecting a contact to chat with
  const handleSelectChat = (contact: Contact) => {
    // Check if chat is already open
    const existingChat = openChats.find(c => c.contactFsn === contact.contactFsn);
    
    if (existingChat) {
      // If already open, just make it active
      setActiveChat(existingChat);
    } else {
      // Otherwise, add to open chats
      setOpenChats(prev => [...prev, contact]);
      setActiveChat(contact);
    }
    
    // When selecting a chat, mark messages as read by updating unread count
    setContacts(prev => 
      prev.map(c => 
        c.contactFsn === contact.contactFsn 
          ? { ...c, unreadCount: 0 } 
          : c
      )
    );
  };

  // Close a chat tab
  const handleCloseChat = (contactFsn: string) => {
    setOpenChats(prev => prev.filter(c => c.contactFsn !== contactFsn));
    
    // If we're closing the active chat, set a new active chat
    if (activeChat?.contactFsn === contactFsn) {
      const remainingChats = openChats.filter(c => c.contactFsn !== contactFsn);
      setActiveChat(remainingChats.length > 0 ? remainingChats[0] : null);
    }
  };

  // Toggle settings panel
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  // Check if a contact is an AI agent
  const isAiAgent = (contactFsn: string) => {
    return ['ghost', 'core', 'vault', 'forge', 'echo'].includes(contactFsn);
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      maxHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'rgba(17, 25, 40, 0.75)',
      borderRadius: '8px',
      border: '1px solid rgba(100, 255, 255, 0.2)',
      overflow: 'hidden',
      backdropFilter: 'blur(8px)'
    }}>
      {/* Header with tabs for open chats */}
      <div style={{
        padding: '12px 15px',
        borderBottom: '1px solid rgba(100, 255, 255, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          overflow: 'auto',
          maxWidth: 'calc(100% - 100px)'
        }}>
          {openChats.map(chat => (
            <div
              key={chat.contactFsn}
              onClick={() => setActiveChat(chat)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px 6px 0 0',
                cursor: 'pointer',
                backgroundColor: activeChat?.contactFsn === chat.contactFsn 
                  ? 'rgba(56, 189, 248, 0.15)' 
                  : 'rgba(0, 0, 0, 0.2)',
                border: activeChat?.contactFsn === chat.contactFsn
                  ? '1px solid rgba(56, 189, 248, 0.4)'
                  : '1px solid rgba(100, 255, 255, 0.15)',
                borderBottom: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginRight: '4px',
                position: 'relative',
                minWidth: '110px'
              }}
            >
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: isAiAgent(chat.contactFsn) 
                  ? 'rgba(100, 255, 255, 0.1)' 
                  : 'rgba(56, 189, 248, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                border: isAiAgent(chat.contactFsn)
                  ? '1px solid rgba(100, 255, 255, 0.3)'
                  : '1px solid rgba(56, 189, 248, 0.3)'
              }}>
                {chat.contactFsn.charAt(0).toUpperCase()}
              </div>
              
              <span style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '70px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span className={`fsn-name ${isUserVerified(chat.contactFsn) ? 'fsn-name-verified' : ''}`}>
                  {chat.contactFsn}
                </span>
                {isUserVerified(chat.contactFsn) && (
                  <VerificationBadge size={14} glow={true} className="chat-username" />
                )}
              </span>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseChat(chat.contactFsn);
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%'
                }}
              >
                ×
              </button>
              
              {(chat.unreadCount || 0) > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: '#38bdf8',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  minWidth: '16px',
                  height: '16px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px'
                }}>
                  {chat.unreadCount}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div style={{
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={toggleSettings}
            style={{
              backgroundColor: showSettings 
                ? 'rgba(56, 189, 248, 0.15)'
                : 'rgba(51, 65, 85, 0.7)',
              color: 'white',
              border: showSettings
                ? '1px solid rgba(56, 189, 248, 0.4)'
                : '1px solid rgba(100, 255, 255, 0.3)',
              borderRadius: '4px',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span>⚙️</span> Settings
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'rgba(51, 65, 85, 0.7)',
                color: 'white',
                border: '1px solid rgba(100, 255, 255, 0.3)',
                borderRadius: '4px',
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>
      
      {/* Settings Panel (shown when settings are open) */}
      {showSettings && (
        <div style={{
          padding: '15px',
          borderBottom: '1px solid rgba(100, 255, 255, 0.2)',
          backgroundColor: 'rgba(0, 0, 0, 0.2)'
        }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '16px',
            color: '#38bdf8'
          }}>
            Chat Settings
          </h3>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <input
                type="checkbox"
                id="blockNonContacts"
                checked={blockNonContacts}
                onChange={(e) => setBlockNonContacts(e.target.checked)}
                style={{
                  accentColor: '#38bdf8',
                  width: '16px',
                  height: '16px'
                }}
              />
              <label
                htmlFor="blockNonContacts"
                style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '14px'
                }}
              >
                Block messages from users not in your contacts
              </label>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '10px'
            }}>
              <button
                onClick={saveUserSettings}
                style={{
                  backgroundColor: '#38bdf8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Contact List */}
        <div style={{
          width: '280px',
          borderRight: '1px solid rgba(100, 255, 255, 0.2)',
          height: '100%',
          overflow: 'hidden'
        }}>
          <ChatList
            userId={userId}
            userFsn={userFsn}
            onSelectChat={handleSelectChat}
            selectedContact={activeChat}
            contacts={contacts}
            onlineUsers={onlineUsers}
            loadingContacts={loadingContacts}
          />
        </div>
        
        {/* Chat Area */}
        <div style={{
          flex: 1,
          height: '100%',
          overflow: 'hidden'
        }}>
          {activeChat ? (
            <FixedChatInterface
              contactFsn={activeChat.contactFsn}
              userFsn={userFsn}
              userId={userId}
              onClose={() => handleCloseChat(activeChat.contactFsn)}
              isAiAgent={isAiAgent(activeChat.contactFsn)}
            />
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: '20px',
              color: 'rgba(255, 255, 255, 0.6)',
              padding: '20px'
            }}>
              <div style={{
                fontSize: '24px'
              }}>
                💬
              </div>
              <h3 style={{
                margin: 0,
                color: '#38bdf8',
                fontSize: '18px'
              }}>
                FreeSpace Network Chat
              </h3>
              <p style={{
                margin: 0,
                textAlign: 'center',
                maxWidth: '400px',
                fontSize: '14px'
              }}>
                Select a contact to start chatting. You can message other FSN users or interact with AI agents like ghost.fsn or core.fsn.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatDashboard;