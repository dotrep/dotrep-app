import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Test component to directly interact with ghost.fsn
 */
const GhostTest: React.FC = () => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [ghostResponses, setGhostResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userFsn, setUserFsn] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  
  // Load conversation history and check user login
  useEffect(() => {
    // Get the user's information from localStorage
    const userIdStr = localStorage.getItem('fsn_user_id');
    const userData = localStorage.getItem('fsn_user');
    
    if (userIdStr && userData) {
      try {
        const parsedUserId = parseInt(userIdStr, 10);
        setUserId(parsedUserId);
        
        const user = JSON.parse(userData);
        const fsnName = user.fsnName || user.fsn_name;
        setUserFsn(fsnName);
        
        console.log('User logged in:', { userId: parsedUserId, fsnName });
        
        // Load conversation with ghost.fsn
        fetchConversation(fsnName);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    } else {
      console.log('No user data found in localStorage');
    }
  }, []);
  
  // Fetch conversation history with ghost.fsn
  const fetchConversation = async (fsnName: string) => {
    try {
      // Get messages from ghost.fsn in inbox
      const inboxResponse = await fetch(`/api/fsn/messages/inbox/${fsnName}`);
      const inboxData = await inboxResponse.json();
      
      if (inboxData.success && inboxData.messages) {
        const ghostMessages = inboxData.messages.filter(
          (msg: any) => msg.fromFsn === 'ghost'
        );
        setGhostResponses(ghostMessages);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };
  
  const handleLogin = () => {
    setLocation('/login');
  };
  
  const sendMessage = async () => {
    if (!message.trim() || !userFsn) return;
    
    try {
      setLoading(true);
      setError('');
      
      console.log('Sending message to ghost.fsn:', {
        fromFsn: userFsn,
        toFsn: 'ghost',
        message: message
      });
      
      const response = await fetch('/api/fsn/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: userFsn,
          to: 'ghost',
          message: message
        })
      });
      
      const data = await response.json();
      console.log('Response from sending message:', data);
      
      setResponse(data);
      
      if (data.success) {
        setMessage('');
        
        // Check for ghost.fsn's response immediately
        setTimeout(() => {
          fetchConversation(userFsn);
        }, 500);
      } else {
        setError(data.message || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('An error occurred while sending message');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="ghost-test-container">
      <h1>Ghost.fsn Test</h1>
      
      {!userFsn ? (
        <div className="warning">
          You need to be logged in with an FSN name to test this feature.
          <button 
            onClick={handleLogin}
            className="login-button"
          >
            Log In Now
          </button>
        </div>
      ) : (
        <>
          <div className="conversation-section">
            <h2>Conversation with ghost.fsn</h2>
            
            {ghostResponses.length > 0 ? (
              <div className="messages">
                {ghostResponses.map((msg, index) => (
                  <div key={index} className="ghost-message">
                    <div className="ghost-name">ghost.fsn</div>
                    <div className="message-content">{msg.message}</div>
                    <div className="timestamp">
                      {new Date(msg.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-messages">
                No messages from ghost.fsn yet. Try saying "hi" or "hello" to start.
              </div>
            )}
          </div>
          
          <div className="input-section">
            <label>
              Message to ghost.fsn:
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
                placeholder="Try saying 'hi' or 'yes'"
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
            </label>
            
            <button 
              onClick={sendMessage}
              disabled={loading || !message.trim()}
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </div>
          
          {error && <div className="error">{error}</div>}
          
          {response && response.agentResponse && (
            <div className="response-highlight">
              <h3>Agent Response:</h3>
              <div className="message-content">{response.agentResponse.message}</div>
              
              {response.xpGranted && (
                <div className="xp-granted">
                  <span className="xp-badge">+{response.xpGranted} XP</span> awarded!
                </div>
              )}
            </div>
          )}
        </>
      )}
      
      <style jsx>{`
        .ghost-test-container {
          max-width: 800px;
          margin: 40px auto;
          padding: 20px;
          background-color: rgba(15, 23, 42, 0.7);
          border-radius: 12px;
          color: white;
          min-height: 70vh;
        }
        
        h1 {
          color: #38bdf8;
          text-align: center;
          margin-bottom: 24px;
        }
        
        h2 {
          color: #38bdf8;
          margin-top: 0;
          font-size: 1.5rem;
          border-bottom: 1px solid #475569;
          padding-bottom: 8px;
        }
        
        h3 {
          color: #38bdf8;
          margin-top: 0;
          font-size: 1.2rem;
        }
        
        .warning {
          background-color: rgba(234, 179, 8, 0.2);
          border: 1px solid #eab308;
          color: #fde047;
          padding: 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        
        .login-button {
          background-color: #eab308;
          color: #0f172a;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-weight: 600;
          cursor: pointer;
        }
        
        .login-button:hover {
          background-color: #facc15;
        }
        
        .conversation-section {
          background-color: rgba(30, 41, 59, 0.5);
          padding: 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          border: 1px solid #475569;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .messages {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .ghost-message {
          background-color: rgba(15, 23, 42, 0.7);
          padding: 12px;
          border-radius: 6px;
          border-left: 3px solid #38bdf8;
        }
        
        .ghost-name {
          font-weight: 600;
          color: #38bdf8;
          margin-bottom: 4px;
        }
        
        .message-content {
          word-break: break-word;
          line-height: 1.5;
        }
        
        .timestamp {
          font-size: 0.8rem;
          color: #94a3b8;
          margin-top: 8px;
          text-align: right;
        }
        
        .no-messages {
          font-style: italic;
          color: #94a3b8;
          text-align: center;
          padding: 20px 0;
        }
        
        .input-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        label {
          display: block;
          margin-bottom: 6px;
        }
        
        input {
          width: 100%;
          padding: 10px;
          border-radius: 6px;
          background-color: rgba(30, 41, 59, 0.7);
          border: 1px solid #475569;
          color: white;
          font-size: 16px;
        }
        
        button {
          padding: 10px 16px;
          background-color: #0ea5e9;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        
        button:hover:not(:disabled) {
          background-color: #0284c7;
        }
        
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .error {
          background-color: rgba(239, 68, 68, 0.2);
          border: 1px solid #ef4444;
          color: #fecaca;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
        }
        
        .response-highlight {
          background-color: rgba(16, 185, 129, 0.2);
          border: 1px solid #10b981;
          color: #a7f3d0;
          padding: 16px;
          border-radius: 6px;
          margin-top: 20px;
        }
        
        .xp-granted {
          margin-top: 12px;
          font-weight: 600;
          color: #a7f3d0;
        }
        
        .xp-badge {
          background-color: #10b981;
          color: #0f172a;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
};

export default GhostTest;