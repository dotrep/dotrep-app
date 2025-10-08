/**
 * Email routes for handling incoming emails to FSN Vault
 */
import express from 'express';
import { processIncomingEmail } from '../email';
import { storage } from '../storage';

const router = express.Router();

// Route to handle incoming emails
router.post('/incoming', async (req, res) => {
  try {
    const { to, from, subject, attachments } = req.body;
    
    if (!to || !from) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required email fields' 
      });
    }
    
    // Extract FSN name from email address
    // Formats: username.fsn@fsnvault.com or username@fsn.fsnvault.com
    let fsnName = '';
    
    if (to.includes('.fsn@fsnvault.com')) {
      // Format 1: username.fsn@fsnvault.com
      fsnName = to.split('.fsn@')[0];
    } else if (to.includes('@fsn.fsnvault.com')) {
      // Format 2: username@fsn.fsnvault.com
      fsnName = to.split('@fsn.')[0];
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format for FSN vault'
      });
    }
    
    // Process the email attachments
    const result = await processIncomingEmail(
      fsnName,
      from,
      subject || 'File shared with your FSN vault',
      attachments || []
    );
    
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Error processing incoming email:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error processing incoming email'
    });
  }
});

// Route to test email functionality (development only)
router.post('/test', async (req, res) => {
  try {
    const { fsnName, testFile } = req.body;
    
    if (!fsnName || !testFile) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Create a test attachment
    const attachment = {
      filename: testFile.name || 'test-file.txt',
      content: testFile.content || 'VGhpcyBpcyBhIHRlc3QgZmlsZSBmb3IgRlNOIFZhdWx0',  // Base64 "This is a test file for FSN Vault"
      contentType: testFile.type || 'text/plain'
    };
    
    // Process the test email
    const result = await processIncomingEmail(
      fsnName,
      'test@example.com',
      'Test FSN Vault File',
      [attachment]
    );
    
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Error processing test email:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error processing test email'
    });
  }
});

export default router;