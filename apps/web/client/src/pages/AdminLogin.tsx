import React, { useState } from "react";
import { useLocation } from "wouter";
import SharedNetworkAnimation from "@/components/SharedNetworkAnimation";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

/**
 * Admin Login Page
 * A secure login page specifically for the admin dashboard
 */
const AdminLogin: React.FC = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!username || !password) {
      toast({
        title: "Missing credentials",
        description: "Please enter both username and password",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // This is a simple check for demo purposes
      // In a real app, you would make an API call to verify credentials
      if (username === "admin" && password === "fsnadmin123") {
        // Store admin session info in localStorage
        localStorage.setItem("fsn_admin_logged_in", "true");
        
        toast({
          title: "Login successful",
          description: "Welcome to the admin dashboard",
        });
        
        // Redirect to admin dashboard
        setLocation("/admin");
      } else {
        toast({
          title: "Login failed",
          description: "Invalid username or password",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login error",
        description: "An error occurred during login",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <Navigation />
      <SharedNetworkAnimation className="network-background" />
      
      <div className="admin-login-container">
        <h1>FSN Admin Login</h1>
        <p>Please enter your credentials to access the admin dashboard</p>
        
        <form onSubmit={handleLogin} className="admin-login-form">
          <div className="form-group">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter admin username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="admin-input"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="admin-input"
              disabled={loading}
            />
          </div>
          
          <div className="login-actions">
            <Button type="submit" disabled={loading} className="login-button">
              {loading ? "Logging in..." : "Login"}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setLocation("/")}
              disabled={loading}
              className="cancel-button"
            >
              Cancel
            </Button>
          </div>
        </form>
        
        <div className="login-help">
          <p>For development use:</p>
          <p>Username: admin</p>
          <p>Password: fsnadmin123</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;