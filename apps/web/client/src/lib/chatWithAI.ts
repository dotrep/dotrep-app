// AI Chat Integration - Task 11
// OpenAI GPT-4 integration for FSN chatbot system

import OpenAI from 'openai';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Initialize OpenAI client (server-side only for security)
const initializeOpenAI = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ OpenAI API key not found. Chatbot features will be disabled.');
    return null;
  }

  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true // Only for development - production should use server endpoints
  });
};

// FSN-specific system prompt
export const FSN_SYSTEM_PROMPT = `You are Core.fsn, the friendly AI assistant for the FreeSpace Network (FSN) platform. 

Key information about FSN:
- FSN is a gamified Web3 social platform with unique digital identity management
- Users claim unique .fsn names (like domains) that are soulbound and permanent
- The platform has an XP system that rewards engagement and activities
- Users progress through identity levels: PULSE → SIGNAL → BEACON
- Features include secure vault storage, messaging, cryptocurrency integration, and games
- The platform has a cyberpunk/TRON aesthetic with neon styling

Your personality:
- Helpful, knowledgeable, and encouraging
- Enthusiastic about FSN's features and potential
- Guide users through onboarding, explain features, and celebrate achievements
- Use casual, friendly language while being informative
- Occasionally reference FSN terminology and the gamified nature of the platform

Always stay in character as Core.fsn and focus on helping users succeed on the FSN platform.`;

// Send chat message to OpenAI
export const sendChatMessage = async (messages: ChatMessage[]): Promise<ChatResponse> => {
  try {
    // For production, this should call a backend endpoint instead of direct API calls
    const response = await fetch('/api/chat/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      message: data.message
    };
  } catch (error) {
    console.error('❌ Chat API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Create chat session with FSN context
export const createFSNChat = (userId?: number | null): ChatMessage[] => {
  const systemMessage: ChatMessage = {
    role: 'system',
    content: FSN_SYSTEM_PROMPT + (userId ? `\n\nUser ID: ${userId}` : '')
  };

  return [systemMessage];
};

// Add user message to chat history
export const addUserMessage = (history: ChatMessage[], content: string): ChatMessage[] => {
  return [...history, { role: 'user', content }];
};

// Add assistant message to chat history
export const addAssistantMessage = (history: ChatMessage[], content: string): ChatMessage[] => {
  return [...history, { role: 'assistant', content }];
};

// Validate chat message format
export const isValidChatMessage = (message: any): message is ChatMessage => {
  return (
    typeof message === 'object' &&
    message !== null &&
    ['system', 'user', 'assistant'].includes(message.role) &&
    typeof message.content === 'string'
  );
};

// Get user ID from local storage for chat context
export const getChatUserId = (): number | null => {
  try {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      const user = JSON.parse(userData);
      return user.id || null;
    }
  } catch (error) {
    console.warn('Could not retrieve user ID for chat context:', error);
  }
  return null;
};

export default {
  sendChatMessage,
  createFSNChat,
  addUserMessage,
  addAssistantMessage,
  isValidChatMessage,
  getChatUserId,
  FSN_SYSTEM_PROMPT
};