import React, { useState, useEffect, useRef } from 'react';
import VerificationBadge from '../VerificationBadge';
import { isUserVerified } from '../../utils/verification';
import '../../styles/verification.css';

interface ChatMessage {
  id: number;
  fromFsn: string;
  toFsn: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  isTyping?: boolean;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
}

interface ChatInterfaceProps {
  contactFsn: string;
  userFsn: string;
  userId: number;
  onClose: () => void;
  onBack?: () => void;
  isAiAgent?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  contactFsn,
  userFsn,
  userId,
  onClose,
  onBack,
  isAiAgent = false
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch conversation history on mount
  useEffect(() => {
    fetchConversationHistory();
  }, [contactFsn, userFsn]);

  // Auto scroll to most recent message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch conversation history with the contact
  const fetchConversationHistory = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('=== CHAT DEBUG: Starting conversation fetch ===');
      console.log('Contact FSN param:', contactFsn);
      console.log('User FSN:', userFsn);
      
      // Check for popup message first (for AI agents)
      const agentName = contactFsn.replace('.fsn', '');
      const popupMessageKey = `popupMessage_${agentName}`;
      const storedPopupMessage = sessionStorage.getItem(popupMessageKey);
      console.log('Popup message check:', storedPopupMessage ? 'Found' : 'None');
      
      // Fetch sent messages
      console.log('Fetching sent messages...');
      const sentResponse = await fetch(`/api/fsn/messages/sent/${userFsn}`);
      const sentData = await sentResponse.json();
      console.log('Sent messages API response:', sentData);
      console.log('Total sent messages:', sentData.messages?.length || 0);
      
      // Fetch received messages
      console.log('Fetching inbox messages...');
      const inboxResponse = await fetch(`/api/fsn/messages/inbox/${userFsn}`);
      const inboxData = await inboxResponse.json();
      console.log('Inbox messages API response:', inboxData);
      console.log('Total inbox messages:', inboxData.messages?.length || 0);
      
