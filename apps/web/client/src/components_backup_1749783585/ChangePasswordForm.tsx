import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ChangePasswordFormProps {
  userId: number;
  onSuccess?: () => void;
}

/**
 * Change Password Form Component
 * Allows logged-in users to change their password
 */
const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ userId, onSuccess }) => {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!currentPassword) {
      toast({
        title: "Current password required",
        description: "Please enter your current password",
        variant: "destructive"
      });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "New password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation don't match",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/user/password/change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Password updated",
          description: "Your password has been successfully changed"
        });
        
        // Clear form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to change password",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Password change error:", error);
      toast({
        title: "Error",
        description: "An error occurred while changing your password",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-form">
      <h3>Change Your Password</h3>
      <p className="form-description">Update your password to keep your account secure</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <Label htmlFor="currentPassword">Current Password</Label>
          <div className="password-input-container">
            <Input
              id="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              disabled={loading}
              required
            />
            <button 
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              tabIndex={-1}
            >
              <span className={`pwd-toggle-icon ${showCurrentPassword ? 'show' : 'hide'}`}>
                <span className="show-text">HIDE</span>
                <span className="hide-text">SHOW</span>
              </span>
            </button>
          </div>
        </div>
        
        <div className="form-group">
          <Label htmlFor="newPassword">New Password</Label>
          <div className="password-input-container">
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter your new password"
              disabled={loading}
              required
            />
            <button 
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowNewPassword(!showNewPassword)}
              tabIndex={-1}
            >
              <span className={`pwd-toggle-icon ${showNewPassword ? 'show' : 'hide'}`}>
                <span className="show-text">HIDE</span>
                <span className="hide-text">SHOW</span>
              </span>
            </button>
          </div>
          <p className="password-requirements">
            Password must be at least 8 characters long.
          </p>
        </div>
        
        <div className="form-group">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type={showNewPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your new password"
            disabled={loading}
            required
          />
        </div>
        
        <Button
          type="submit"
          disabled={loading}
          className="submit-button"
        >
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </div>
  );
};

export default ChangePasswordForm;