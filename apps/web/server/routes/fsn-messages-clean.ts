import type { Request, Response } from 'express';
import { storage } from '../storage';

// Clean, working version of AI agent message handling
export async function handleAIAgentMessage(req: Request, res: Response) {
  try {
    const { toFsn, fromFsn, message: rawMessage, userId } = req.body;
    
    if (!toFsn || !fromFsn || !rawMessage || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: toFsn, fromFsn, message, userId' 
      });
    }

    const sanitizedMessage = rawMessage.trim();
    const messageText = sanitizedMessage.toLowerCase();
    let responseText = '';
    let xpGranted = 0;

    // Handle AI agents with simple responses
    if (toFsn === 'ghost') {
      if (messageText.includes('challenge')) {
        responseText = `🔮 Challenge accepted! Here's your encrypted message: U2VjcmV0IE1lc3NhZ2U6IFlvdSBmb3VuZCB0aGUgaGlkZGVuIGNvZGUhICs1MFRY`;
        xpGranted = 25;
      } else if (messageText.includes('echo')) {
        responseText = `👻 Echo: ${sanitizedMessage} ...but reversed in the digital void.`;
        xpGranted = 5;
      } else {
        responseText = `👻 *whispers from the shadows* I see you, ${fromFsn}. Say 'challenge' for a puzzle, or 'echo' to hear your voice in the void.`;
      }
    } else if (toFsn === 'core') {
      if (messageText.includes('quest') || messageText.includes('adventure')) {
        responseText = `🔵 Welcome to FSN Quest! Type 'help' for commands or 'start' to begin your adventure.`;
        xpGranted = 10;
      } else {
        responseText = `🔵 Hello ${fromFsn}! I'm core.fsn, your guide. Type 'quest' to start an adventure or 'help' for assistance.`;
      }
    } else if (toFsn === 'vault') {
      responseText = `🔒 I'm vault.fsn! Type 'status' to check your XP or 'balance' to see your inventory.`;
    } else if (toFsn === 'forge') {
      responseText = `⚡ I'm forge.fsn! Type 'shop' to see available upgrades and customizations.`;
    } else if (toFsn === 'echo') {
      responseText = `📝 I'm echo.fsn! Type 'journal' to start documenting your FSN journey.`;
    } else {
      responseText = `Hello ${fromFsn}! I'm ${toFsn}.fsn. How can I help you today?`;
    }

    // Grant XP if earned
    if (xpGranted > 0) {
      await storage.addUserXP(userId, xpGranted);
    }

    // Store the AI response message in database
    const agentMessage = await storage.storeMessage({
      fromFsn: `${toFsn}.fsn`,
      toFsn: fromFsn,
      message: responseText,
      timestamp: new Date().toISOString(),
      isRead: false
    });

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