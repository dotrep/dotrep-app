import React, { useState, useEffect } from 'react';

interface Message {
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

interface MessageThreadProps {
  agentName: string;
  userFsn: string;
  onClose: () => void;
  onReply: (message: Message) => void;
  currentMessage: Message;
}

const MessageThread: React.FC<MessageThreadProps> = ({ 
  agentName, 
  userFsn, 
  onClose, 
  onReply,
  currentMessage
}) => {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Fetch conversation on mount
  useEffect(() => {
    fetchConversation();
  }, [agentName, userFsn]);

  // Format message timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(date);
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return timestamp;
    }
  };

  // Get conversation history between user and agent
  const fetchConversation = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch sent messages
      const sentResponse = await fetch(`/api/fsn/messages/sent/${userFsn}`);
      const sentData = await sentResponse.json();
      
      // Fetch inbox messages
      const inboxResponse = await fetch(`/api/fsn/messages/inbox/${userFsn}`);
      const inboxData = await inboxResponse.json();
      
      if (sentData.success && inboxData.success) {
        // Filter for messages between user and this agent
        const sentToAgent = sentData.messages.filter(
          (msg: Message) => msg.toFsn === agentName
        );
        
        const receivedFromAgent = inboxData.messages.filter(
          (msg: Message) => msg.fromFsn === agentName
        );
        
        // Combine and sort chronologically
        const allMessages = [...sentToAgent, ...receivedFromAgent].sort(
          (a: Message, b: Message) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        setConversation(allMessages);
      } else {
        setError('Failed to load conversation');
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  // Get message style based on content
  const getMessageStyle = (line: string) => {
    // XP award message
    if (line.includes('[+') && line.includes('XP awarded]')) {
      return {
        color: '#72f1b8',
        fontWeight: 'bold' as 'bold',
        backgroundColor: 'rgba(114, 241, 184, 0.1)',
        padding: '6px',
        borderRadius: '4px',
        margin: '10px 0'
      };
    }
    // Base64 encoded message
    else if (line.match(/[A-Za-z0-9+/=]{20,}/)) {
      return {
        fontFamily: 'monospace',
        color: '#ff9e64',
        backgroundColor: 'rgba(255, 158, 100, 0.1)',
        padding: '8px',
        borderRadius: '4px',
        overflow: 'auto' as 'auto',
        margin: '10px 0'
      };
    }
    // Glitch text
    else if (line.includes('g̷l̵i̶t̸c̶h̷') || line.includes('T̸h̶e̶')) {
      return {
        color: '#bb9af7',
        backgroundColor: 'rgba(187, 154, 247, 0.1)',
        padding: '8px',
        borderRadius: '4px',
        margin: '10px 0'
      };
    }
    // Default style
    return { margin: '10px 0' };
  };

  // Render a single message in the thread
  const renderMessage = (message: Message) => {
    const isFromAgent = message.fromFsn === agentName;
    
    return (
      <div 
        key={message.id}
        style={{
          marginBottom: '20px',
          backgroundColor: isFromAgent ? 'rgba(0, 0, 0, 0.2)' : 'rgba(56, 189, 248, 0.1)',
          padding: '15px',
          borderRadius: '8px',
          maxWidth: '90%',
          alignSelf: isFromAgent ? 'flex-start' : 'flex-end',
          border: isFromAgent 
            ? '1px solid rgba(100, 255, 255, 0.2)' 
            : '1px solid rgba(56, 189, 248, 0.3)'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '5px'
        }}>
          <div style={{ 
            fontWeight: 'bold',
            color: isFromAgent ? '#89ddff' : '#ff9e64'
          }}>
            {isFromAgent ? `${agentName}.fsn` : 'You'}
          </div>
          <div style={{ 
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.6)'  
          }}>
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
        
        <div style={{ whiteSpace: 'pre-wrap' as 'pre-wrap' }}>
          {message.message.split('\n').map((line, i) => (
            <p key={i} style={getMessageStyle(line)}>{line}</p>
          ))}
        </div>
        
        {message.fileUrl && (
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
              {message.fileName}
            </div>
            <a
              href={message.fileUrl}
              download={message.fileName || 'download'}
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
  };

  return (
    <div style={{
      backgroundColor: 'rgba(17, 25, 40, 0.75)',
      border: '1px solid rgba(100, 255, 255, 0.2)',
      borderRadius: '8px',
      padding: '20px',
      marginTop: '20px',
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        borderBottom: '1px solid rgba(100, 255, 255, 0.2)',
        paddingBottom: '10px'
      }}>
        <h3 style={{ 
          margin: 0,
          color: '#38bdf8',
          display: 'flex',
          alignItems: 'center'
        }}>
          {agentName === 'ghost' && <span style={{ marginRight: '8px' }}>👻</span>}
          {agentName === 'core' && <span style={{ marginRight: '8px' }}>🔷</span>}
          {agentName === 'vault' && <span style={{ marginRight: '8px' }}>🧰</span>}
          {agentName === 'forge' && <span style={{ marginRight: '8px' }}>🧱</span>}
          {agentName === 'echo' && <span style={{ marginRight: '8px' }}>📓</span>}
          Conversation with {agentName}.fsn
        </h3>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => fetchConversation()}
            style={{
              backgroundColor: 'rgba(75, 85, 99, 0.5)',
              color: 'white',
              border: '1px solid rgba(100, 255, 255, 0.2)',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Refresh
          </button>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'rgba(51, 65, 85, 0.7)',
              color: 'white',
              border: '1px solid rgba(100, 255, 255, 0.3)',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Close Thread
          </button>
        </div>
      </div>
      
      {error && (
        <div style={{
          backgroundColor: 'rgba(255, 99, 99, 0.1)',
          color: '#ff6363',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          {error}
        </div>
      )}
      
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '20px'
        }}>
          Loading conversation...
        </div>
      ) : (
        <>
          {conversation.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              No previous messages found with {agentName}.fsn
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              maxHeight: '400px',
              overflowY: 'auto',
              padding: '10px',
              backgroundColor: 'rgba(0, 0, 0, 0.15)',
              borderRadius: '6px'
            }}>
              {conversation.map(renderMessage)}
            </div>
          )}
          
          <div style={{
            marginTop: '20px',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => onReply(currentMessage)}
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
              <span>✉️</span> Reply to {agentName}.fsn
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MessageThread;