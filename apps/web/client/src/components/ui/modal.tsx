import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isTaken, setIsTaken] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName("");
      setIsValid(false);
      setIsTaken(false);
    }
  }, [isOpen]);

  // Validate name as user types
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setName(value);
    
    // Simple validation - letters, numbers, and hyphens only
    const isValidFormat = /^[a-z0-9-]*$/.test(value);
    setIsValid(value.length >= 3 && isValidFormat);
    
    // Reset taken status when typing
    if (isTaken) setIsTaken(false);
  };

  // Simulated check for name availability
  const checkAvailability = () => {
    if (!isValid) return;
    
    setIsChecking(true);
    
    // Simulate network request
    setTimeout(() => {
      // For demo purposes, names containing "taken" are considered unavailable
      const taken = name.includes("taken");
      setIsTaken(taken);
      setIsChecking(false);
      
      if (!taken) {
        onSubmit(name);
      }
    }, 800);
  };

  // Handle key press events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isValid && !isChecking) {
      checkAvailability();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <div className="fsn-modal-container">
        <div className="fsn-modal-header">
          <h2>Claim Your .fsn Name</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="fsn-modal-close"
          >
            <X size={18} />
          </Button>
        </div>
        
        <div className="fsn-modal-content">
          <div className="fsn-modal-input-container">
            <Label htmlFor="fsnName">Enter your desired name</Label>
            <div className="fsn-input-wrapper">
              <Input
                id="fsnName"
                placeholder="yourname"
                value={name}
                onChange={handleNameChange}
                onKeyDown={handleKeyDown}
                disabled={isChecking}
                className="fsn-name-input"
              />
              <span className="fsn-domain-suffix">.fsn</span>
            </div>
            
            {name && !isValid && (
              <p className="fsn-validation-message">
                Names must be at least 3 characters and can only contain letters, numbers, and hyphens.
              </p>
            )}
            
            {isTaken && (
              <p className="fsn-taken-message">
                This name is already taken. Please try another.
              </p>
            )}
          </div>
          
          <div className="fsn-modal-actions">
            <Button 
              onClick={checkAvailability} 
              disabled={!isValid || isChecking}
              className="fsn-submit-button"
            >
              {isChecking ? "Checking..." : "Claim Name"}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default Modal;