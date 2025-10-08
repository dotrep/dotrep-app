// ChatBot Hook - Task 11
// React hook for managing chatbot state and interactions

import { useState, useCallback } from 'react';

interface ChatBotState {
  isOpen: boolean;
  hasNewMessage: boolean;
  messageCount: number;
  minimized: boolean;
}

export const useChatBot = () => {
  const [state, setState] = useState<ChatBotState>({
    isOpen: false,
    hasNewMessage: false,
    messageCount: 0,
    minimized: false
  });

  const openChat = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: true,
      hasNewMessage: false
    }));
  }, []);

  const closeChat = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  const toggleChat = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: !prev.isOpen,
      hasNewMessage: prev.isOpen ? prev.hasNewMessage : false
    }));
  }, []);

  const markNewMessage = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasNewMessage: !prev.isOpen,
      messageCount: prev.messageCount + 1
    }));
  }, []);

  const clearNotifications = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasNewMessage: false
    }));
  }, []);

  const toggleMinimize = useCallback(() => {
    setState(prev => ({
      ...prev,
      minimized: !prev.minimized
    }));
  }, []);

  const setMinimized = useCallback((minimized: boolean) => {
    setState(prev => ({
      ...prev,
      minimized
    }));
  }, []);

  return {
    ...state,
    openChat,
    closeChat,
    toggleChat,
    markNewMessage,
    clearNotifications,
    toggleMinimize,
    setMinimized
  };
};

export default useChatBot;