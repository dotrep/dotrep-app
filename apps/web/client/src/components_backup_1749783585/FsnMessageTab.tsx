import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import AgentChatInterface from './AgentChatInterface';

interface FsnMessageTabProps {
  userId: number;
  fsnName: string;
}

interface FsnMessage {
  id: number;
  fromFsn: string;
  toFsn: string;
  message: string;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  timestamp: string;
  isRead: boolean;
}

/**
 * FSN Messaging Component
 * Allows users to send messages and files to other FSN identities
 */
const FsnMessageTab: React.FC<FsnMessageTabProps> = ({ userId, fsnName }) => {
  // State for messages
  const [inboxMessages, setInboxMessages] = useState<FsnMessage[]>([]);
  const [sentMessages, setSentMessages] = useState<FsnMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // State for sending new messages
  const [recipient, setRecipient] = useState('');
  const [messageText, setMessageText] = useState('');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'new'>('inbox');
  const [selectedMessage, setSelectedMessage] = useState<FsnMessage | null>(null);
  const [showThread, setShowThread] = useState(false);
  
  // Conversation history for threaded messages
  const [conversationHistory, setConversationHistory] = useState<FsnMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Chat interface state
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [chatAgent, setChatAgent] = useState('');
  
  // State for contacts
  interface Contact {
    id: number;
    userId: number;
    contactFsn: string;
    createdAt: string;
  }
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showContacts, setShowContacts] = useState(false);
  const [newContact, setNewContact] = useState('');
  
  // State for message privacy and AI agents
  const [blockUnknownMessages, setBlockUnknownMessages] = useState(false);
  const [aiAgents, setAiAgents] = useState<{id: number, fsnName: string}[]>([]);
  const [showAiAgents, setShowAiAgents] = useState(false);
  
  // Load inbox messages and contacts on component mount
  useEffect(() => {
    if (fsnName) {
      fetchInboxMessages();
      fetchContacts();
    }
  }, [fsnName]);
  
  // Fetch contacts
  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/fsn/contacts/${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      } else {
        const errorData = await response.json();
        console.error("Error fetching contacts:", errorData);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch inbox messages from the server
  const fetchInboxMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/fsn/messages/inbox/${fsnName}`);
      
      if (response.ok) {
        const data = await response.json();
        setInboxMessages(data.messages || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch inbox messages');
      }
    } catch (error) {
      console.error('Error fetching inbox messages:', error);
      setError('Failed to fetch inbox messages');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch sent messages from the server
  const fetchSentMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/fsn/messages/sent/${fsnName}`);
      
      if (response.ok) {
        const data = await response.json();
        setSentMessages(data.messages || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch sent messages');
      }
    } catch (error) {
      console.error('Error fetching sent messages:', error);
      setError('Failed to fetch sent messages');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tab changes
  const handleTabChange = (tab: 'inbox' | 'sent' | 'new') => {
    setActiveTab(tab);
    setSelectedMessage(null);
    setError('');
    setSuccess('');
    
    if (tab === 'sent' && sentMessages.length === 0) {
      fetchSentMessages();
    }
  };
  
  // Handle file input changes
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setFileName(file.name);
    setError(''); // Clear any previous errors
    
    // Use appropriate reader based on file type
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        // Convert the file to a Base64 string for storage
        const base64Content = e.target?.result as string;
        setFileContent(base64Content);
      } catch (err) {
        console.error("Error reading file:", err);
        setError("Could not read the selected file");
      }
    };
    
    reader.onerror = () => {
      setError("Failed to read the file. Please try again with a different file.");
    };
    
    // Read file as Base64 to support all file types
    reader.readAsDataURL(file);
  };
  
  // Check if a FSN name is valid and registered
  const checkRecipientExists = async (name: string): Promise<boolean> => {
    try {
      const formattedName = name.replace(/\.fsn$/, '');
      
      // Use the availability check endpoint
      const response = await fetch(`/api/fsn/check/${formattedName}`);
      
      if (!response.ok) {
        console.error('Failed to check FSN name availability');
        return false;
      }
      
      const data = await response.json();
      
      // If availability.available is false, it means the name is registered
      // This is how the API works - unavailable names are already registered
      return !data.available;
    } catch (error) {
      console.error('Error checking FSN name:', error);
      return false;
    }
  };
  
  // Send a message to another FSN identity
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipient) {
      setError('Please enter a recipient FSN name');
      return;
    }
    
    if (!messageText && !fileContent) {
      setError('Please enter a message or attach a file');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Format recipient (remove .fsn if added by user)
      const formattedRecipient = recipient.replace(/\.fsn$/, '');
      
      // Add recipient to contacts if not already there
      const existingContact = contacts.find(c => c.contactFsn === formattedRecipient);
      if (!existingContact) {
        try {
          const response = await fetch('/api/fsn/contacts/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              contactFsn: formattedRecipient
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            setContacts(prev => [data.contact, ...prev]);
          }
        } catch (error) {
          // Silently continue if adding contact fails
          console.error('Error auto-adding contact:', error);
        }
      }
      
      // Check if recipient exists before sending
      const recipientExists = await checkRecipientExists(formattedRecipient);
      if (!recipientExists) {
        setError(`Recipient FSN name "${formattedRecipient}" is not registered`);
        setLoading(false);
        return;
      }
      
      const messageData: any = {
        from: fsnName,
        to: formattedRecipient,
        message: messageText
      };
      
      // Add file data if present
      if (fileContent && fileName) {
        messageData.fileData = fileContent;
        messageData.fileName = fileName;
      }
      
      const response = await fetch('/api/fsn/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });
      
      if (response.ok) {
        const result = await response.json();
        setSuccess('Message sent successfully');
        
        // Clear form fields
        setMessageText('');
        setFileContent('');
        setFileName('');
        setRecipient('');
        
        // Update sent messages list
        setSentMessages(prev => [result.data, ...prev]);
        
        // Switch back to inbox tab after a short delay to show the success message
        setTimeout(() => {
          setActiveTab('inbox');
          setSuccess(''); // Clear the success message
          
          // Refresh inbox to show latest messages
          fetchInboxMessages();
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };
  
  // Mark a message as read
  const markAsRead = async (messageId: number) => {
    try {
      await fetch(`/api/fsn/messages/read/${messageId}`, {
        method: 'PUT'
      });
      
      // Update local state to mark message as read
      setInboxMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isRead: true } 
            : msg
        )
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };
  
  // View a message
  const viewMessage = (message: FsnMessage) => {
    setSelectedMessage(message);
    
    // Show thread view for AI agents like ghost.fsn
    if (message.fromFsn === 'ghost' || 
        message.fromFsn === 'core' || 
        message.fromFsn === 'vault' || 
        message.fromFsn === 'forge' || 
        message.fromFsn === 'echo') {
      setShowThread(true);
      // Fetch conversation history with this agent
      fetchConversationHistory(message.fromFsn);
      
      // If it's ghost.fsn, enable the chat interface option
      if (message.fromFsn === 'ghost') {
        setChatAgent('ghost');
      }
    } else {
      setShowThread(false);
    }
    
    // Mark as read if it's an inbox message and not already read
    if (activeTab === 'inbox' && !message.isRead) {
      markAsRead(message.id);
    }
  };
  
  // Fetch conversation history with an AI agent
  const fetchConversationHistory = async (agentFsn: string) => {
    try {
      setLoadingHistory(true);
      
      // First, get all messages sent by the user to this agent
      const sentResponse = await fetch(`/api/fsn/messages/sent/${fsnName}`);
      const sentData = await sentResponse.json();
      
      // Then, get all messages in the inbox
      const inboxResponse = await fetch(`/api/fsn/messages/inbox/${fsnName}`);
      const inboxData = await inboxResponse.json();
      
      if (sentData.success && inboxData.success) {
        // Filter for messages the user sent to this agent
        const sentToAgent = sentData.messages.filter((msg: FsnMessage) => 
          msg.toFsn === agentFsn
        );
        
        // Filter for messages received from this agent
        const receivedFromAgent = inboxData.messages.filter((msg: FsnMessage) => 
          msg.fromFsn === agentFsn
        );
        
        // Combine and sort by timestamp to create a reverse chronological thread (newest first)
        const allMessages = [...sentToAgent, ...receivedFromAgent].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        console.log(`Conversation thread with ${agentFsn}: ${allMessages.length} messages`);
        console.log(`- Sent to ${agentFsn}: ${sentToAgent.length}`);
        console.log(`- Received from ${agentFsn}: ${receivedFromAgent.length}`);
        
        setConversationHistory(allMessages);
      }
    } catch (error) {
      console.error(`Error fetching conversation with ${agentFsn}:`, error);
    } finally {
      setLoadingHistory(false);
    }
  };
  
  // Reply to a message
  const replyToMessage = (message: FsnMessage) => {
    // Switch to new message tab
    setActiveTab('new');
    
    // Set recipient to the sender of the current message
    setRecipient(message.fromFsn);
    
    // Close the thread view if it's open
    setShowThread(false);
    
    // If it's an AI agent, load conversation history for context
    if (message.fromFsn === 'ghost' || message.fromFsn === 'core' || 
        message.fromFsn === 'vault' || message.fromFsn === 'forge' || 
        message.fromFsn === 'echo') {
      // Add a small delay, then fetch messages specifically for this conversation
      setTimeout(() => {
        fetchConversationWithAgent(message.fromFsn);
      }, 100);
    }
    
    // Focus on the message textarea
    setTimeout(() => {
      const textarea = document.getElementById('message-text');
      if (textarea) {
        textarea.focus();
      }
    }, 100);
  };
  
  // Fetch conversation with a specific AI agent
  const fetchConversationWithAgent = async (agentName: string) => {
    try {
      // First get all sent messages to the agent
      const sentResponse = await fetch(`/api/fsn/messages/sent/${fsnName}`);
      const sentData = await sentResponse.json();
      
      // Then get all received messages from the agent
      const inboxResponse = await fetch(`/api/fsn/messages/inbox/${fsnName}`);
      const inboxData = await inboxResponse.json();
      
      if (sentData.success && inboxData.success) {
        // Filter for messages between the user and this specific agent
        const sentToAgent = sentData.messages.filter(
          (msg: any) => msg.toFsn === agentName
        );
        
        const receivedFromAgent = inboxData.messages.filter(
          (msg: any) => msg.fromFsn === agentName
        );
        
        // Combine and sort by timestamp
        const conversation = [...sentToAgent, ...receivedFromAgent].sort(
          (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        console.log(`Loaded conversation with ${agentName}.fsn:`, conversation);
        
        // Show the latest conversation in the compose area for context
        if (conversation.length > 0) {
          const latestMessages = conversation.slice(-3); // Get last 3 messages
          
          // Create a context string for the conversation
          let contextString = `\n\n--- Previous conversation with ${agentName}.fsn ---\n`;
          latestMessages.forEach((msg: any) => {
            const direction = msg.fromFsn === fsnName ? 'You' : `${agentName}.fsn`;
            contextString += `${direction}: ${msg.message}\n`;
          });
          
          // Set conversation placeholder with context
          document.getElementById('message-text')?.setAttribute(
            'placeholder', 
            `Reply to ${agentName}.fsn...\n${contextString}`
          );
        }
      }
    } catch (error) {
      console.error(`Error fetching conversation with ${agentName}.fsn:`, error);
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };
  
  // Contact management functions
  const addContact = async () => {
    if (!newContact) {
      setError('Please enter a valid FSN name');
      return;
    }
    
    try {
      setLoading(true);
      
      // Format contact name (remove .fsn if added)
      const formattedContact = newContact.replace(/\.fsn$/, '');
      
      // Check if the FSN name exists
      const checkResponse = await fetch(`/api/fsn/domain/check/${formattedContact}`);
      const checkData = await checkResponse.json();
      
      if (checkData.status !== 'registered') {
        setError(`FSN name "${formattedContact}" is not registered`);
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/fsn/contacts/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          contactFsn: formattedContact
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setContacts(prev => [data.contact, ...prev]);
        setNewContact('');
        setSuccess('Contact added successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to add contact');
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      setError('Failed to add contact');
    } finally {
      setLoading(false);
    }
  };
  
  const deleteContact = async (contactId: number) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/fsn/contacts/${contactId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setContacts(prev => prev.filter(contact => contact.id !== contactId));
        setSuccess('Contact removed');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to remove contact');
      }
    } catch (error) {
      console.error('Error removing contact:', error);
      setError('Failed to remove contact');
    } finally {
      setLoading(false);
    }
  };
  
  const selectContact = (contactFsn: string) => {
    setRecipient(contactFsn);
    setError(''); // Clear any previous errors
  };
  
  return (
    <div className="dashboard-card" style={{ width: '100%' }}>
      <div className="card-header">
        <h2>FSN Messaging</h2>
        <p className="messaging-subtitle">Send messages and files securely with your FSN identity</p>
      </div>
      
      <div className="messaging-tabs">
        <button 
          className={`tab-btn ${activeTab === 'inbox' ? 'active' : ''}`}
          onClick={() => handleTabChange('inbox')}
        >
          Inbox
        </button>
        <button 
          className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => handleTabChange('sent')}
        >
          Sent
        </button>
        <button 
          className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => handleTabChange('new')}
        >
          New Message
        </button>
      </div>
      
      <div className="card-content">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        {loading && <div className="loading-indicator">Loading...</div>}
        
        {/* Interactive Chat Interface - Shown when chat is opened */}
        {showChatInterface && chatAgent && (
          <div className="chat-interface-container" style={{ width: '100%', marginBottom: '20px' }}>
            <AgentChatInterface
              agentName={chatAgent}
              userFsn={fsnName}
              userId={userId}
              onClose={() => {
                setShowChatInterface(false);
                // Reload all messages to see new conversations
                fetchInboxMessages();
                fetchSentMessages();
              }}
            />
          </div>
        )}
        
        {activeTab === 'inbox' && (
          <div className="messages-container">
            {selectedMessage ? (
              <>
                {/* Regular Message View */}
                {!showThread && (
                  <div className="message-detail" style={{
                    backgroundColor: 'rgba(17, 25, 40, 0.7)',
                    border: '1px solid rgba(100, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '15px',
                    backdropFilter: 'blur(7px)'
                  }}>
                    <div className="message-header" style={{
                      borderBottom: '1px solid rgba(100, 255, 255, 0.2)',
                      paddingBottom: '12px',
                      marginBottom: '15px'
                    }}>
                      <div className="message-actions" style={{
                        display: 'flex',
                        gap: '10px',
                        marginBottom: '10px',
                        justifyContent: 'flex-start'
                      }}>
                        <button 
                          className="reply-btn"
                          onClick={() => replyToMessage(selectedMessage)}
                          style={{
                            backgroundColor: '#38bdf8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '14px',
                            boxShadow: '0 0 10px rgba(56, 189, 248, 0.3)'
                          }}
                        >
                          <span>✉️</span> Reply to {selectedMessage.fromFsn}.fsn
                        </button>
                        <button 
                          className="back-btn"
                          onClick={() => setSelectedMessage(null)}
                          style={{
                            backgroundColor: 'rgba(51, 65, 85, 0.7)',
                            color: 'white',
                            border: '1px solid rgba(100, 255, 255, 0.3)',
                            borderRadius: '4px',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          Back to Inbox
                        </button>
                      </div>
                      <div className="message-info" style={{
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <div className="sender">From: <span className="fsn-name" style={{
                          color: '#ffcb6b',
                          background: 'rgba(255, 203, 107, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>{selectedMessage.fromFsn}.fsn</span></div>
                        <div className="timestamp" style={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: '14px'
                        }}>{formatTimestamp(selectedMessage.timestamp)}</div>
                      </div>
                    </div>
                    
                    <div className="message-content" style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      padding: '15px',
                      borderRadius: '6px',
                      marginBottom: '15px',
                      whiteSpace: 'pre-wrap',
                      fontSize: '15px',
                      lineHeight: '1.5'
                    }}>
                      {selectedMessage.message && (
                        <div className="message-text">
                          {selectedMessage.message.split('\n').map((line, i) => {
                            // Style XP award notifications
                            if (line.includes('[+') && line.includes('XP awarded]')) {
                              return (
                                <p key={i} style={{
                                  color: '#72f1b8', 
                                  fontWeight: 'bold',
                                  backgroundColor: 'rgba(114, 241, 184, 0.1)',
                                  padding: '6px',
                                  borderRadius: '4px',
                                  margin: '10px 0'
                                }}>
                                  {line}
                                </p>
                              );
                            } 
                            // Style base64 encoded text
                            else if (line.match(/[A-Za-z0-9+/=]{20,}/)) {
                              return (
                                <p key={i} style={{
                                  fontFamily: 'monospace',
                                  color: '#ff9e64',
                                  backgroundColor: 'rgba(255, 158, 100, 0.1)',
                                  padding: '8px',
                                  borderRadius: '4px',
                                  overflow: 'auto',
                                  margin: '10px 0'
                                }}>
                                  {line}
                                </p>
                              );
                            }
                            // Style glitched text
                            else if (line.includes('g̷l̵i̶t̸c̶h̷') || line.includes('T̸h̶e̶')) {
                              return (
                                <p key={i} style={{
                                  color: '#bb9af7',
                                  backgroundColor: 'rgba(187, 154, 247, 0.1)',
                                  padding: '8px',
                                  borderRadius: '4px',
                                  margin: '10px 0'
                                }}>
                                  {line}
                                </p>
                              );
                            }
                            // Regular text
                            return <p key={i} style={{ margin: '10px 0' }}>{line}</p>;
                          })}
                        </div>
                      )}
                      
                      {selectedMessage.fileUrl && (
                        <div className="message-attachment" style={{
                          marginTop: '15px',
                          padding: '10px',
                          border: '1px dashed rgba(100, 255, 255, 0.4)',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(56, 189, 248, 0.1)'
                        }}>
                          <h4 style={{ margin: '0 0 8px 0', color: '#38bdf8' }}>Attachment:</h4>
                          <div className="file-info" style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            marginBottom: '8px' 
                          }}>
                            <span className="file-icon" style={{ marginRight: '8px' }}>📎</span>
                            <span className="file-name">{selectedMessage.fileName}</span>
                          </div>
                          <a 
                            href={selectedMessage.fileUrl} 
                            download={selectedMessage.fileName || 'download'}
                            className="download-btn"
                            style={{
                              color: 'white',
                              backgroundColor: 'rgba(56, 189, 248, 0.7)',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              textDecoration: 'none',
                              display: 'inline-block',
                              fontSize: '14px'
                            }}
                          >
                            Download
                          </a>
                        </div>
                      )}
                    </div>
                    
                    {/* Show button to view thread if message is from an AI agent */}
                    {(selectedMessage.fromFsn === 'ghost' || 
                      selectedMessage.fromFsn === 'core' || 
                      selectedMessage.fromFsn === 'vault' || 
                      selectedMessage.fromFsn === 'forge' || 
                      selectedMessage.fromFsn === 'echo') && (
                      <div style={{ textAlign: 'center', marginTop: '10px' }}>
                        <button
                          onClick={() => setShowThread(true)}
                          style={{
                            backgroundColor: 'rgba(56, 189, 248, 0.2)',
                            color: 'white',
                            border: '1px solid rgba(56, 189, 248, 0.5)',
                            borderRadius: '4px',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            margin: '0 auto'
                          }}
                        >
                          <span>🔄</span> View Conversation Thread
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Thread View for AI agents */}
                {showThread && selectedMessage && (
                  <div className="conversation-thread" style={{
                    backgroundColor: 'rgba(17, 25, 40, 0.8)',
                    border: '1px solid rgba(100, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '20px',
                    marginTop: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid rgba(100, 255, 255, 0.2)',
                      paddingBottom: '15px',
                      marginBottom: '20px'
                    }}>
                      <h3 style={{ 
                        margin: 0, 
                        color: '#38bdf8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        {selectedMessage.fromFsn === 'ghost' && <span>👻</span>}
                        {selectedMessage.fromFsn === 'core' && <span>🔷</span>}
                        {selectedMessage.fromFsn === 'vault' && <span>🧰</span>}
                        {selectedMessage.fromFsn === 'forge' && <span>🧱</span>}
                        {selectedMessage.fromFsn === 'echo' && <span>📓</span>}
                        Conversation with {selectedMessage.fromFsn}.fsn
                      </h3>
                      
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {selectedMessage.fromFsn === 'ghost' && (
                          <button
                            onClick={() => {
                              setShowChatInterface(true);
                              setShowThread(false);
                            }}
                            style={{
                              backgroundColor: '#38bdf8',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '8px 16px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <span>💬</span> Open Interactive Chat
                          </button>
                        )}
                        <button
                          onClick={() => setShowThread(false)}
                          style={{
                            backgroundColor: 'rgba(51, 65, 85, 0.7)',
                            color: 'white',
                            border: '1px solid rgba(100, 255, 255, 0.3)',
                            borderRadius: '4px',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          Close Thread
                        </button>
                      </div>
                    </div>
                    
                    {loadingHistory ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        Loading conversation history...
                      </div>
                    ) : conversationHistory.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255, 255, 255, 0.6)' }}>
                        No previous messages found.
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '15px',
                        maxHeight: '500px',
                        overflowY: 'auto',
                        padding: '10px'
                      }}>
                        {conversationHistory.map(msg => (
                          <div
                            key={msg.id}
                            style={{
                              backgroundColor: msg.fromFsn === fsnName 
                                ? 'rgba(56, 189, 248, 0.1)' 
                                : 'rgba(0, 0, 0, 0.2)',
                              padding: '15px',
                              borderRadius: '8px',
                              border: msg.fromFsn === fsnName
                                ? '1px solid rgba(56, 189, 248, 0.3)'
                                : '1px solid rgba(100, 255, 255, 0.2)',
                              alignSelf: msg.fromFsn === fsnName ? 'flex-end' : 'flex-start',
                              maxWidth: '80%',
                              marginLeft: msg.fromFsn === fsnName ? 'auto' : '0',
                              marginRight: msg.fromFsn === fsnName ? '0' : 'auto'
                            }}
                          >
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: '10px',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                              paddingBottom: '5px'
                            }}>
                              <div style={{
                                fontWeight: 'bold',
                                color: msg.fromFsn === fsnName ? '#ff9e64' : '#89ddff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                {msg.fromFsn === fsnName && (
                                  <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #66fcf1, #00f0ff)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    color: '#000'
                                  }}>
                                    {fsnName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span style={{
                                  background: msg.fromFsn === fsnName 
                                    ? 'linear-gradient(135deg, #ff9e64, #f7931e)' 
                                    : 'linear-gradient(135deg, #89ddff, #4fc3f7)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  fontSize: '14px',
                                  fontWeight: '600'
                                }}>
                                  {msg.fromFsn === fsnName ? `${fsnName}.fsn` : `${msg.fromFsn}.fsn`}
                                </span>
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: 'rgba(255, 255, 255, 0.6)'
                              }}>
                                {formatTimestamp(msg.timestamp)}
                              </div>
                            </div>
                            
                            <div style={{ whiteSpace: 'pre-wrap' }}>
                              {msg.message.split('\n').map((line, i) => {
                                // Style XP award notifications
                                if (line.includes('[+') && line.includes('XP awarded]')) {
                                  return (
                                    <p key={i} style={{
                                      color: '#72f1b8', 
                                      fontWeight: 'bold',
                                      backgroundColor: 'rgba(114, 241, 184, 0.1)',
                                      padding: '6px',
                                      borderRadius: '4px',
                                      margin: '10px 0'
                                    }}>
                                      {line}
                                    </p>
                                  );
                                } 
                                // Style base64 encoded text
                                else if (line.match(/[A-Za-z0-9+/=]{20,}/)) {
                                  return (
                                    <p key={i} style={{
                                      fontFamily: 'monospace',
                                      color: '#ff9e64',
                                      backgroundColor: 'rgba(255, 158, 100, 0.1)',
                                      padding: '8px',
                                      borderRadius: '4px',
                                      overflow: 'auto',
                                      margin: '10px 0'
                                    }}>
                                      {line}
                                    </p>
                                  );
                                }
                                // Style glitched text
                                else if (line.includes('g̷l̵i̶t̸c̶h̷') || line.includes('T̸h̶e̶')) {
                                  return (
                                    <p key={i} style={{
                                      color: '#bb9af7',
                                      backgroundColor: 'rgba(187, 154, 247, 0.1)',
                                      padding: '8px',
                                      borderRadius: '4px',
                                      margin: '10px 0'
                                    }}>
                                      {line}
                                    </p>
                                  );
                                }
                                // Regular text
                                return <p key={i} style={{ margin: '10px 0' }}>{line}</p>;
                              })}
                            </div>
                            
                            {msg.fileUrl && (
                              <div style={{
                                marginTop: '10px',
                                padding: '8px',
                                border: '1px dashed rgba(100, 255, 255, 0.3)',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(0, 0, 0, 0.2)'
                              }}>
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  marginBottom: '5px',
                                  fontSize: '14px' 
                                }}>
                                  <span style={{ marginRight: '5px' }}>📎</span>
                                  {msg.fileName}
                                </div>
                                <a
                                  href={msg.fileUrl}
                                  download={msg.fileName || 'download'}
                                  style={{
                                    color: '#38bdf8',
                                    fontSize: '12px',
                                    textDecoration: 'none'
                                  }}
                                >
                                  Download file
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      marginTop: '20px'
                    }}>
                      <button
                        onClick={() => replyToMessage(selectedMessage)}
                        style={{
                          backgroundColor: '#38bdf8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '10px 20px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '14px',
                          boxShadow: '0 0 10px rgba(56, 189, 248, 0.3)'
                        }}
                      >
                        <span>✉️</span> Reply to {selectedMessage.fromFsn}.fsn
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <h3>Messages Received</h3>
                {inboxMessages.length === 0 ? (
                  <div className="empty-state">
                    <p>No messages in your inbox</p>
                  </div>
                ) : (
                  <div className="message-list">
                    {inboxMessages.map(message => (
                      <div 
                        key={message.id} 
                        className={`message-item ${!message.isRead ? 'unread' : ''}`}
                        onClick={() => viewMessage(message)}
                      >
                        <div className="message-sender">
                          <span className="fsn-name">{message.fromFsn}.fsn</span>
                        </div>
                        <div className="message-preview">
                          {message.message
                            ? message.message.substring(0, 60) + (message.message.length > 60 ? '...' : '')
                            : '[No message]'}
                        </div>
                        <div className="message-meta">
                          {message.fileUrl && <span className="attachment-indicator">📎</span>}
                          <span className="message-time">{formatTimestamp(message.timestamp)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {activeTab === 'sent' && (
          <div className="messages-container">
            {selectedMessage ? (
              <div className="message-detail">
                <div className="message-header">
                  <button 
                    className="back-btn"
                    onClick={() => setSelectedMessage(null)}
                  >
                    Back to Sent
                  </button>
                  <div className="message-info">
                    <div className="sender">To: <span className="fsn-name">{selectedMessage.toFsn}.fsn</span></div>
                    <div className="timestamp">{formatTimestamp(selectedMessage.timestamp)}</div>
                  </div>
                </div>
                
                <div className="message-content">
                  {selectedMessage.message && (
                    <div className="message-text">{selectedMessage.message}</div>
                  )}
                  
                  {selectedMessage.fileUrl && (
                    <div className="message-attachment">
                      <h4>Attachment:</h4>
                      <div className="file-info">
                        <span className="file-icon">📎</span>
                        <span className="file-name">{selectedMessage.fileName}</span>
                      </div>
                      <a 
                        href={selectedMessage.fileUrl} 
                        download={selectedMessage.fileName || 'download'}
                        className="download-btn"
                      >
                        Download
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <h3>Messages Sent</h3>
                {sentMessages.length === 0 ? (
                  <div className="empty-state">
                    <p>No sent messages</p>
                  </div>
                ) : (
                  <div className="message-list">
                    {sentMessages.map(message => (
                      <div 
                        key={message.id} 
                        className="message-item"
                        onClick={() => viewMessage(message)}
                      >
                        <div className="message-sender">
                          <span className="fsn-name">To: {message.toFsn}.fsn</span>
                        </div>
                        <div className="message-preview">
                          {message.message
                            ? message.message.substring(0, 60) + (message.message.length > 60 ? '...' : '')
                            : '[No message]'}
                        </div>
                        <div className="message-meta">
                          {message.fileUrl && <span className="attachment-indicator">📎</span>}
                          <span className="message-time">{formatTimestamp(message.timestamp)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {activeTab === 'new' && (
          <div className="new-message-container">
            <h3>Send a Message</h3>
            <form onSubmit={sendMessage}>
              <div className="form-group">
                <label htmlFor="recipient">To (FSN Name):</label>
                <div className="recipient-input-container" style={{ position: 'relative' }}>
                  <input
                    type="text"
                    id="recipient"
                    value={recipient}
                    onChange={(e) => {
                      // Remove .fsn if user types it
                      const value = e.target.value.replace(/\.fsn$/, '');
                      setRecipient(value);
                    }}
                    onBlur={async () => {
                      if (recipient) {
                        const exists = await checkRecipientExists(recipient);
                        if (!exists) {
                          setError(`Recipient FSN name "${recipient}" is not registered`);
                        } else {
                          setError('');
                        }
                      }
                    }}
                    placeholder="Enter a valid FSN name"
                    className="recipient-input"
                    style={{ 
                      paddingRight: '55px',
                      width: '100%',
                      backgroundColor: 'rgba(20, 28, 48, 0.7)',
                      border: '1px solid rgba(100, 255, 255, 0.3)',
                      color: '#e0e7f2',
                      padding: '10px 60px 10px 15px',
                      borderRadius: '4px'
                    }}
                  />
                  <span className="fsn-suffix" style={{ 
                    position: 'absolute', 
                    right: '15px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: '#64ffff',
                    pointerEvents: 'none',
                    fontWeight: 'bold'
                  }}>.fsn</span>
                </div>
                
                <div className="contacts-container">
                  <button 
                    type="button"
                    className="contacts-toggle"
                    onClick={() => setShowContacts(!showContacts)}
                  >
                    <span className={`icon ${showContacts ? 'open' : ''}`}>›</span>
                    {showContacts ? 'Hide Address Book' : 'Show Address Book'}
                  </button>
                  
                  {showContacts && (
                    <>
                      <div className="add-contact-container">
                        <div className="add-contact-form">
                          <input 
                            type="text"
                            value={newContact}
                            onChange={(e) => setNewContact(e.target.value)}
                            placeholder="Add a new contact (FSN name)"
                          />
                          <button type="button" onClick={addContact}>Add</button>
                        </div>
                      </div>
                      
                      {contacts.length > 0 ? (
                        <div className="contacts-list">
                          {contacts.map(contact => (
                            <div key={contact.id} className="contact-card">
                              <div className="contact-name" onClick={() => selectContact(contact.contactFsn)}>
                                {contact.contactFsn}.fsn
                              </div>
                              <div className="contact-actions">
                                <button 
                                  type="button"
                                  className="contact-action-btn"
                                  onClick={() => deleteContact(contact.id)}
                                  title="Remove contact"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-contacts">
                          No contacts saved yet
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="message">Message:</label>
                <textarea
                  id="message"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Write your message here..."
                  className="message-textarea"
                  rows={6}
                />
              </div>
              
              <div className="form-group">
                <label>Attachment (optional):</label>
                <div className="file-upload-container">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    id="file-upload"
                    className="file-input"
                  />
                  <label htmlFor="file-upload" className="file-upload-label">
                    <span className="file-icon">📎</span>
                    {fileName ? fileName : 'Choose a file'}
                  </label>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="send-button"
                disabled={loading || (!messageText && !fileContent)}
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default FsnMessageTab;