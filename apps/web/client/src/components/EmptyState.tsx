import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    text: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '60px 20px',
      textAlign: 'center',
      background: 'rgba(0, 20, 40, 0.3)',
      border: '1px dashed rgba(0, 188, 212, 0.3)',
      borderRadius: '12px',
      fontFamily: 'Orbitron, sans-serif'
    }}>
      {icon && (
        <div style={{
          marginBottom: '20px',
          opacity: 0.6
        }}>
          {icon}
        </div>
      )}
      
      <h3 style={{
        color: '#00bcd4',
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '12px',
        letterSpacing: '1px'
      }}>
        {title}
      </h3>
      
      <p style={{
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '14px',
        lineHeight: '1.5',
        marginBottom: action ? '24px' : '0',
        maxWidth: '400px'
      }}>
        {description}
      </p>
      
      {action && (
        <button
          onClick={action.onClick}
          style={{
            background: 'linear-gradient(45deg, rgba(0, 188, 212, 0.2), rgba(0, 150, 168, 0.2))',
            border: '1px solid rgba(0, 188, 212, 0.5)',
            borderRadius: '8px',
            padding: '12px 24px',
            color: '#00bcd4',
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            letterSpacing: '0.5px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(45deg, rgba(0, 188, 212, 0.3), rgba(0, 150, 168, 0.3))';
            e.currentTarget.style.borderColor = 'rgba(0, 188, 212, 0.8)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 188, 212, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(45deg, rgba(0, 188, 212, 0.2), rgba(0, 150, 168, 0.2))';
            e.currentTarget.style.borderColor = 'rgba(0, 188, 212, 0.5)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {action.text}
        </button>
      )}
    </div>
  );
}