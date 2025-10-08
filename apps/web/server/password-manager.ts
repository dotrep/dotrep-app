/**
 * Password management utilities
 */
import crypto from 'crypto';
// Password reset functionality (temporarily disabled - schema migration in progress)
// import { User, passwordResetTokens } from '@shared/schema';
import { sendEmail } from './email';
import { db } from './db';
import { eq, and, lt } from 'drizzle-orm';

// Token expiration time (24 hours)
const TOKEN_EXPIRATION_MS = 24 * 60 * 60 * 1000;

/**
 * Generate a password reset token
 */
export async function generatePasswordResetToken(userId: number): Promise<string> {
  // Temporarily disabled during schema migration
  throw new Error('Password reset temporarily unavailable');
  /*
  // Generate a secure random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Calculate expiration time
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MS);
  
  // Store token in database
  try {
    await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt
    });
    
    return token;
  } catch (error) {
    console.error('Error storing password reset token:', error);
    throw new Error('Failed to generate password reset token');
  }
  */
}

/**
 * Validate a password reset token
 */
export async function validatePasswordResetToken(token: string): Promise<boolean> {
  try {
    // Find token in database that is not used
    const [tokenData] = await db.select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.isUsed, false)
        )
      );
    
    // If token not found, return false
    if (!tokenData) {
      return false;
    }
    
    // Check if token is expired
    const now = new Date();
    if (tokenData.expiresAt < now) {
      // Token is expired, mark it as used
      await db.update(passwordResetTokens)
        .set({ isUsed: true })
        .where(eq(passwordResetTokens.token, token));
      
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating password reset token:', error);
    return false;
  }
}

/**
 * Get user ID from token
 */
export async function getUserIdFromToken(token: string): Promise<number | null> {
  try {
    // Find token that is not used
    const [tokenData] = await db.select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.isUsed, false)
        )
      );
    
    if (!tokenData) {
      return null;
    }
    
    // Check if token is expired
    const now = new Date();
    if (tokenData.expiresAt < now) {
      // Token is expired, mark it as used
      await db.update(passwordResetTokens)
        .set({ isUsed: true })
        .where(eq(passwordResetTokens.token, token));
      
      return null;
    }
    
    return tokenData.userId;
  } catch (error) {
    console.error('Error getting user ID from token:', error);
    return null;
  }
}

/**
 * Invalidate a token (after use)
 */
export async function invalidateToken(token: string): Promise<void> {
  try {
    // Mark token as used in database
    await db.update(passwordResetTokens)
      .set({ isUsed: true })
      .where(eq(passwordResetTokens.token, token));
  } catch (error) {
    console.error('Error invalidating token:', error);
  }
}

/**
 * Send password reset email
 * 
 * Updated to support FSN-specific password resets with customizable subject and body
 */
/**
 * Send username recovery email
 * Helps users recover their FSN username when they only remember their email
 */
export async function sendUsernameRecoveryEmail(
  email: string,
  usernames: string[]
): Promise<boolean> {
  if (!email || !usernames.length) {
    console.log('Cannot send username recovery: invalid email or no usernames found');
    return false;
  }

  const baseUrl = process.env.BASE_URL || 'https://fsnvault.com';
  const loginUrl = `${baseUrl}/login`;
  
  const subject = 'Your FreeSpace Network Username Recovery';
  
  // Default text version with list of usernames
  let usernameList = '';
  usernames.forEach(name => {
    usernameList += `• ${name}\n`;
  });
  
  const text = `
Hello,

You recently requested to recover your FreeSpace Network username.
Here are the FSN identities associated with your email address:

${usernameList}

You can now use this information to log in or reset your password.

If you did not request username recovery, please ignore this email.

The FreeSpace Network Team
`;

  // HTML version with branded styling
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #fff;
      line-height: 1.6;
      background-color: #0b0c10;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #1f2833;
      border-radius: 8px;
      border: 1px solid #66fcf1;
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #66fcf1;
    }
    .content {
      padding: 20px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #66fcf1;
      color: #0b0c10;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      margin: 20px 0;
      box-shadow: 0 0 10px rgba(102, 252, 241, 0.5);
    }
    .button:hover {
      background-color: #45a29e;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #45a29e;
      font-size: 12px;
      color: #c5c6c7;
    }
    .fsn-name {
      color: #66fcf1;
      font-weight: bold;
    }
    .username-list {
      background: rgba(0,0,0,0.2);
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .username-item {
      color: #66fcf1;
      font-weight: bold;
      margin: 8px 0;
      padding-left: 20px;
      position: relative;
    }
    .username-item:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #66fcf1;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your FSN Username Recovery</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>You recently requested to recover your FSN username. Here are the FSN identities associated with your email address:</p>
      
      <div class="username-list">
        ${usernames.map(name => `<div class="username-item">${name}</div>`).join('')}
      </div>
      
      <p>You can now use this information to log in or reset your password.</p>
      
      <p style="text-align: center;">
        <a href="${loginUrl}" class="button">Go to Login</a>
      </p>
      
      <p>If you did not request username recovery, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>The FreeSpace Network Team</p>
    </div>
  </div>
</body>
</html>
`;

  try {
    return await sendEmail(email, subject, text, html);
  } catch (error) {
    console.error('Error sending username recovery email:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  customSubject?: string,
  customHTML?: string
): Promise<boolean> {
  if (!email) {
    console.log('Cannot send password reset: no email address provided');
    return false;
  }

  // Build the reset URL (if not included in the custom HTML)
  const baseUrl = process.env.BASE_URL || 'https://fsnvault.com';
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  
  const subject = customSubject || 'Reset Your FreeSpace Network Password';
  
  // Default text version
  const text = `
Hello,

You've requested to reset your password for your FreeSpace Network account.

To reset your password, please click the link below or copy and paste it into your browser:

${resetUrl}

This link will expire in 24 hours.

If you didn't request a password reset, please ignore this email or contact support if you have concerns.

The FreeSpace Network Team
`;

  // If a custom HTML template was provided, use it instead of default
  let html;
  
  if (customHTML) {
    html = customHTML;
  } else {
    // Default HTML template with FSN styling
    html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #fff;
      line-height: 1.6;
      background-color: #0b0c10;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #1f2833;
      border-radius: 8px;
      border: 1px solid #66fcf1;
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #66fcf1;
    }
    .content {
      padding: 20px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #66fcf1;
      color: #0b0c10;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      margin: 20px 0;
      box-shadow: 0 0 10px rgba(102, 252, 241, 0.5);
    }
    .button:hover {
      background-color: #45a29e;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #45a29e;
      font-size: 12px;
      color: #c5c6c7;
    }
    .fsn-name {
      color: #66fcf1;
      font-weight: bold;
    }
    .reset-url {
      color: #66fcf1;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Reset Your Password</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      
      <p>You've requested to reset your password for your FreeSpace Network account.</p>
      
      <p>To reset your password, please click the button below:</p>
      
      <p style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </p>
      
      <p>Or copy and paste this link into your browser:</p>
      <p><a href="${resetUrl}" class="reset-url">${resetUrl}</a></p>
      
      <p>This link will expire in 24 hours.</p>
      
      <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
    </div>
    <div class="footer">
      <p>The FreeSpace Network Security Team</p>
    </div>
  </div>
</body>
</html>
`;
  }

  // Use SendGrid to send the email
  try {
    return await sendEmail(email, subject, text, html);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}