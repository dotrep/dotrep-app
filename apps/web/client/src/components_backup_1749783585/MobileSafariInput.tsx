import React, { useRef, useEffect } from 'react';

interface MobileSafariInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder: string;
  maxLength?: number;
}

/**
 * A specialized input component that works correctly on Mobile Safari
 * Fixes the display and functionality issues on iOS devices
 */
const MobileSafariInput: React.FC<MobileSafariInputProps> = ({
  value,
  onChange,
  onKeyDown,
  placeholder,
  maxLength = 16
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus the input on mount (for iOS)
  useEffect(() => {
    if (inputRef.current) {
      // Small delay to ensure iOS keyboard appears properly
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, []);

  return (
    <div className="mobile-safari-container">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        className="mobile-safari-field"
      />
      <span className="mobile-safari-suffix">.fsn</span>
    </div>
  );
};

export default MobileSafariInput;