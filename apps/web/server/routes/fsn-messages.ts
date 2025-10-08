import { Router } from 'express';
import type { Request, Response } from 'express';
import { storage } from '../storage';

const router = Router();

// Clean, working version of AI agent message handling
async function handleAIAgentMessage(req: Request, res: Response) {
  try {
    // Support both field name formats for compatibility
    const { toFsn, fromFsn, message: rawMessage, userId, to, from } = req.body;
    
    const finalTo = toFsn || to;
    const finalFrom = fromFsn || from;
    
    if (!finalTo || !finalFrom || !rawMessage) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: to/toFsn, from/fromFsn, message' 
      });
    }

    const sanitizedMessage = rawMessage.trim();
    const messageText = sanitizedMessage.toLowerCase();
    let responseText = '';
    let xpGranted = 0;

    // Handle AI agents with simple responses
    if (finalTo === 'ghost') {
      if (messageText.includes('challenge')) {
        responseText = `🔮 Challenge accepted! Here's your encrypted message: U2VjcmV0IE1lc3NhZ2U6IFlvdSBmb3VuZCB0aGUgaGlkZGVuIGNvZGUhICs1MFRY`;
        xpGranted = 25;
      } else if (messageText.includes('echo')) {
        responseText = `👻 Echo: ${sanitizedMessage} ...but reversed in the digital void.`;
        xpGranted = 5;
      } else {
        responseText = `👻 *whispers from the shadows* I see you, ${finalFrom}. Say 'challenge' for a puzzle, or 'echo' to hear your voice in the void.`;
      }
    } else if (finalTo === 'core') {
      if (messageText.includes('quest') || messageText.includes('adventure')) {
        responseText = `🔵 Welcome to FSN Quest! Type 'help' for commands or 'start' to begin your adventure.`;
        xpGranted = 10;
      } else {
        responseText = `🔵 Hello ${finalFrom}! I'm core.fsn, your guide. Type 'quest' to start an adventure or 'help' for assistance.`;
      }
    } else if (finalTo === 'vault') {
      responseText = `🔒 I'm vault.fsn! Type 'status' to check your XP or 'balance' to see your inventory.`;
    } else if (finalTo === 'forge') {
      responseText = `⚡ I'm forge.fsn! Type 'shop' to see available upgrades and customizations.`;
    } else if (finalTo === 'echo') {
      responseText = `📝 I'm echo.fsn! Type 'journal' to start documenting your FSN journey.`;
    } else {
      responseText = `Hello ${finalFrom}! I'm ${finalTo}.fsn. How can I help you today?`;
    }

    // Grant XP if earned (simplified for now)
    if (xpGranted > 0) {
      console.log(`Would grant ${xpGranted} XP to user ${userId}`);
    }

    // Store the AI response message in database (simplified for now)
    console.log(`AI Agent ${finalTo}.fsn responds: ${responseText}`);

    res.json({
      success: true,
      message: 'Message sent to AI agent successfully',
      response: responseText,
      xpGranted: xpGranted
    });

  } catch (error) {
    console.error('Error handling AI agent message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process AI agent message'
    });
  }
}

// Set up routes
router.post('/send', handleAIAgentMessage);

// Add other message routes that were in the original file
router.get('/sent/:fsnName', async (req: Request, res: Response) => {
  try {
    const { fsnName } = req.params;
    const messages = await storage.getFsnMessagesBySender(fsnName);
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching sent messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sent messages' });
  }
});

router.get('/inbox/:fsnName', async (req: Request, res: Response) => {
  try {
    const { fsnName } = req.params;
    const messages = await storage.getFsnMessagesByRecipient(fsnName);
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching inbox messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inbox messages' });
  }
});

router.put('/read/:messageId', async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    await storage.markFsnMessageAsRead(parseInt(messageId));
    res.json({ success: true, message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark message as read' });
  }
});

export default router;