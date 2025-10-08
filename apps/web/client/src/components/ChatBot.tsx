// FSN ChatBot Component - Task 12: Complete Chat UI
// Full-featured chat interface with textbox, send button, and message thread

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Send, Bot, User, Loader2, X, Minimize2, Maximize2 } from 'lucide-react';
import { sendChatMessage, createFSNChat, addUserMessage, addAssistantMessage, getChatUserId } from '../lib/chatWithAI';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  minimized?: boolean;
  onToggleMinimize?: () => void;
}

export const ChatBot: React.FC<ChatBotProps> = ({ 
  isOpen, 
  onClose, 
  className,
  minimized = false,
  onToggleMinimize 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const userId = getChatUserId();
    return createFSNChat(userId);
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setError(null);

    // Add user message to chat
    const updatedHistory = addUserMessage(messages, userMessage);
    setMessages(updatedHistory);
    setIsLoading(true);

    try {
      console.log('📤 Sending chat message:', { userMessage, historyLength: updatedHistory.length });
      
      // Send to OpenAI
      const response = await sendChatMessage(updatedHistory);
      
      if (response.success && response.message) {
        // Add assistant response to chat
        const finalHistory = addAssistantMessage(updatedHistory, response.message);
        setMessages(finalHistory);
        
        console.log('✅ Chat response received:', { responseLength: response.message.length });
      } else {
        throw new Error(response.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('❌ Chat error:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      
      // Add error message to chat
      const errorHistory = addAssistantMessage(
        updatedHistory, 
        "I'm sorry, I'm having trouble responding right now. Please try again in a moment."
      );
      setMessages(errorHistory);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const displayMessages = messages.filter(msg => msg.role !== 'system');

  if (!isOpen) return null;

  // Minimized state
  if (minimized) {
    return (
      <div className={`fixed bottom-4 right-4 w-80 z-50 ${className}`}>
        <Card className="bg-gray-900/95 border-cyan-500/30 shadow-xl backdrop-blur-sm">
          <CardHeader className="pb-2 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-cyan-400" />
                <CardTitle className="text-cyan-400 text-sm">Core.fsn</CardTitle>
                {isLoading && <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />}
              </div>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleMinimize}
                  className="text-gray-400 hover:text-white hover:bg-gray-800 h-6 w-6 p-0"
                >
                  <Maximize2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-400 hover:text-white hover:bg-gray-800 h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 w-96 h-[500px] z-50 ${className}`}>
      <Card className="h-full bg-gray-900/95 border-cyan-500/30 shadow-2xl backdrop-blur-sm">
        <CardHeader className="pb-3 border-b border-cyan-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-cyan-400" />
              <CardTitle className="text-cyan-400 text-sm">Core.fsn Assistant</CardTitle>
            </div>
            <div className="flex space-x-1">
              {onToggleMinimize && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleMinimize}
                  className="text-gray-400 hover:text-white hover:bg-gray-800 h-6 w-6 p-0"
                >
                  <Minimize2 className="w-3 h-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-white hover:bg-gray-800 h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Your AI guide for the FreeSpace Network
          </p>
        </CardHeader>
        
        <CardContent className="p-0 flex flex-col h-[calc(100%-80px)]">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {displayMessages.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <Bot className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
                  <p className="text-sm">
                    Hi! I'm Core.fsn, your FSN assistant.
                    <br />
                    How can I help you today?
                  </p>
                </div>
              )}
              
              {displayMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-cyan-600 text-white ml-auto'
                        : 'bg-gray-800 text-gray-200'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.role === 'assistant' && (
                        <Bot className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                      )}
                      {message.role === 'user' && (
                        <User className="w-4 h-4 text-cyan-200 mt-0.5 flex-shrink-0 order-2" />
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
                      <Bot className="w-4 h-4 text-cyan-400" />
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                      <span className="text-sm text-gray-400">Core.fsn is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          {/* Input Area */}
          <div className="p-4 border-t border-cyan-500/20">
            {error && (
              <div className="mb-2 text-xs text-red-400 bg-red-900/20 p-2 rounded">
                {error}
              </div>
            )}
            
            <div className="flex space-x-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Core.fsn anything about FSN..."
                disabled={isLoading}
                className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-cyan-500"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="sm"
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-3"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatBot;