/**
 * Welcome email module for new FSN users
 */
import { User } from '@shared/schema';
import { sendEmail } from './email';

/**
 * Send a welcome email to a new user
 * 
 * @param user The user object
 * @param fsnName The user's FSN name (without .fsn)
 */
export async function sendWelcomeEmail(user: User, fsnName: string): Promise<boolean> {
  if (!user.email) {
    console.log('Cannot send welcome email: user has no email address');
    return false;
  }

  const subject = `Welcome to FreeSpace Network, ${fsnName}.fsn!`;
  
  const text = `
Welcome to FreeSpace Network!

Your FSN identity ${fsnName}.fsn has been successfully claimed.

With your new FSN identity, you can:
- Store encrypted files in your personal vault
- Send and receive messages from other FSN users
- Interact with our AI agents for special quests and rewards
- Earn XP for activities across the FreeSpace Network
- Use your FSN name as a universal identifier across our ecosystem

To get started, explore the dashboard and discover the features of your FSN identity.

If you have any questions, you can message core.fsn directly from your messaging tab.

Welcome to the network!

The FreeSpace Network Team
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      color: #333;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }
    .content {
      padding: 20px 0;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #999;
    }
    .highlight {
      color: #0066cc;
      font-weight: bold;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to FreeSpace Network!</h1>
    </div>
    <div class="content">
      <p>Your FSN identity <span class="highlight">${fsnName}.fsn</span> has been successfully claimed.</p>
      
      <p>With your new FSN identity, you can:</p>
      <ul>
        <li>Store encrypted files in your personal vault</li>
        <li>Send and receive messages from other FSN users</li>
        <li>Interact with our AI agents for special quests and rewards</li>
        <li>Earn XP for activities across the FreeSpace Network</li>
        <li>Use your FSN name as a universal identifier across our ecosystem</li>
      </ul>
      
      <p>To get started, explore the dashboard and discover the features of your FSN identity.</p>
      
      <p>If you have any questions, you can message <span class="highlight">core.fsn</span> directly from your messaging tab.</p>
      
      <p><strong>Welcome to the network!</strong></p>
    </div>
    <div class="footer">
      <p>The FreeSpace Network Team</p>
    </div>
  </div>
</body>
</html>
`;

  return await sendEmail(user.email, subject, text, html);
}