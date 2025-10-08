import React from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import RewardsProvider from "@/components/RewardsSystem/RewardsProvider";
import RewardsUIProvider from "@/components/RewardsUI/RewardsUIProvider";
import ThemeProvider from "@/components/ThemeProvider";
import { Web3Provider } from "@/components/Web3Provider";
// @ts-ignore
import { XPProvider } from "./context/XPContext";
// @ts-ignore  
import { ShopProvider } from "./context/ShopContext";
import { useState, useRef, useEffect } from "react";
import "./styles/universal-background.css"; // Universal FSN background template
import "./styles/tokens.css"; // FSN Design Tokens
import "./styles/theme-helpers.css"; // FSN Theme Helper Classes
import { errorHandler } from "./lib/errorHandler"; // Global error handler
import { ErrorBoundary } from "./components/ErrorBoundary";
import NotFound from "@/pages/not-found";
import LockInHomepage from "@/pages/LockInHomepage";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import FixedDashboard from "@/pages/FixedDashboard";
import Forge from "@/pages/Forge";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminLogin from "@/pages/AdminLogin";
import GhostTest from "@/pages/GhostTest";
import DebugPanel from "@/pages/DebugPanel";
import XPDashboard from "@/pages/XPDashboard";
import Picture6Dashboard from "@/pages/Picture6Dashboard";
import SimpleDashboard from "@/pages/SimpleDashboard";
import TestCircle from "@/pages/TestCircle";
import InlineCircle from "@/pages/InlineCircle";
import Picture6Layout from "@/pages/Picture6Layout";
import PerfectCircle from "@/pages/PerfectCircle";
import Dashboard from "@/pages/Dashboard";
import Vault from "@/pages/Vault";
import VaultSecure from "@/pages/VaultSecure";
import Social from "@/pages/Social";
import GameCenter from "@/pages/GameCenter";
import Leaderboard from "@/pages/Leaderboard";
import ClaimFSN from "@/pages/ClaimFSN";
import "./styles/dashboard-extensions.css";
import "./styles/debug-panel.css";

// Admin protected route component
const AdminProtectedRoute = ({ component: Component, ...rest }: any) => {
  const isAdminLoggedIn = localStorage.getItem("fsn_admin_logged_in") === "true";
  
  if (!isAdminLoggedIn) {
    return <Redirect to="/admin-login" />;
  }
  
  return <Component {...rest} />;
};

function Router() {
  return (
    <Switch>
      <Route path="/claim-fsn" component={ClaimFSN} />
      <Route path="/claim" component={ClaimFSN} />
      <Route path="/" component={LockInHomepage} />
      <Route path="/register" component={Register} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/vault" component={Vault} />
      <Route path="/vault-secure" component={VaultSecure} />
      <Route path="/social" component={Social} />
      <Route path="/game-center" component={GameCenter} />
      <Route path="/forge" component={Forge} />
      <Route path="/ghost-test" component={GhostTest} />
      <Route path="/debug" component={DebugPanel} />
      <Route path="/xp-dashboard" component={XPDashboard} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin">
        {(params) => <AdminProtectedRoute component={AdminDashboard} params={params} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

// Chat Messages Component - Task 12: Full Message Thread Implementation
const ChatMessages = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm Core.fsn, your AI guide for the FreeSpace Network. I can help you navigate FSN features, earn XP, and make the most of your digital identity. What would you like to know?",
      timestamp: Date.now()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message to thread
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Prepare messages for OpenAI API
      const chatMessages = [
        {
          role: 'system',
          content: 'You are Core.fsn, the helpful AI assistant for the FreeSpace Network (FSN) platform. Keep responses concise and helpful.'
        },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user',
          content: userMessage
        }
      ];

      // Send to OpenAI
      const response = await fetch('/api/chat/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: chatMessages }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.message) {
        // Add AI response to thread
        const aiMessage = {
          role: 'assistant',
          content: data.message,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, aiMessage]);
        
        console.log('✅ Chat response received from OpenAI');
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('❌ Chat error:', error);
      
      // Add error message to thread
      const errorMessage = {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Message Thread Display */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-800 text-gray-200'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role === 'assistant' && (
                  <div className="w-4 h-4 bg-cyan-400 rounded-full mt-0.5 flex-shrink-0" />
                )}
                {message.role === 'user' && (
                  <div className="w-4 h-4 bg-cyan-200 rounded-full mt-0.5 flex-shrink-0 order-2" />
                )}
                <div className={`text-sm ${message.role === 'user' ? 'order-1' : ''}`}>
                  {message.content}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-lg p-3 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-cyan-400 rounded-full" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                </div>
                <span className="text-sm text-gray-400">Core.fsn is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area - Textbox + Send Button */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask Core.fsn anything about FSN..."
          disabled={isLoading}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none text-sm"
        />
        <button
          onClick={sendMessage}
          disabled={!inputMessage.trim() || isLoading}
          className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

// Complete Chat Integration - Task 12
const ChatIntegration = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  
  const openChat = () => {
    setIsOpen(true);
    setMinimized(false);
  };
  
  const closeChat = () => {
    setIsOpen(false);
    setMinimized(false);
  };
  
  const toggleMinimize = () => {
    setMinimized(!minimized);
  };

  return (
    <>
      {/* Chat Trigger Button */}
      {!isOpen && (
        <button
          onClick={openChat}
          className="fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg hover:shadow-xl border-2 border-cyan-400/50 transition-all duration-200 flex items-center justify-center group"
        >
          <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
          </svg>
          
          {/* Pulse animation */}
          <div className="absolute inset-0 rounded-full bg-cyan-400/20 animate-ping" />
        </button>
      )}
      
      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 w-96 h-[500px] z-50">
          <div className="h-full bg-gray-900/95 border border-cyan-500/30 rounded-lg shadow-2xl backdrop-blur-sm flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-cyan-400 text-sm font-semibold">Core.fsn</div>
                  <div className="text-gray-400 text-xs">AI Assistant</div>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={toggleMinimize}
                  className="text-gray-400 hover:text-white hover:bg-gray-800 w-6 h-6 rounded flex items-center justify-center transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <button
                  onClick={closeChat}
                  className="text-gray-400 hover:text-white hover:bg-gray-800 w-6 h-6 rounded flex items-center justify-center transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-hidden">
              <ChatMessages />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

function App() {
  // Initialize error handler
  React.useEffect(() => {
    errorHandler.addListener((error) => {
      console.warn('Global error handled:', error);
    });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Web3Provider>
          <ThemeProvider>
            <RewardsUIProvider>
              <XPProvider>
                <ShopProvider>
                  <RewardsProvider>
                    <TooltipProvider>
                      <Toaster />
                      <Router />
                      <ChatIntegration />
                    </TooltipProvider>
                  </RewardsProvider>
                </ShopProvider>
              </XPProvider>
            </RewardsUIProvider>
          </ThemeProvider>
        </Web3Provider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
