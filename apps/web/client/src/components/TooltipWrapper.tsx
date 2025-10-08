import React, { useState } from 'react';

interface TooltipWrapperProps {
  children: React.ReactNode;
  tooltip: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const TooltipWrapper: React.FC<TooltipWrapperProps> = ({ 
  children, 
  tooltip, 
  position = 'top' 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getTooltipPosition = () => {
    switch (position) {
      case 'bottom':
        return {
          top: '125%',
          left: '50%',
          transform: 'translateX(-50%)'
        };
      case 'left':
        return {
          top: '50%',
          right: '125%',
          transform: 'translateY(-50%)'
        };
      case 'right':
        return {
          top: '50%',
          left: '125%',
          transform: 'translateY(-50%)'
        };
      default: // top
        return {
          bottom: '125%',
          left: '50%',
          transform: 'translateX(-50%)'
        };
    }
  };

  return (
    <span 
      className="tooltip-wrapper"
      style={{
        position: 'relative',
        display: 'inline-block'
      }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <span 
          className="tooltip-text"
          style={{
            visibility: 'visible',
            backgroundColor: '#222',
            color: '#0ff',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            position: 'absolute',
            zIndex: 10,
            whiteSpace: 'nowrap',
            opacity: 1,
            transition: 'opacity 0.3s ease-in-out',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            boxShadow: '0 0 10px rgba(0, 255, 255, 0.2)',
            fontFamily: 'Inter, sans-serif',
            ...getTooltipPosition()
          }}
        >
          {tooltip}
        </span>
      )}
    </span>
  );
};

export default TooltipWrapper;