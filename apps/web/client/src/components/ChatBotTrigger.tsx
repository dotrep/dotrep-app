// ChatBot Trigger Button - Task 11
// Floating action button to open the FSN chatbot

import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Bot } from 'lucide-react';
import { useChatBot } from '../hooks/useChatBot';

interface ChatBotTriggerProps {
  className?: string;
}

export const ChatBotTrigger: React.FC<ChatBotTriggerProps> = ({ className }) => {
  const { toggleChat, hasNewMessage } = useChatBot();

  return (
    <Button
      onClick={toggleChat}
      className={`
        fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full
        bg-gradient-to-r from-cyan-600 to-blue-600 
        hover:from-cyan-700 hover:to-blue-700
        shadow-lg hover:shadow-xl
        border-2 border-cyan-400/50
        transition-all duration-200
        ${hasNewMessage ? 'animate-bounce' : ''}
        ${className}
      `}
      size="lg"
    >
      <div className="relative">
        <Bot className="w-6 h-6 text-white" />
        {hasNewMessage && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </div>
    </Button>
  );
};

export default ChatBotTrigger;