import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import SharedNetworkAnimation from "@/components/SharedNetworkAnimation";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckIcon } from "lucide-react";
import "../styles/password-reset.css";

/**
 * Reset Password Page
 * Allows users to create a new password after clicking a reset link
 */
const ResetPassword: React.FC = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState(false);
  const [validating, setValidating] = useState(true);
  const [fsnIdentity, setFsnIdentity] = useState<string | null>(null);

  // Extract token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get('token');
    setToken(resetToken);
    
    // Validate token
    if (resetToken) {
      validateToken(resetToken);
    } else {
      setValidating(false);
    }
  }, []);
  
  const validateToken = async (resetToken: string) => {
    try {
      const response = await fetch(`/api/user/password/validate-token?token=${resetToken}`);
      const data = await response.json();
      
      if (response.ok && data.valid) {
        setTokenValid(true);
      } else {
        toast({
          title: "Invalid or expired token",
          description: "This password reset link is no longer valid. Please request a new one.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Token validation error:", error);
      toast({
        title: "Error",
        description: "Could not validate the reset token",
        variant: "destructive"
      });
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Password validation
    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords match",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/user/password/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          token, 
          password 
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResetSuccess(true);
        const fsnIdentity = data.fsnIdentity || 'your account';
        toast({
          title: "Password reset successful",
          description: `Password for ${fsnIdentity} has been updated. You can now log in with your new password.`
        });
        // Store FSN identity for display
        setFsnIdentity(data.fsnIdentity);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to reset your password",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Password reset error:", error);
      toast({
        title: "Error",
        description: "An error occurred while resetting your password",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading or error state if validating or token is invalid
  if (validating) {
    return (
      <div className="reset-password-page">
        <Navigation />
        <SharedNetworkAnimation className="network-background" />
        <div className="auth-container">
          <h1>Reset Your Password</h1>
          <p className="loading-text">Validating your reset link...</p>
        </div>
      </div>
    );
  }
  
  if (!token || !tokenValid) {
    return (
      <div className="reset-password-page">
        <Navigation />
        <SharedNetworkAnimation className="network-background" />
        <div className="auth-container">
          <h1>Invalid Reset Link</h1>
          <p className="error-text">This password reset link is invalid or has expired.</p>
          <Button 
            onClick={() => setLocation('/forgot-password')}
            className="primary-button"
          >
            Request a New Link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <Navigation />
      <SharedNetworkAnimation className="network-background" />
      
      <div className="auth-container">
        <h1>Reset Your Password</h1>
        
        {resetSuccess ? (
          <div className="password-reset-card">
            <div className="success-icon">
              <CheckIcon size={50} className="success-check" color="#66fcf1" />
            </div>
            <h2>Password Reset Complete</h2>
            
            {fsnIdentity ? (
              <div className="fsn-identity-display">
                <p>Password for <span className="fsn-name">{fsnIdentity}</span> has been updated</p>
              </div>
            ) : (
              <p>Your password has been successfully updated.</p>
            )}
            
            <p>You can now log in to your account with your new password.</p>
            
            <Button 
              onClick={() => setLocation('/login')}
              className="reset-button"
            >
              Proceed to Login
            </Button>
          </div>
        ) : (
          <div className="password-reset-card">
            <h2>Create New Password</h2>
            <p>Please enter and confirm your new password below</p>
            
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <Label htmlFor="password">New Password</Label>
                <div className="password-input-container">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input"
                    disabled={loading}
                    required
                  />
                  <button 
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    <span className={`pwd-toggle-icon ${showPassword ? 'show' : 'hide'}`}>
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
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="auth-input"
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="form-actions">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="reset-button"
                >
                  {loading ? "Securing Your Account..." : "Reset Password"}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setLocation("/login")}
                  disabled={loading}
                  className="secondary-button"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;