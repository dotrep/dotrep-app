import React, { useState, useEffect, useRef } from 'react';

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

export default function ChatInterface({ 
  contactFsn, 
  userFsn, 
  userId,
  onClose,
  onBack,
  isAiAgent = false
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch conversation history when component mounts or contact changes
  useEffect(() => {
    fetchConversationHistory();
  }, [contactFsn]);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Fetch conversation history
  const fetchConversationHistory = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch sent messages
      const sentResponse = await fetch(`/api/fsn/messages/sent/${userFsn}`);
      if (!sentResponse.ok) throw new Error('Failed to fetch sent messages');
      const sentData = await sentResponse.json();
      
      // Fetch received messages
      const inboxResponse = await fetch(`/api/fsn/messages/inbox/${userFsn}`);
      if (!inboxResponse.ok) throw new Error('Failed to fetch received messages');
      const inboxData = await inboxResponse.json();
      
      if (sentData.success && inboxData.success) {
        // Filter messages for the current conversation
        const sentToContact = sentData.messages.filter((msg: ChatMessage) => 
          msg.toFsn === contactFsn
        );
        
        const receivedFromContact = inboxData.messages.filter((msg: ChatMessage) => 
          msg.fromFsn === contactFsn
        );
        
        // Mark unread messages as read
        const unreadMessages = receivedFromContact.filter((msg: ChatMessage) => !msg.isRead);
        unreadMessages.forEach((msg: ChatMessage) => {
          markMessageAsRead(msg.id);
        });
        
        // Combine and sort all messages by timestamp
        const allMessages = [...sentToContact, ...receivedFromContact]
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        setMessages(allMessages);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      setError('Failed to load conversation history');
    } finally {
      setLoading(false);
    }
  };
  
  // Mark a message as read
  const markMessageAsRead = async (messageId: number) => {
    try {
      const response = await fetch(`/api/fsn/messages/read/${messageId}`, {
        method: 'PUT'
      });
      
      if (!response.ok) {
        console.error('Failed to mark message as read');
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        // Remove the data URL prefix to save only the base64 data
        const base64Content = content.split(',')[1];
        setFileContent(base64Content);
        setFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };
  
  // Clear file selection
  const clearFile = () => {
    setFileContent(null);
    setFileName(null);
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
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
        ' ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (error) {
      return timestamp;
    }
  };
  
  // Process message content to detect and handle links
  const renderMessageContent = (content: string) => {
    // Simple URL detection regex
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    if (!content) return '';
    
    // Split by URLs and map each part
    const parts = content.split(urlRegex);
    const matches = content.match(urlRegex) || [];
    
    // Rebuild the content with links
    const result = parts.reduce((acc, part, i) => {
      // Add the text part
      acc.push(part);
      
      // Add the URL part if it exists
      if (matches[i]) {
        acc.push(
          <a 
            key={i}
            href={matches[i]} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              color: '#38bdf8',
              textDecoration: 'underline'
            }}
          >
            {matches[i]}
          </a>
        );
      }
      
      return acc;
    }, [] as React.ReactNode[]);
    
    return result;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'rgba(10, 14, 35, 0.95)',
      borderRadius: '8px',
      border: '1px solid rgba(56, 189, 248, 0.2)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        padding: '15px',
        borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
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
                background: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '0'
              }}
            >
              ←
            </button>
          )}
          <div style={{
            fontWeight: 'bold',
            color: isAiAgent ? '#89ddff' : 'white'
          }}>
            {contactFsn}.fsn
            {isAiAgent && (
              <span style={{
                fontSize: '12px',
                backgroundColor: 'rgba(50, 205, 150, 0.2)',
                color: '#32cd96',
                padding: '3px 6px',
                borderRadius: '4px',
                marginLeft: '8px'
              }}>
                AI Agent
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.7)',
            cursor: 'pointer',
            fontSize: '18px'
          }}
        >
          ×
        </button>
      </div>
      
      {/* Messages */}
      <div 
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
            No messages yet. Start a conversation with {contactFsn}.fsn
          </div>
        ) : (
          messages.map(msg => {
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
                      color: msg.fromFsn === userFsn ? '#ff9e64' : '#89ddff'
                    }}>
                      {msg.fromFsn === userFsn ? 'You' : `${msg.fromFsn}.fsn`}
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
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <form 
        onSubmit={sendMessage}
        style={{
          borderTop: '1px solid rgba(56, 189, 248, 0.2)',
          padding: '15px',
          backgroundColor: 'rgba(0, 0, 0, 0.2)'
        }}
      >
        {error && (
          <div style={{
            color: '#ff6b6b',
            fontSize: '12px',
            marginBottom: '10px',
            padding: '5px',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}
        
        {fileName && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            padding: '8px 10px',
            borderRadius: '4px',
            marginBottom: '10px',
            border: '1px solid rgba(56, 189, 248, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '12px'
            }}>
              <span>📎</span>
              <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {fileName}
              </span>
            </div>
            <button
              type="button"
              onClick={clearFile}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '0 5px'
              }}
            >
              ×
            </button>
          </div>
        )}
        
        <div style={{
          display: 'flex',
          gap: '10px'
        }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '4px',
              padding: '10px',
              color: 'white',
              outline: 'none'
            }}
            disabled={sending}
          />
          
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '4px',
              width: '40px',
              cursor: 'pointer'
            }}
          >
            📎
            <input
              type="file"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              ref={fileInputRef}
              disabled={sending || !!fileContent}
            />
          </label>
          
          <button
            type="submit"
            disabled={sending || (!newMessage.trim() && !fileContent)}
            style={{
              backgroundColor: 'rgba(56, 189, 248, 0.8)',
              border: 'none',
              borderRadius: '4px',
              padding: '10px 15px',
              color: 'white',
              fontWeight: 'bold',
              cursor: sending || (!newMessage.trim() && !fileContent) ? 'default' : 'pointer',
              opacity: sending || (!newMessage.trim() && !fileContent) ? 0.6 : 1
            }}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}