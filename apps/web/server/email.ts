import { MailService } from '@sendgrid/mail';
import { VaultItemType } from '@shared/vault';
import { storage } from './storage';
import { encrypt, generateItemId } from './crypto';
import { User } from '@shared/schema';

// Initialize SendGrid
const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY || '');

/**
 * Send an email notification
 */
export async function sendEmail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
  try {
    await mailService.send({
      to,
      from: 'noreply@fsnnetwork.com', // Replace with your verified sender
      subject,
      text,
      html: html || text,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Process an incoming email to store file attachments in a user's vault
 */
export async function processIncomingEmail(
  fsnName: string, 
  senderEmail: string, 
  subject: string,
  attachments: { filename: string, content: string, contentType: string }[]
): Promise<{ success: boolean, message: string }> {
  try {
    // Lookup the user by FSN name
    const domain = await storage.getFsnDomain(fsnName);
    
    if (!domain || domain.status !== 'registered') {
      return { 
        success: false, 
        message: `FSN name ${fsnName} is not registered or does not exist` 
      };
    }
    
    // Use ownerId instead of userId
    const userId = domain.ownerId;
    
    if (!userId) {
      return {
        success: false,
        message: `No owner found for ${fsnName}`
      };
    }
    
    // No attachments case
    if (!attachments || attachments.length === 0) {
      return {
        success: false,
        message: 'No file attachments found in the email'
      };
    }
    
    // Store each attachment in the user's vault
    const results = await Promise.all(attachments.map(async (attachment) => {
      try {
        // Standard password for vault access
        const password = "fsn-vault-access";
        
        // Create data object for storage
        const data = {
          filename: attachment.filename,
          content: attachment.content, // Base64 content
          contentType: attachment.contentType,
          source: 'email',
          senderEmail,
          receivedDate: new Date().toISOString()
        };
        
        // Encrypt the data
        const encryptedData = encrypt(JSON.stringify(data), password);
        
        // Generate a unique ID for this vault item
        const itemId = generateItemId();
        
        // Store in vault
        await storage.createVaultItem({
          itemId,
          userId,
          fsnName,
          itemType: VaultItemType.SIGNED_MESSAGE,
          data: encryptedData
        });
        
        return { success: true, filename: attachment.filename };
      } catch (err) {
        console.error('Error storing attachment:', err);
        return { success: false, filename: attachment.filename, error: err };
      }
    }));
    
    // Count successes
    const successCount = results.filter(r => r.success).length;
    
    // Send notification to the user about received files
    const userNotificationResult = await notifyUserAboutReceivedFiles(
      userId,
      fsnName,
      senderEmail,
      results
    );
    
    if (successCount === 0) {
      return {
        success: false,
        message: 'Failed to store any attachments in the vault'
      };
    }
    
    return {
      success: true,
      message: `Successfully stored ${successCount} of ${attachments.length} files in ${fsnName}'s vault`
    };
    
  } catch (error) {
    console.error('Error processing incoming email:', error);
    return {
      success: false,
      message: 'Error processing the email: ' + (error as Error).message
    };
  }
}

/**
 * Notify a user about files they received via email
 */
async function notifyUserAboutReceivedFiles(
  userId: number,
  fsnName: string,
  senderEmail: string,
  results: { success: boolean, filename: string, error?: any }[]
): Promise<boolean> {
  try {
    // Get user email
    const user = await storage.getUser(userId);
    if (!user || !user.email) {
      console.error('Cannot notify user - no email address found');
      return false;
    }
    
    const successfulFiles = results.filter(r => r.success).map(r => r.filename);
    const failedFiles = results.filter(r => !r.success).map(r => r.filename);
    
    // Create email content
    const subject = `New files received in your FSN vault`;
    
    const text = 
`Hello ${fsnName},

You have received new files in your FSN vault from ${senderEmail}.

${successfulFiles.length > 0 ? `Successfully stored files:\n${successfulFiles.map(f => `- ${f}`).join('\n')}` : ''}
${failedFiles.length > 0 ? `\nFiles that could not be stored:\n${failedFiles.map(f => `- ${f}`).join('\n')}` : ''}

You can access these files in your vault at any time.

FreeSpace Network
`;

    const html = 
`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #0086ff;">New files received in your FSN vault</h2>
  <p>Hello ${fsnName},</p>
  <p>You have received new files in your FSN vault from <strong>${senderEmail}</strong>.</p>
  
  ${successfulFiles.length > 0 ? 
    `<h3 style="color: #0086ff;">Successfully stored files:</h3>
    <ul>${successfulFiles.map(f => `<li>${f}</li>`).join('')}</ul>` : ''}
  
  ${failedFiles.length > 0 ? 
    `<h3 style="color: #ff3300;">Files that could not be stored:</h3>
    <ul>${failedFiles.map(f => `<li>${f}</li>`).join('')}</ul>` : ''}
  
  <p>You can access these files in your vault at any time.</p>
  <p style="margin-top: 30px; color: #666;">FreeSpace Network</p>
</div>`;
    
    const emailResult = await sendEmail(user.email, subject, text, html);
    return emailResult;
    
  } catch (error) {
    console.error('Error notifying user about received files:', error);
    return false;
  }
}