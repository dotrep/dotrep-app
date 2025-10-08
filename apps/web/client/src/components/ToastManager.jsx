import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, Zap, Radio, Activity, Star } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(({
    message,
    type = 'default',
    duration = 3000,
    icon = null
  }) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, icon, duration };
    
    setToasts(prev => [...prev, toast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, onRemove }) => {
  const getToastIcon = (type) => {
    switch (type) {
      case 'xp':
        return <Zap size={20} color="#00ff88" />;
      case 'level-up':
        return <Star size={24} color="#ffd700" />;
      case 'badge':
        return <Star size={20} color="#ff00ff" />;
      case 'signal-unlock':
        return <Radio size={20} color="#00bcd4" />;
      case 'beacon-unlock':
        return <Activity size={20} color="#00bcd4" />;
      case 'pulse-boost':
        return <Zap size={20} color="#00bcd4" />;
      case 'upload':
        return <Activity size={20} color="#00ff88" />;
      case 'quest':
        return <Star size={20} color="#00bcd4" />;
      default:
        return <Zap size={20} color="#00bcd4" />;
    }
  };

  const getToastStyles = (type) => {
    const baseStyles = {
      background: 'linear-gradient(135deg, rgba(0, 20, 40, 0.95) 0%, rgba(0, 30, 60, 0.95) 100%)',
      border: '2px solid #00bcd4',
      borderRadius: '12px',
      padding: '16px 20px',
      color: '#ffffff',
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 8px 32px rgba(0, 188, 212, 0.3)',
      backdropFilter: 'blur(16px)',
      maxWidth: '400px',
      minWidth: '300px',
      margin: '8px 0',
      position: 'relative',
      overflow: 'hidden'
    };

    switch (type) {
      case 'xp':
        return {
          ...baseStyles,
          border: '2px solid #00ff88',
          boxShadow: '0 8px 32px rgba(0, 255, 136, 0.5), 0 0 20px rgba(0, 255, 136, 0.3)',
          background: 'linear-gradient(135deg, rgba(0, 40, 20, 0.95) 0%, rgba(0, 60, 30, 0.95) 100%)',
          animation: 'xpPulse 0.6s ease-out'
        };
      case 'level-up':
        return {
          ...baseStyles,
          border: '3px solid #ffd700',
          boxShadow: '0 12px 40px rgba(255, 215, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.4)',
          background: 'linear-gradient(135deg, rgba(60, 45, 0, 0.95) 0%, rgba(80, 60, 0, 0.95) 100%)',
          fontSize: '16px',
          fontWeight: '600',
          animation: 'levelUpPulse 1.2s ease-out'
        };
      case 'badge':
        return {
          ...baseStyles,
          border: '2px solid #ff00ff',
          boxShadow: '0 8px 32px rgba(255, 0, 255, 0.5), 0 0 20px rgba(255, 0, 255, 0.3)',
          background: 'linear-gradient(135deg, rgba(40, 0, 40, 0.95) 0%, rgba(60, 0, 60, 0.95) 100%)',
          animation: 'badgeUnlock 0.8s ease-out'
        };
      case 'upload':
      case 'quest':
        return {
          ...baseStyles,
          border: '2px solid #00bcd4',
          boxShadow: '0 8px 32px rgba(0, 188, 212, 0.4)',
          background: 'linear-gradient(135deg, rgba(0, 30, 40, 0.95) 0%, rgba(0, 40, 50, 0.95) 100%)'
        };
      case 'signal-unlock':
      case 'beacon-unlock':
        return {
          ...baseStyles,
          border: '2px solid #00ff88',
          boxShadow: '0 8px 32px rgba(0, 255, 136, 0.4)',
          background: 'linear-gradient(135deg, rgba(0, 20, 20, 0.95) 0%, rgba(0, 40, 30, 0.95) 100%)'
        };
      default:
        return baseStyles;
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end'
    }}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
          styles={getToastStyles(toast.type)}
          icon={toast.icon || getToastIcon(toast.type)}
        />
      ))}
    </div>
  );
};

const Toast = ({ toast, onRemove, styles, icon }) => {
  return (
    <div
      className="toast-item"
      style={styles}
    >
      {/* Animated Background Glow */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(45deg, 
          transparent 0%, 
          rgba(0, 188, 212, 0.1) 25%, 
          transparent 50%, 
          rgba(0, 188, 212, 0.1) 75%, 
          transparent 100%)`,
        animation: 'toastShimmer 2s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      {/* Content */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'relative',
        zIndex: 1
      }}>
        {icon && (
          <div style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {icon}
          </div>
        )}
        
        <div style={{
          flex: 1,
          lineHeight: '1.4'
        }}>
          {toast.message}
        </div>
        
        <button
          onClick={() => onRemove(toast.id)}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.target.style.color = 'rgba(255, 255, 255, 0.6)';
          }}
        >
          <X size={16} />
        </button>
      </div>

      <style>{`
        .toast-item {
          animation: toastSlideIn 0.3s ease-out;
        }
        
        @keyframes toastSlideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes toastShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes xpPulse {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes levelUpPulse {
          0% { transform: scale(0.7) rotateY(-10deg); opacity: 0; }
          30% { transform: scale(1.1) rotateY(5deg); }
          60% { transform: scale(0.95) rotateY(-2deg); }
          100% { transform: scale(1) rotateY(0deg); opacity: 1; }
        }
        
        @keyframes badgeUnlock {
          0% { transform: scale(0.6) rotateZ(-15deg); opacity: 0; }
          40% { transform: scale(1.15) rotateZ(5deg); }
          70% { transform: scale(0.9) rotateZ(-2deg); }
          100% { transform: scale(1) rotateZ(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

