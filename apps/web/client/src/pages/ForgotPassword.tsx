import React, { useState } from 'react';
import { useLocation } from 'wouter';
import SharedNetworkAnimation from "@/components/SharedNetworkAnimation";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import "../styles/password-reset.css";

/**
 * Super Simple Password Recovery
 */
const ForgotPassword: React.FC = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState("");
  
  // Simple password reset handler
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !email.includes('@')) {
      alert("Please enter a valid email address");
      return;
    }
    
    setLoading(true);
    
    try {
      // Try to send reset email
      const response = await fetch('/api/user/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          fsnName: 'demo' // Use demo mode for reliable testing
        })
      });
      
      const data = await response.json();
      
      // Show direct reset link in development mode
      if (data.debug && data.debug.token) {
        setToken(data.debug.token);
        toast({
          title: "Reset link generated",
          description: "Click the button below to reset password"
        });
      } else {
        // Show success message
        setSuccess(true);
        toast({
          title: "Email sent",
          description: "If your email is registered, a reset link has been sent"
        });
      }
    } catch (error) {
      console.error("Reset error:", error);
      toast({
        title: "Error",
        description: "Could not process request, please try again"
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (success) {
    return (
      <div className="forgot-password-page">
        <Navigation />
        <SharedNetworkAnimation className="network-background" />
        <div className="auth-container">
          <h1>Email Sent</h1>
          <p>Check your inbox for password reset instructions.</p>
          <Button onClick={() => setLocation('/login')} className="primary-button mt-4">
            Return to Login
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="forgot-password-page">
      <Navigation />
      <SharedNetworkAnimation className="network-background" />
      
      <div className="auth-container">
        <h1>Reset Password</h1>
        
        <form onSubmit={handleReset} className="auth-form">
          <div className="form-group">
            <Input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              disabled={loading}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={loading} 
            className="primary-button mt-4 w-full"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
          
          {token && (
            <Button 
              type="button"
              onClick={() => setLocation(`/reset-password?token=${token}`)}
              className="primary-button mt-4 w-full"
              style={{ backgroundColor: '#2563eb' }}
            >
              Use Reset Link (Dev Mode)
            </Button>
          )}
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setLocation("/login")}
            disabled={loading}
            className="secondary-button mt-4 w-full"
          >
            Back to Login
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;