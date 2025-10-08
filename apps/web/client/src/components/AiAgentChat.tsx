import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface AiAgentChatProps {
  userId: number;
  userFsnName: string;
  agentFsnName: string;
  onClose: () => void;
  onMessageSent?: () => void;
}

interface Message {
  id?: number;
  fromFsn: string;
  toFsn: string;
  message: string;
  timestamp: string;
  isRead?: boolean;
}

/**
 * AI Agent Chat Component
 * Displays a conversation with an AI agent and allows sending messages
 */
const AiAgentChat: React.FC<AiAgentChatProps> = ({ 
  userId, 
  userFsnName, 
  agentFsnName,
  onClose,
  onMessageSent
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  
  // Load conversation history
  useEffect(() => {
    fetchConversation();
  }, [userFsnName, agentFsnName]);
  
  const fetchConversation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/fsn/messages/conversation?fsn1=${userFsnName}&fsn2=${agentFsnName}`);
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      } else {
        console.error("Error fetching conversation:", await response.text());
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      setLoading(true);
      setError('');
      setXpEarned(null);
      
      // Create a temporary message to show immediately
      const tempMessage: Message = {
        fromFsn: userFsnName,
        toFsn: agentFsnName,
        message: newMessage,
        timestamp: new Date().toISOString()
      };
      
      // Add to UI immediately
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      
      // Send to AI agent
      const response = await fetch('/api/fsn/agents/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          senderFsn: userFsnName,
          agentFsn: agentFsnName,
          message: newMessage
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          // Replace temp message with actual sent message
          setMessages(prev => 
            prev.filter(m => m !== tempMessage).concat([
              data.sentMessage,
              data.agentResponse
            ])
          );
          
          // Check if XP was granted (may need backend modification to return this)
          if (data.xpGranted) {
            setXpEarned(data.xpGranted);
          }
          
          // Notify parent component
          if (onMessageSent) {
            onMessageSent();
          }
        } else {
          setError(data.error || 'Error sending message');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };
  
  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="ai-agent-chat">
      <div className="chat-header">
        <h3>{agentFsnName}</h3>
        <button className="close-button" onClick={onClose}>✕</button>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Say hello to {agentFsnName}!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={msg.id || index} 
              className={`chat-message ${msg.fromFsn === userFsnName ? 'sent' : 'received'}`}
            >
              <div className="message-content">{msg.message}</div>
              <div className="message-time">{formatTimestamp(msg.timestamp)}</div>
            </div>
          ))
        )}
        
        {xpEarned && (
          <div className="xp-notification">
            <span>🌟 You earned {xpEarned} XP!</span>
          </div>
        )}
      </div>
      
      <div className="chat-input">
        {error && <div className="error-message">{error}</div>}
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button 
          onClick={sendMessage}
          disabled={loading || !newMessage.trim()}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
      
      <style jsx>{`
        .ai-agent-chat {
          display: flex;
          flex-direction: column;
          height: 100%;
          background-color: rgba(15, 23, 42, 0.9);
          border-radius: 8px;
          border: 1px solid #2a3550;
          overflow: hidden;
        }
        
        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background-color: rgba(30, 41, 59, 0.7);
          border-bottom: 1px solid #2a3550;
        }
        
        .chat-header h3 {
          margin: 0;
          color: #38bdf8;
        }
        
        .close-button {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 18px;
        }
        
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .no-messages {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #94a3b8;
        }
        
        .chat-message {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 16px;
          position: relative;
        }
        
        .chat-message.sent {
          align-self: flex-end;
          background-color: #0ea5e9;
          color: white;
          border-bottom-right-radius: 4px;
        }
        
        .chat-message.received {
          align-self: flex-start;
          background-color: #1e293b;
          color: white;
          border-bottom-left-radius: 4px;
        }
        
        .message-content {
          word-break: break-word;
        }
        
        .message-time {
          font-size: 11px;
          opacity: 0.7;
          margin-top: 4px;
          text-align: right;
        }
        
        .xp-notification {
          align-self: center;
          background-color: rgba(234, 179, 8, 0.2);
          border: 1px solid #eab308;
          color: #fde047;
          padding: 6px 12px;
          border-radius: 16px;
          margin: 8px 0;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        
        .chat-input {
          padding: 16px;
          border-top: 1px solid #2a3550;
          display: flex;
          flex-direction: column;
        }
        
        .error-message {
          color: #ef4444;
          margin-bottom: 8px;
          font-size: 14px;
        }
        
        textarea {
          resize: none;
          height: 80px;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #2a3550;
          background-color: rgba(15, 23, 42, 0.5);
          color: white;
          margin-bottom: 10px;
        }
        
        button {
          padding: 10px;
          background-color: #0ea5e9;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        
        button:hover:not(:disabled) {
          background-color: #0284c7;
        }
        
        button:disabled {
          background-color: #475569;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default AiAgentChat;