      if (sentData.success && inboxData.success) {
        // ENHANCED FILTERING WITH COMPREHENSIVE DEBUGGING
        console.log('=== FILTER DEBUG: Starting message filtering ===');
        
        // Test all possible contact name formats
        const possibleContactFormats = [
          contactFsn,
          contactFsn.endsWith('.fsn') ? contactFsn.slice(0, -4) : contactFsn + '.fsn',
          contactFsn.replace('.fsn', ''),
          contactFsn.toLowerCase(),
          contactFsn.toLowerCase().replace('.fsn', ''),
          contactFsn.toLowerCase() + '.fsn'
        ];
        
        console.log('Testing contact formats:', possibleContactFormats);
        
        // FIXED: Use exact same logic as sidebar for consistent message matching
        const normalizedContact = contactFsn.replace('.fsn', '').toLowerCase();
        console.log('Normalized contact for matching:', normalizedContact);
        
        const sentToContact = sentData.messages.filter((msg: ChatMessage) => {
          const normalizedTo = msg.toFsn.replace('.fsn', '').toLowerCase();
          const matches = normalizedTo === normalizedContact;
          if (matches) {
            console.log(`✅ SENT MATCH: ${msg.toFsn} → ${contactFsn}`);
          }
          return matches;
        });
        
        const receivedFromContact = inboxData.messages.filter((msg: ChatMessage) => {
          const normalizedFrom = msg.fromFsn.replace('.fsn', '').toLowerCase();
          const matches = normalizedFrom === normalizedContact;
          if (matches) {
            console.log(`✅ RECEIVED MATCH: ${msg.fromFsn} → ${contactFsn}`);
          }
          return matches;
        });
        
        // Combine and sort by timestamp (oldest first for chat flow)
        const allMessages = [...sentToContact, ...receivedFromContact].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        // Add welcome message for first-time AI agent conversations
        let messagesToDisplay = allMessages;
        
        // If no previous conversation with AI agent, add welcome message
        if (isAiAgent && allMessages.length === 0) {
          const welcomeMessages = {
            'ghost': "👻 Boo! I'm ghost.fsn, a mysterious signal lurking in the network. I enjoy cryptic puzzles and hidden challenges. Say 'challenge' if you're brave enough...",
            'core': "🔵 Hello! I'm core.fsn, your guide through the FreeSpace Network. Type 'help' for navigation assistance, 'quest' to begin an adventure, or ask about specific agents like 'ghost', 'vault', 'forge', or 'echo'.",
            'vault': "🔒 Greetings! I'm vault.fsn, your personal storage and XP tracker. I can help you track your progress and inventory. Type 'status' to see your current stats or 'balance' to check your XP.",
            'forge': "⚡ Hello! I'm forge.fsn, your customization specialist. I help you upgrade your FSN experience with cosmetic enhancements and visual improvements. Type 'shop' to see available upgrades!",
            'echo': "📝 Hi there! I'm echo.fsn, your journaling companion. I help you track your FSN journey and maintain your digital history. Type 'journal' to begin documenting your adventures!"
          };
          
          const agentName = contactFsn.replace('.fsn', '');
          const welcomeText = welcomeMessages[agentName as keyof typeof welcomeMessages];
          
          if (welcomeText) {
            const welcomeMessage: ChatMessage = {
              id: -1,
              fromFsn: contactFsn,
              toFsn: userFsn,
              message: welcomeText,
              timestamp: new Date().toISOString(),
              isRead: true
            };
            messagesToDisplay = [welcomeMessage];
            console.log('Added welcome message for first-time conversation');
          }
        }
        
        // Check for popup messages
        if (storedPopupMessage && isAiAgent && allMessages.length > 0) {
          const popupMessage = JSON.parse(storedPopupMessage);
          console.log('Found popup message to display:', popupMessage);
          
          // Check if this message is already in the conversation
          const messageExists = allMessages.some(msg => 
            msg.message === popupMessage.message && 
            msg.fromFsn === popupMessage.fromFsn &&
            Math.abs(new Date(msg.timestamp).getTime() - new Date(popupMessage.timestamp).getTime()) < 5000
          );
          
          // If the message doesn't exist, add it to the beginning
          if (!messageExists) {
            messagesToDisplay = [popupMessage, ...messagesToDisplay];
            console.log('Added popup message to conversation');
          }
          
          // Clear the stored popup message after displaying it
          sessionStorage.removeItem(popupMessageKey);
        }
        
        console.log('=== FINAL RESULTS ===');
        console.log('Sent to contact count:', sentToContact.length);
        console.log('Received from contact count:', receivedFromContact.length);
        console.log('Combined messages:', allMessages.length);
        console.log('Final messages to display:', messagesToDisplay.length);
        
        // Log each message being set
        messagesToDisplay.forEach((msg, index) => {
          console.log(`Message ${index + 1}:`, {
            from: msg.fromFsn,
            to: msg.toFsn,
            message: msg.message.substring(0, 50) + '...',
            timestamp: msg.timestamp
          });
        });
        
        console.log('Setting messages state...');
        setMessages(messagesToDisplay);
        console.log('Messages state updated successfully');
        
        // Mark unread messages as read
        const unreadMessages = receivedFromContact.filter((msg: ChatMessage) => !msg.isRead);
        unreadMessages.forEach((msg: ChatMessage) => {
          markAsRead(msg.id);
        });
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      // Don't show error for AI agents - they should show welcome messages instead
      if (!isAiAgent) {
        setError('Failed to load conversation. Please try again.');
      } else {
        // For AI agents, show empty state which will trigger welcome message
        setMessages([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Mark message as read
  const markAsRead = async (messageId: number) => {
    try {
      await fetch(`/api/fsn/messages/read/${messageId}`, {
        method: 'PUT'
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds the limit (5MB)');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Content = event.target?.result as string;
      // Extract the base64 content without the data URL prefix
      const base64Data = base64Content.split(',')[1];
      setFileContent(base64Data);
      setFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  // Clear selected file
  const clearFile = () => {
    setFileContent('');
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Send a message to the contact
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() && !fileContent) return;
    
    try {
      setSending(true);
      setError('');
      
      // Store the message text before clearing the input
      const messageToSend = newMessage;
      
      // First, add the message optimistically to the UI for a faster experience
      const optimisticMessage: ChatMessage = {
        id: -Math.floor(Math.random() * 1000), // Temporary negative ID
        fromFsn: userFsn,
        toFsn: contactFsn,
        message: messageToSend,
        timestamp: new Date().toISOString(),
        isRead: true,
        fileName: fileName || undefined,
        fileUrl: fileContent ? '#' : undefined
      };
      
      setMessages(prevMessages => [...prevMessages, optimisticMessage]);
      
      // Clear the input fields immediately
      setNewMessage('');
      
      // Track chat activity to prevent popup interruptions
      sessionStorage.setItem('lastChatActivity', Date.now().toString());
      
      // Create the message data
      const messageData: any = {
        from: userFsn,
        to: contactFsn,
        message: messageToSend
      };
      
      // Add file data if present
      if (fileContent && fileName) {
        messageData.fileData = fileContent;
        messageData.fileName = fileName;
      }
      
      // Send the message
      const response = await fetch('/api/fsn/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response not OK:', errorText);
        throw new Error(`Failed to send message: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Clear file content and name after successful send
        clearFile();
        
        // If sending to an AI agent, wait to give it time to respond
        if (isAiAgent) {
          // Show a typing indicator for the AI agent
          const typingMessage: ChatMessage = {
            id: -Math.floor(Math.random() * 10000) - 5000,
            fromFsn: contactFsn,
            toFsn: userFsn,
            message: "...",
            timestamp: new Date().toISOString(),
            isRead: true,
            isTyping: true // Special flag for typing indicator
          };
          
          // Add typing indicator after a short delay for natural feel
          setTimeout(() => {
            setMessages(prevMessages => [...prevMessages, typingMessage]);
          }, 500);
          
          // Wait to give the AI agent system time to generate a response
          setTimeout(() => {
            // Remove typing indicator before fetching new messages
            setMessages(prevMessages => 
              prevMessages.filter(msg => !msg.isTyping)
            );
            fetchConversationHistory();
          }, 2000); // Longer delay for realistic AI response time
        } else {
          // For regular users, just reload the conversation to get the actual message
          fetchConversationHistory();
        }
      } else {
        setError('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('An error occurred while sending your message.');
    } finally {
      setSending(false);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date);
    } catch (error) {
      return 'Unknown time';
    }
  };

  // Check if user is an AI agent
  const isKnownAiAgent = (fsn: string): boolean => {
    return ['ghost', 'core', 'vault', 'forge', 'echo'].includes(fsn);
  };

  // Get agent icon based on name
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

  // Render special formatting for different types of messages
  const renderMessageContent = (message: string) => {
    if (!message) return null;
    
    return message.split('\n').map((line, i) => {
      // XP award notification
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
      // Base64 encoded text
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
      // Glitched text
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
    });
  };

  return (
    <div className="chat-interface" style={{
      backgroundColor: 'rgba(17, 25, 40, 0.85)',
      border: '1px solid rgba(100, 255, 255, 0.2)',
      borderRadius: '8px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backdropFilter: 'blur(10px)'
    }}>
      {/* Chat Header */}
      <div style={{
        padding: '15px',
        borderBottom: '1px solid rgba(100, 255, 255, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                backgroundColor: 'transparent',
                color: 'rgba(255, 255, 255, 0.8)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                padding: '0'
              }}
            >
              ←
            </button>
          )}
          
          <h3 style={{
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#38bdf8',
            fontSize: '18px'
          }}>
            {isKnownAiAgent(contactFsn) 
              ? <span>{getAgentIcon(contactFsn)}</span> 
              : <div style={{
                  width: '28px',
                  height: '28px',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}>
                  {contactFsn.charAt(0).toUpperCase()}
                </div>
            }
            <span className={`fsn-name ${isUserVerified(contactFsn) ? 'fsn-name-verified' : ''}`}>
              {contactFsn}.fsn
            </span>
            {isUserVerified(contactFsn) && (
              <VerificationBadge size={18} glow={true} className="chat-username" />
            )}
          </h3>
        </div>
        
        <button
          onClick={onClose}
          style={{
            backgroundColor: 'rgba(51, 65, 85, 0.7)',
            color: 'white',
            border: '1px solid rgba(100, 255, 255, 0.3)',
            borderRadius: '4px',
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Close Chat
        </button>
      </div>
      
      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '15px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}
      >
        {loading && messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255, 255, 255, 0.6)' }}>
            Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255, 255, 255, 0.6)' }}>
            {isAiAgent ? (
              <div style={{ 
                backgroundColor: 'rgba(100, 255, 255, 0.1)', 
                padding: '20px', 
                borderRadius: '8px',
                border: '1px solid rgba(100, 255, 255, 0.2)'
              }}>
                <div style={{ marginBottom: '10px', color: '#64ffff', fontWeight: 'bold' }}>
                  Welcome to {contactFsn}.fsn! 🤖
                </div>
                {(() => {
                  const agentName = contactFsn.replace('.fsn', '');
                  const welcomeMessages = {
                    'ghost': "👻 Boo! I'm ghost.fsn, a mysterious signal lurking in the network. I enjoy cryptic puzzles and hidden challenges. Say 'challenge' if you're brave enough...",
                    'core': "🔵 Hello! I'm core.fsn, your guide through the FreeSpace Network. Type 'help' for navigation assistance, 'quest' to begin an adventure, or ask about specific agents like 'ghost', 'vault', 'forge', or 'echo'.",
                    'vault': "🔒 Greetings! I'm vault.fsn, your personal storage and XP tracker. I can help you track your progress and inventory. Type 'status' to see your current stats or 'balance' to check your XP.",
                    'forge': "⚡ Hello! I'm forge.fsn, your customization specialist. I help you upgrade your FSN experience with cosmetic enhancements and visual improvements. Type 'shop' to see available upgrades!",
                    'echo': "📝 Hi there! I'm echo.fsn, your journaling companion. I help you track your FSN journey and maintain your digital history. Type 'journal' to begin documenting your adventures!"
                  };
                  return welcomeMessages[agentName as keyof typeof welcomeMessages] || `Hello! I'm ${contactFsn}.fsn. How can I help you today?`;
                })()}
              </div>
            ) : (
              `No messages yet. Start a conversation with ${contactFsn}.fsn`
            )}
          </div>
        ) : (
          <>
            {console.log('=== RENDER DEBUG: About to render messages ===', messages)}
            {messages.map(msg => {
            // Determine if this is a typing indicator or regular message
            if (msg.isTyping) {
              // AI agent typing indicator animation
              return (
                <div
                  key={msg.id}
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid rgba(100, 255, 255, 0.2)',
                    alignSelf: 'flex-start',
                    maxWidth: '80%',
                    position: 'relative',
                    marginLeft: '0',
                    marginRight: 'auto'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      fontWeight: 'bold',
                      color: '#89ddff',
                      marginRight: '5px'
                    }}>
                      {`${msg.fromFsn}.fsn`}
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}>
                      <span 
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#38bdf8',
                          animation: 'fadeInOut 1s ease-in-out infinite',
                          animationDelay: '0s'
                        }}
                      />
                      <span 
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#38bdf8',
                          animation: 'fadeInOut 1s ease-in-out infinite',
                          animationDelay: '0.2s'
                        }}
                      />
                      <span 
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#38bdf8',
                          animation: 'fadeInOut 1s ease-in-out infinite',
                          animationDelay: '0.4s'
                        }}
                      />
                      <style>{`
                        @keyframes fadeInOut {
                          0% { opacity: 0.3; }
                          50% { opacity: 1; }
                          100% { opacity: 0.3; }
                        }
                      `}</style>
                    </div>
                  </div>
                </div>
              );
            } else {
              // Regular message
              return (
                <div
                  key={msg.id}
                  style={{
                    backgroundColor: msg.fromFsn === userFsn 
                      ? 'rgba(56, 189, 248, 0.1)' 
                      : 'rgba(0, 0, 0, 0.2)',
                    padding: '15px',
                    borderRadius: '8px',
                    border: msg.fromFsn === userFsn
                      ? '1px solid rgba(56, 189, 248, 0.3)'
                      : '1px solid rgba(100, 255, 255, 0.2)',
                    alignSelf: msg.fromFsn === userFsn ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    position: 'relative',
                    marginLeft: msg.fromFsn === userFsn ? 'auto' : '0',
                    marginRight: msg.fromFsn === userFsn ? '0' : 'auto'
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
                      color: msg.fromFsn === userFsn ? '#ff9e64' : '#89ddff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {msg.fromFsn === userFsn ? (
                        <>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            backgroundColor: 'rgba(255, 158, 100, 0.2)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            border: '1px solid rgba(255, 158, 100, 0.4)'
                          }}>
                            {userFsn.charAt(0).toUpperCase()}
                          </div>
                          <span className={`fsn-name ${isUserVerified(userFsn) ? 'fsn-name-verified' : ''}`}>
                            {userFsn}.fsn
                          </span>
                          {isUserVerified(userFsn) && (
                            <VerificationBadge size={16} glow={true} className="message-sender" />
                          )}
                        </>
                      ) : (
                        <>
                          <span className={`fsn-name ${isUserVerified(msg.fromFsn) ? 'fsn-name-verified' : ''}`}>
                            {msg.fromFsn}.fsn
                          </span>
                          {isUserVerified(msg.fromFsn) && (
                            <VerificationBadge size={16} glow={true} className="message-sender" />
                          )}
                        </>
                      )}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.6)'
                    }}>
                      {formatTimestamp(msg.timestamp)}
                    </div>
                  </div>
                  
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {renderMessageContent(msg.message)}
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
              );
            }
          })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div style={{
        padding: '15px',
        borderTop: '1px solid rgba(100, 255, 255, 0.2)',
        backgroundColor: 'rgba(0, 0, 0, 0.2)'
      }}>
        {error && !isAiAgent && (
          <div style={{
            color: '#f87171',
            fontSize: '14px',
            marginBottom: '10px',
            padding: '8px',
            backgroundColor: 'rgba(248, 113, 113, 0.1)',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}
        
        {/* Selected file display */}
        {fileName && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            borderRadius: '4px',
            marginBottom: '10px',
            border: '1px dashed rgba(56, 189, 248, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '14px'
            }}>
              <span>📎</span> {fileName}
            </div>
            <button
              onClick={clearFile}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                padding: '0'
              }}
            >
              ×
            </button>
          </div>
        )}
        
        <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!!fileContent || sending}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: fileContent ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.6)',
              cursor: fileContent ? 'not-allowed' : 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              padding: '5px',
              borderRadius: '4px'
            }}
          >
            📎
          </button>
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Send a message to ${contactFsn}.fsn...`}
            disabled={sending}
            style={{
              flex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(100, 255, 255, 0.3)',
              borderRadius: '4px',
              padding: '10px 15px',
              color: 'white',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          
          <button
            type="submit"
            disabled={sending || (!newMessage.trim() && !fileContent)}
            style={{
              backgroundColor: sending || (!newMessage.trim() && !fileContent) 
                ? 'rgba(56, 189, 248, 0.5)' 
                : '#38bdf8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '10px 20px',
              cursor: sending || (!newMessage.trim() && !fileContent) 
                ? 'not-allowed' 
                : 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;