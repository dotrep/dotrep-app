import React, { useRef, useEffect, useState } from 'react';

interface CrossBrowserInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  maxLength?: number;
}

/**
 * A specialized cross-browser compatible input component
 * with special handling for Mobile Safari
 */
const CrossBrowserInput: React.FC<CrossBrowserInputProps> = ({
  value,
  onChange,
  onKeyDown,
  placeholder = "Enter your name",
  maxLength = 16
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSafari, setIsSafari] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect browser and device type on mount
  useEffect(() => {
    // Detect Safari
    const isSafariCheck = 
      /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
      /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // Detect mobile devices
    const isMobileCheck = 
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    setIsSafari(isSafariCheck);
    setIsMobile(isMobileCheck);
    
    // Focus the input after a delay on mobile devices
    if (isMobileCheck && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, []);

  return (
    <div className={`cross-browser-input-container ${isSafari ? 'safari' : ''} ${isMobile ? 'mobile' : ''}`}>
      <input
        ref={inputRef}
        type="text"
        className="cross-browser-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        maxLength={maxLength}
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        style={isSafari ? {
          // Special inline styles for Safari
          WebkitAppearance: 'none',
          WebkitTextFillColor: '#00f0ff',
          backgroundColor: 'rgba(0, 240, 255, 0.05)',
          borderRadius: '30px',
          width: '100%',
          height: '58px',
          border: '2px solid #00f0ff',
          color: '#00f0ff',
          fontSize: '18px',
          padding: '0 70px 0 20px',
          outline: 'none',
          boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)'
        } : {}}
      />
      <span className="cross-browser-suffix">.fsn</span>
    </div>
  );
};

export default CrossBrowserInput;