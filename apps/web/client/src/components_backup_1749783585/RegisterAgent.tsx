import React, { useState } from 'react';

interface RegisterAgentProps {
  onSuccess?: () => void;
}

/**
 * Component to register an AI agent in the system
 */
const RegisterAgent: React.FC<RegisterAgentProps> = ({ onSuccess }) => {
  const [agentName, setAgentName] = useState('ghost');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const handleRegister = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // First check if the agent already exists
      const checkResponse = await fetch(`/api/fsn/check/${agentName}`);
      const checkData = await checkResponse.json();
      
      // If the domain is already registered, show a message
      if (!checkData.available) {
        setSuccess(`${agentName}.fsn is already registered in the system`);
        setLoading(false);
        if (onSuccess) onSuccess();
        return;
      }
      
      // Otherwise register the agent
      const response = await fetch('/api/admin/create-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: agentName,
          type: 'ai_agent',
          script: `${agentName}-agent.js`
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuccess(`Successfully registered ${agentName}.fsn`);
        if (onSuccess) onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to register agent');
      }
    } catch (error) {
      console.error('Error registering agent:', error);
      setError('An error occurred while registering the agent');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="register-agent">
      <h3>Register AI Agent</h3>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      <div className="form-group">
        <label>Agent Name</label>
        <input 
          type="text" 
          value={agentName} 
          onChange={(e) => setAgentName(e.target.value)}
          disabled={loading}
        />
      </div>
      
      <button 
        className="register-button"
        onClick={handleRegister}
        disabled={loading || !agentName.trim()}
      >
        {loading ? 'Registering...' : 'Register Agent'}
      </button>
      
      <p className="note">
        This will register the agent with name <strong>{agentName}.fsn</strong> in the system
      </p>
      
      <style jsx>{`
        .register-agent {
          padding: 20px;
          background-color: rgba(15, 23, 42, 0.7);
          border-radius: 8px;
          border: 1px solid #2a3550;
          max-width: 400px;
          margin: 0 auto;
        }
        
        h3 {
          margin-top: 0;
          color: #38bdf8;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        label {
          display: block;
          margin-bottom: 6px;
          color: #e2e8f0;
        }
        
        input {
          width: 100%;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #475569;
          background-color: rgba(15, 23, 42, 0.5);
          color: white;
        }
        
        .register-button {
          padding: 10px 16px;
          background-color: #0ea5e9;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          width: 100%;
          font-weight: 500;
        }
        
        .register-button:hover:not(:disabled) {
          background-color: #0284c7;
        }
        
        .register-button:disabled {
          background-color: #475569;
          cursor: not-allowed;
        }
        
        .error {
          padding: 8px 12px;
          background-color: rgba(239, 68, 68, 0.2);
          border: 1px solid #ef4444;
          color: #fecaca;
          border-radius: 6px;
          margin-bottom: 16px;
        }
        
        .success {
          padding: 8px 12px;
          background-color: rgba(34, 197, 94, 0.2);
          border: 1px solid #22c55e;
          color: #bbf7d0;
          border-radius: 6px;
          margin-bottom: 16px;
        }
        
        .note {
          margin-top: 12px;
          font-size: 14px;
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default RegisterAgent;