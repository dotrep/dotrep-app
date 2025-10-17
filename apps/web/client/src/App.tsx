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
import { SignedInHeader } from "@/components/SignedInHeader";
// @ts-ignore
import { XPProvider } from "./context/XPContext";
// @ts-ignore  
import { ShopProvider } from "./context/ShopContext";
import { useState, useRef, useEffect } from "react";
import "./styles/universal-background.css";
import "./styles/tokens.css";
import "./styles/theme-helpers.css";
import { errorHandler } from "./lib/errorHandler";
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
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import "./styles/dashboard-extensions.css";
import "./styles/debug-panel.css";

// ✅ import the wallet explorer
import WalletExplorer from "./wallet";

const AdminProtectedRoute = ({ component: Component, ...rest }: any) => {
  const isAdminLoggedIn = localStorage.getItem("fsn_admin_logged_in") === "true";
  if (!isAdminLoggedIn) return <Redirect to="/admin-login" />;
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
      {/* ✅ add a route for the wallet explorer */}
      <Route path="/wallet" component={WalletExplorer} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route component={NotFound} />
    </Switch>
  );
}

/* --- Chat Components (unchanged) --- */
const ChatMessages = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm Core.fsn, your AI guide for the FreeSpace Network. What would you like to know?",
      timestamp: Date.now(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    const userMessage = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);

    const newUserMessage = {
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    try {
      const chatMessages = [
        {
          role: "system",
          content:
            "You are Core.fsn, the helpful AI assistant for the FreeSpace Network (FSN) platform.",
        },
        ...messages.map((msg) => ({ role: msg.role, content: msg.content })),
        { role: "user", content: userMessage },
      ];

      const response = await fetch("/api/chat/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatMessages }),
      });

      const data = await response.json();
      if (data.success && data.message) {
        const aiMessage = {
          role: "assistant",
          content: data.message,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || "No response");
      }
    } catch (error) {
      const errorMessage = {
        role: "assistant",
        content:
          "I'm having trouble responding right now. Please try again soon.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                m.role === "user"
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-800 text-gray-200"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask Core.fsn anything..."
          disabled={isLoading}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none text-sm"
        />
        <button
          onClick={sendMessage}
          disabled={!inputMessage.trim() || isLoading}
          className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white px-3 py-2 rounded-lg transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
};

const ChatIntegration = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 shadow-lg flex items-center justify-center"
        >
          💬
        </button>
      )}
      {isOpen && (
        <div className="fixed bottom-4 right-4 w-96 h-[500px] z-50 bg-gray-900 border border-cyan-500 rounded-lg shadow-2xl">
          <div className="p-4 flex justify-between items-center border-b border-cyan-500">
            <span className="text-cyan-400 font-semibold">Core.fsn</span>
            <button onClick={() => setIsOpen(false)}>✖</button>
          </div>
          <div className="p-4 h-[430px] overflow-auto">
            <ChatMessages />
          </div>
        </div>
      )}
    </>
  );
};

function App() {
  React.useEffect(() => {
    errorHandler.addListener((err) => console.warn("Global error handled:", err));
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
                      <SignedInHeader />
                      <Router />
                      {/* ✅ Wallet explorer visible anywhere */}
                      <WalletExplorer />
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

