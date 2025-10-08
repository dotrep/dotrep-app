import React, { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  id: number;
  fromFsn: string;
  toFsn: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
}

interface AgentChatInterfaceProps {
  agentName: string;
  userFsn: string;
  userId: number;
  onClose: () => void;
}

const AgentChatInterface: React.FC<AgentChatInterfaceProps> = ({
  agentName,
  userFsn,
  userId,
  onClose
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch conversation history on mount
  useEffect(() => {
    fetchConversationHistory();
  }, [agentName, userFsn]);

  // Auto scroll to most recent message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch conversation history with the agent
  const fetchConversationHistory = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch sent messages
      const sentResponse = await fetch(`/api/fsn/messages/sent/${userFsn}`);
      const sentData = await sentResponse.json();
      
      // Fetch received messages
      const inboxResponse = await fetch(`/api/fsn/messages/inbox/${userFsn}`);
      const inboxData = await inboxResponse.json();  // Fixed: was using sentResponse.json()
      
      if (sentData.success && inboxData.success) {
        // Filter messages for this conversation
        const sentToAgent = sentData.messages.filter((msg: ChatMessage) => 
          msg.toFsn === agentName
        );
        
        const receivedFromAgent = inboxData.messages.filter((msg: ChatMessage) => 
          msg.fromFsn === agentName
        );
        
        console.log(`Chat interface - Sent messages to ${agentName}.fsn:`, sentToAgent.length);
        console.log(`Chat interface - Received messages from ${agentName}.fsn:`, receivedFromAgent.length);
        
        // Combine and sort by timestamp (oldest first for chat flow)
        const allMessages = [...sentToAgent, ...receivedFromAgent].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        setMessages(allMessages);
        
        // Mark unread messages as read
        const unreadMessages = receivedFromAgent.filter((msg: ChatMessage) => !msg.isRead);
        unreadMessages.forEach((msg: ChatMessage) => {
          markAsRead(msg.id);
        });
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      setError('Failed to load conversation. Please try again.');
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

  // Send a message to the agent
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    try {
      setSending(true);
      setError('');
      
      // Store the message text before clearing the input
      const messageToSend = newMessage;
      
      // First, add the message optimistically to the UI for a faster experience
      const optimisticMessage: ChatMessage = {
        id: -Math.floor(Math.random() * 1000), // Temporary negative ID
        fromFsn: userFsn,
        toFsn: agentName,
        message: messageToSend,
        timestamp: new Date().toISOString(),
        isRead: true
      };
      
      setMessages(prevMessages => [...prevMessages, optimisticMessage]);
      
      // Clear the input field immediately
      setNewMessage('');
      
      // Create exactly what the API expects based on the schema validation
      const messageData = {
        from: userFsn,
        to: agentName,
        message: messageToSend
      };
      
      console.log('Sending message:', messageData);
      
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
        console.log('Message sent successfully:', data);
        // Wait to give the AI agent system time to generate a response
        // Then refresh the entire conversation
        setTimeout(() => {
          fetchConversationHistory();
        }, 1000); // Give backend time to process the message and generate a response
      } else {
        console.error('Send failed with error:', data.message);
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

  // Get agent icon based on name
  const getAgentIcon = () => {
    switch (agentName) {
      case 'ghost':
        return '👻';
      case 'core':
        return '🔷';
      case 'vault':
        return '🧰';
      case 'forge':
        return '🧱';
      case 'echo':
        return '📓';
      default:
        return '🤖';
    }
  };

  return (
    <div className="agent-chat-interface" style={{
      backgroundColor: 'rgba(17, 25, 40, 0.85)',
      border: '1px solid rgba(100, 255, 255, 0.2)',
      borderRadius: '8px',
      height: '600px', // Fixed height for chat interface
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
        <h3 style={{
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#38bdf8',
          fontSize: '18px'
        }}>
          <span>{getAgentIcon()}</span>
          {agentName}.fsn
        </h3>
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
            No messages yet. Start a conversation with {agentName}.fsn
          </div>
        ) : (
          messages.map(msg => (
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
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div style={{
        padding: '15px',
        borderTop: '1px solid rgba(100, 255, 255, 0.2)',
        backgroundColor: 'rgba(0, 0, 0, 0.2)'
      }}>
        {error && (
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
        
        <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Send a message to ${agentName}.fsn...`}
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
            disabled={sending || !newMessage.trim()}
            style={{
              backgroundColor: sending ? 'rgba(56, 189, 248, 0.5)' : '#38bdf8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '10px 20px',
              cursor: sending ? 'not-allowed' : 'pointer',
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

export default AgentChatInterface;