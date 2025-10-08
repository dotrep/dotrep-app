import React, { useEffect } from 'react';

interface ClaimButtonProps {
  onClick: () => void;
}

const ClaimButton: React.FC<ClaimButtonProps> = ({ onClick }) => {
  // Function to guarantee the click is handled with multiple approaches
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("ClaimButton clicked via onClick event");
    
    // Call the provided onClick handler
    onClick();
  };

  // Use useEffect to ensure the button is properly registered with event listeners
  useEffect(() => {
    // Get the button element after it's rendered
    const buttonElement = document.getElementById('claimBtn');
    
    if (buttonElement) {
      // Add a redundant event listener to ensure clicks are captured
      const clickHandler = () => {
        console.log("ClaimButton clicked via direct event listener");
        onClick();
      };
      
      buttonElement.addEventListener('click', clickHandler);
      
      return () => {
        // Clean up the event listener on unmount
        buttonElement.removeEventListener('click', clickHandler);
      };
    }
  }, [onClick]);

  return (
    <button 
      id="claimBtn" 
      className="cta"
      onClick={handleClick}
      style={{
        position: 'relative',
        zIndex: 100,
        marginTop: '10px',
        cursor: 'pointer',
        pointerEvents: 'auto',
        userSelect: 'none', // Prevent text selection
        WebkitTapHighlightColor: 'transparent', // Remove tap highlight on mobile
      }}
    >
      Claim your .fsn name
    </button>
  );
};

export default ClaimButton;