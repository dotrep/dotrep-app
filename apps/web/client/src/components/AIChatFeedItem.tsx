import { useState, useEffect, useRef } from 'react';
import { useXP } from '@/context/XPContext';
import { getBadgeById } from '@/lib/badgeSystem';
import BadgeDetailModal from './BadgeDetailModal';

interface FeedEvent {
  username: string;
  action: string;
  time: string;
  eventType: 'SIGNAL_UNLOCK' | 'QUEST_COMPLETE' | 'NFT_MINT' | 'BADGE_EARN' | 'PROFILE_UPDATE' | 'FILE_UPLOAD';
  metadata?: {
    badge?: string;
    nft?: string;
    quest?: string;
    frequency?: string;
    xpEarned?: number;
  };
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
  showProfile?: boolean;
  showBadge?: boolean;
  showXP?: boolean;
}

interface AIChatFeedItemProps {
  event: FeedEvent;
  isOpen: boolean;
  onClose: () => void;
}

const AIChatFeedItem: React.FC<AIChatFeedItemProps> = ({ event, isOpen, onClose }) => {
  const { addXP } = useXP();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get badge data if this is a badge event
  const badgeData = event.eventType === 'BADGE_EARN' && event.metadata?.badge 
    ? getBadgeById(event.metadata.badge) 
    : null;

  // System prompts for different event types
  const getSystemPrompt = (eventType: string, username: string, metadata?: any) => {
    const basePrompt = `You are the FSN Observer AI, a knowledgeable guide for the FreeSpace Network. You're analyzing activity feed event: "${eventType}" by user "${username}".`;
    
    switch (eventType) {
      case 'SIGNAL_UNLOCK':
        return `${basePrompt} You help users understand Signal functionality, frequency tuning, and progression requirements.`;
      case 'QUEST_COMPLETE':
        return `${basePrompt} You provide insights about quest rewards, progression paths, and similar available quests.`;
      case 'NFT_MINT':
        return `${basePrompt} You explain NFT forging, rarity systems, and how to mint similar items.`;
      case 'BADGE_EARN':
        return `${basePrompt} You detail badge requirements, unlock conditions, and achievement progression.`;
      case 'PROFILE_UPDATE':
        return `${basePrompt} You guide users through profile customization and social features.`;
      case 'FILE_UPLOAD':
        return `${basePrompt} You explain vault functionality, file encryption, and storage benefits.`;
      default:
        return `${basePrompt} You provide contextual help and insights about FSN platform features.`;
    }
  };

  // Generate contextual AI responses
  const generateAIResponse = async (userMessage: string, eventType: string): Promise<string> => {
    // Simulate AI thinking delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    const responses: Record<string, string[]> = {
      SIGNAL_UNLOCK: [
        `🛰️ Signal unlocking is a major milestone! ${event.username} can now tune frequencies between 0-99.99 MHz and discover hidden transmissions. Try frequencies like 7.3 MHz (FSN Core) or 13.0 MHz (Secret Broadcast) for special rewards.`,
        `The Signal system requires 70Hz Pulse minimum. Once unlocked, you can LISTEN to discover mysteries, CAST your own signals, or LOCK onto up to 3 stations simultaneously for +3 XP each.`,
        `Signal progression opens the path to Beacon activation after 3 days of active use. Start by experimenting with different frequency ranges - each has unique content!`
      ],
      QUEST_COMPLETE: [
        `🎯 Quest completion is how you build trust in FSN! ${event.username} just earned valuable XP and potentially unlocked new features. Check your Dashboard to see what new tasks are available.`,
        `Completing quests builds your Pulse score, which is essential for unlocking Signal (70Hz required) and eventually Beacon systems. Each quest type offers different rewards and progression paths.`,
        `The trust engine tracks all quest activity. Regular completion maintains your Pulse decay resistance and opens advanced features like multicast signals and premium NFT forging.`
      ],
      NFT_MINT: [
        `🔥 NFT forging combines creativity with FSN's trust system! ${event.username} created something unique that's now permanently recorded on the network. The rarity depends on current network trust levels.`,
        `Forged NFTs can be enhanced through Signal frequency tuning and Beacon amplification. Higher trust scores unlock premium materials and exclusive design elements.`,
        `Each forged NFT contributes to your collector score and can be displayed in your Social profile. Some rare combinations unlock special badges and XP multipliers!`
      ],
      BADGE_EARN: [
        `🏆 Badge achievements mark significant FSN milestones! ${event.username} demonstrated mastery in a specific area. Each badge has unique unlock conditions and provides permanent benefits.`,
        `Badges often unlock new quest lines, increase XP multipliers, or provide access to exclusive Signal frequencies. Check the requirements for similar badges you might pursue.`,
        `Some badges are time-limited or require specific network conditions. The Observer AI tracks all achievement paths and can suggest optimal progression strategies.`
      ],
      PROFILE_UPDATE: [
        `👤 Profile updates help establish your FSN identity! ${event.username} enhanced their network presence, which improves trust calculations and social discovery.`,
        `A complete profile increases your Signal range, improves quest reward rates, and makes you eligible for community features like leaderboards and collaboration tools.`,
        `Profile customization includes avatar selection, bio crafting, and achievement display. Regular updates maintain active status for Beacon eligibility.`
      ],
      FILE_UPLOAD: [
        `📁 Vault uploads demonstrate trust through secure storage! ${event.username} encrypted valuable data using FSN's quantum-resistant protocols. Each file strengthens network security.`,
        `Uploaded files contribute to your storage score and can be referenced in Signal transmissions or NFT metadata. The vault system supports multiple encryption levels and sharing permissions.`,
        `File diversity and regular uploads improve your trust profile. Consider organizing content by type: credentials, media, code, or encrypted messages for optimal network benefits.`
      ]
    };

    const eventResponses = responses[eventType] || responses.QUEST_COMPLETE;
    const randomResponse = eventResponses[Math.floor(Math.random() * eventResponses.length)];

    // Add user-specific contextual responses
    if (userMessage.toLowerCase().includes('how') || userMessage.toLowerCase().includes('unlock')) {
      return `${randomResponse}\n\n💡 To get started, focus on building your Pulse score through daily quests. Visit your Dashboard to see current tasks and progression requirements.`;
    }
    
    if (userMessage.toLowerCase().includes('xp') || userMessage.toLowerCase().includes('points')) {
      return `${randomResponse}\n\n⚡ Pro tip: Consistent daily activity prevents Pulse decay and unlocks XP multipliers. Check the XP Shop for cosmetic upgrades!`;
    }

    return randomResponse;
  };

  // Initialize conversation when opened
  useEffect(() => {
    if (isOpen && !hasInitialized) {
      const initialMessage: Message = {
        id: 'init',
        text: `🤖 FSN Observer AI analyzing activity...\n\n**${event.username}** ${event.action} ${event.time}\n\nI can help explain this activity, answer questions about ${event.eventType.toLowerCase().replace('_', ' ')}, or guide you through similar actions. What would you like to know?`,
        isUser: false,
        timestamp: Date.now()
      };
      setMessages([initialMessage]);
      setHasInitialized(true);
    }
  }, [isOpen, hasInitialized, event]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const aiResponse = await generateAIResponse(inputText, event.eventType);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: Date.now(),
        showProfile: aiResponse.includes('profile'),
        showBadge: aiResponse.includes('badge'),
        showXP: aiResponse.includes('XP')
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Award XP for AI interaction
      addXP(1, 'Asked FSN Observer AI');
    } catch (error) {
      console.error('AI response error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleReaction = (type: 'helpful' | 'question' | 'interested') => {
    const reactions = {
      helpful: '👍 Marked as helpful!',
      question: '❓ More questions? Feel free to ask!',
      interested: '⭐ Great! Check your Dashboard for similar opportunities.'
    };

    const reactionMessage: Message = {
      id: Date.now().toString(),
      text: reactions[type],
      isUser: false,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, reactionMessage]);
    addXP(1, `Reacted to feed: ${type}`);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '400px',
      height: '100vh',
      background: 'rgba(0, 10, 20, 0.95)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(0, 188, 212, 0.3)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(0, 188, 212, 0.2)',
        background: 'rgba(0, 188, 212, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <h3 style={{
            color: '#00bcd4',
            fontSize: '18px',
            fontWeight: 'bold',
            margin: 0,
            fontFamily: 'Orbitron, sans-serif'
          }}>
            FSN Observer AI
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'rgba(255, 255, 255, 0.7)',
              padding: '5px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ✕ CLOSE
          </button>
        </div>
        <div style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.8)',
          lineHeight: '1.4'
        }}>
          Analyzing: <span style={{ color: '#00bcd4', fontWeight: 'bold' }}>{event.username}</span> • {event.action}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              alignSelf: message.isUser ? 'flex-end' : 'flex-start',
              maxWidth: '85%'
            }}
          >
            <div style={{
              background: message.isUser 
                ? 'rgba(0, 188, 212, 0.2)' 
                : 'rgba(0, 20, 40, 0.8)',
              border: `1px solid ${message.isUser ? '#00bcd4' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '12px',
              padding: '12px 16px',
              color: '#fff',
              fontSize: '14px',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap'
            }}>
              {message.text}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.4)',
              marginTop: '4px',
              textAlign: message.isUser ? 'right' : 'left'
            }}>
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div style={{
            alignSelf: 'flex-start',
            maxWidth: '85%'
          }}>
            <div style={{
              background: 'rgba(0, 20, 40, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '12px 16px',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '14px',
              fontStyle: 'italic'
            }}>
              🤖 FSN Observer AI is thinking...
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Reactions */}
      <div style={{
        padding: '10px 20px',
        borderTop: '1px solid rgba(0, 188, 212, 0.1)',
        display: 'flex',
        gap: '8px',
        justifyContent: 'center'
      }}>
        {/* Badge View Button (only for badge events) */}
        {badgeData && (
          <button
            onClick={() => setBadgeModalOpen(true)}
            style={{
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              color: '#ffd700',
              padding: '6px 12px',
              borderRadius: '16px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            🏆 View Badge
          </button>
        )}
        
        {['helpful', 'question', 'interested'].map((reaction) => (
          <button
            key={reaction}
            onClick={() => handleReaction(reaction as any)}
            style={{
              background: 'rgba(0, 188, 212, 0.1)',
              border: '1px solid rgba(0, 188, 212, 0.3)',
              color: '#00bcd4',
              padding: '6px 12px',
              borderRadius: '16px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 188, 212, 0.2)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 188, 212, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {reaction === 'helpful' && '👍 Helpful'}
            {reaction === 'question' && '❓ Ask More'}
            {reaction === 'interested' && '⭐ Interested'}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid rgba(0, 188, 212, 0.2)',
        background: 'rgba(0, 188, 212, 0.05)'
      }}>
        <div style={{
          display: 'flex',
          gap: '10px'
        }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about this activity..."
            disabled={isTyping}
            style={{
              flex: 1,
              background: 'rgba(0, 20, 40, 0.8)',
              border: '1px solid rgba(0, 188, 212, 0.3)',
              borderRadius: '8px',
              padding: '10px 12px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
            style={{
              background: inputText.trim() && !isTyping 
                ? 'rgba(0, 188, 212, 0.3)' 
                : 'rgba(120, 120, 120, 0.2)',
              border: `1px solid ${inputText.trim() && !isTyping ? '#00bcd4' : 'rgba(120, 120, 120, 0.4)'}`,
              color: inputText.trim() && !isTyping ? '#00bcd4' : 'rgba(255, 255, 255, 0.4)',
              padding: '10px 16px',
              borderRadius: '8px',
              cursor: inputText.trim() && !isTyping ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            SEND
          </button>
        </div>
      </div>

      {/* Badge Detail Modal */}
      {badgeData && (
        <BadgeDetailModal
          badge={badgeData}
          isOpen={badgeModalOpen}
          onClose={() => setBadgeModalOpen(false)}
        />
      )}
    </div>
  );
};

export default AIChatFeedItem;