/**
 * Routes for user management, authentication, and password operations
 */
import express from 'express';
import { storage } from '../storage';
import { 
  generatePasswordResetToken, 
  validatePasswordResetToken,
  getUserIdFromToken, 
  invalidateToken,
  sendPasswordResetEmail,
  sendUsernameRecoveryEmail
} from '../password-manager';
import { sendWelcomeEmail } from '../welcome-email';
import { User } from '@shared/schema';
import { sendEmail } from '../email';
import { TrustEngine } from '../trustEngine';
import { sendVerificationEmail } from '../emailService';

const router = express.Router();

/**
 * Send email verification code
 */
router.post('/verify/email', async (req, res) => {
  try {
    const { userId, email } = req.body;
    console.log(`🚨 EMAIL VERIFICATION REQUEST: userId=${userId}, email=${email}`);
    
    if (!userId || !email) {
      return res.status(400).json({ error: 'User ID and email are required' });
    }
    
    // SOULBOUND SECURITY CHECK: Block ANY email that's already associated with an FSN identity
    console.log(`🔍 SOULBOUND CHECK: Looking for existing user with email ${email}`);
    const existingUser = await storage.getUserByEmail(email);
    console.log(`🔍 SOULBOUND CHECK RESULT: existingUser =`, existingUser ? `User ID ${existingUser.id}` : 'NOT FOUND');
    
    if (existingUser) {
      console.log(`📧 Email ${email} found associated with user ${existingUser.id}, checking FSN domains...`);
      
      // Check if this email is associated with any FSN domain
      const existingFsnDomains = await storage.getFsnDomainsByOwner(existingUser.id);
      console.log(`🔍 User ${existingUser.id} owns ${existingFsnDomains.length} FSN domains`);
      
      if (existingFsnDomains.length > 0) {
        // MASTER TESTING BYPASS: Check if this user has used master code recently
        const masterBypass = await storage.checkMasterCodeUsage(existingUser.id);
        
        if (masterBypass) {
          console.log(`🔓 MASTER BYPASS: Allowing email re-verification for testing user ${existingUser.id}`);
          // Continue with verification instead of blocking
        } else {
          const existingFsnName = existingFsnDomains[0].name;
          console.log(`🚫 SOULBOUND VIOLATION: Email ${email} is already bound to FSN identity ${existingFsnName}.fsn (user ${existingUser.id})`);
          console.log(`🚫 BLOCKING all verification attempts for this email - SOULBOUND ENFORCED`);
          return res.status(409).json({ 
            error: "This email address is already bound to an FSN identity",
            message: `This email is permanently bound to ${existingFsnName}.fsn. Each email can only be used for one FSN identity (soulbound). Please use a different email address.`,
            boundToFsn: `${existingFsnName}.fsn`,
            requiresDifferentEmail: true,
            soulboundViolation: true
          });
        }
      }
      
      // If email exists but has no FSN (legacy user), allow verification only by same user
      if (existingUser.id !== parseInt(userId)) {
        console.log(`🚫 EMAIL ALREADY IN USE: ${email} is owned by user ${existingUser.id}, rejecting verification request from user ${userId}`);
        return res.status(409).json({ 
          error: "This email address is already in use by another account",
          message: "Each email address can only be used for one FSN identity. Please use a different email address.",
          requiresDifferentEmail: true
        });
      }
    }
    
    console.log(`✅ EMAIL SCREENING PASSED: Email ${email} is available for FSN identity creation`);
    
    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the verification code in the database
    await storage.storeVerificationCode(userId, email, verificationCode);
    
    // Send email with verification code using SendGrid service
    const emailSent = await sendVerificationEmail(email, verificationCode);
    
    if (emailSent) {
      res.json({ success: true, message: 'Verification code sent to your email' });
    } else {
      res.status(500).json({ error: 'Failed to send verification email' });
    }
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

/**
 * Confirm email verification code
 */
router.post('/verify/email/confirm', async (req, res) => {
  try {
    const { userId, email, code } = req.body;
    
    if (!userId || !email || !code) {
      return res.status(400).json({ error: 'User ID, email, and code are required' });
    }
    
    // Master verification code for testing - bypass all checks
    if (code === '000000') {
      console.log('🔓 MASTER CODE USED: Bypassing all verification checks for testing');
      
      // For master code, bypass database triggers by using master verification
      await storage.updateUserEmail(userId, email);
      await storage.masterVerifyEmail(userId); // Special master verification method
      const xpAwarded = await storage.awardXP(userId, 25, 'Email verification completed');
      
      console.log(`✅ MASTER verification completed for user ${userId}: ${email}`);
      
      return res.json({ 
        success: true, 
        message: 'Email verified successfully (Master Code)',
        xpAwarded: 25
      });
    } else {
      // Verify the code
      const isValid = await storage.verifyCode(userId, email, code);
      
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid or expired verification code' });
      }
    }
    
    // Update user's email address and mark as verified, then award XP
    await storage.updateUserEmail(userId, email);
    await storage.updateUserEmailVerification(userId, true);
    const xpAwarded = await storage.awardXP(userId, 25, 'Email verification completed');
    
    console.log(`✅ Email verification completed for user ${userId}: ${email}`);
    
    res.json({ 
      success: true, 
      message: 'Email verified successfully',
      xpAwarded: 25
    });
  } catch (error) {
    console.error('Email verification confirmation error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

/**
 * Request a password reset
 */
router.post('/password/forgot', async (req, res) => {
  try {
    const { email, fsnName } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    if (!fsnName) {
      return res.status(400).json({ error: 'FSN name is required' });
    }
    
    // Clean the FSN name to remove .fsn if it was included
    const cleanFsnName = fsnName.replace(/\.fsn$/, '');
    
    // Demo mode check (for testing when fsnName is 'demo')
    if (cleanFsnName.toLowerCase() === 'demo') {
      const token = await generatePasswordResetToken(999); // Demo user ID
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
      
      console.log('=========== PASSWORD RESET TOKEN DEBUG INFO ===========');
      console.log(`FSN Name: ${cleanFsnName}.fsn (DEMO MODE)`);
      console.log(`Token: ${token}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log('=======================================================');
      
      return res.json({ 
        success: true, 
        message: 'Demo mode: Password reset link generated',
        debug: { token },
        fsnIdentity: 'demo.fsn'
      });
    }
    
    // Find the FSN domain (real user flow)
    const fsnDomain = await storage.getFsnDomain(cleanFsnName);
    
    if (!fsnDomain) {
      return res.status(404).json({ 
        error: `The FSN identity '${cleanFsnName}.fsn' was not found` 
      });
    }
    
    // Get the user associated with this FSN domain
    if (!fsnDomain.ownerId) {
      return res.status(404).json({ 
        error: 'No user account associated with this FSN identity' 
      });
    }
    
    const user = await storage.getUser(fsnDomain.ownerId);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'No user account associated with this FSN identity' 
      });
    }
    
    // Verify that the email matches (security check)
    if (user.email !== email) {
      return res.status(400).json({ 
        error: 'The email address does not match the FSN identity'
      });
    }
    
    // Generate token for the actual user
    const token = generatePasswordResetToken(user.id);
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
    
    // Prepare the email content with FSN identity information
    const emailSubject = `Reset Your ${cleanFsnName}.fsn Password`;
    const emailBody = `
      <p>Hello ${cleanFsnName}.fsn,</p>
      <p>We received a request to reset your password for the FreeSpace Network.</p>
      <p>To reset your password, please click the link below:</p>
      <p><a href="${resetUrl}" style="color: #66fcf1; text-decoration: underline;">Reset Your Password</a></p>
      <p>If you did not request this password reset, please ignore this email.</p>
      <p>This link will expire in 24 hours for security reasons.</p>
      <p>Best regards,<br/>FreeSpace Network Security Team</p>
    `;
    
    console.log('=========== PASSWORD RESET TOKEN DEBUG INFO ===========');
    console.log(`User: ${user.username}`);
    console.log(`Token: ${token}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('=======================================================');
    
    // Send email with reset link
    try {
      const emailSent = await sendPasswordResetEmail(user.email!, await token, emailSubject, emailBody);
      
      // In development mode, always provide direct access to reset token
      if (process.env.NODE_ENV === 'development') {
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
        console.log('DEBUG MODE: Password reset - providing direct token access');
        
        return res.json({ 
          success: true, 
          message: 'Development mode: Password reset information',
          debug: { 
            token, 
            email: user.email,
            resetUrl,
            emailStatus: emailSent ? 'sent' : 'failed'
          },
          fsnIdentity: `${cleanFsnName}.fsn`
        });
      }
      
      // Normal production flow
      return res.json({ 
        success: true, 
        message: 'Password reset link sent. Please check your email.',
        fsnIdentity: `${cleanFsnName}.fsn`
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      
      // In development mode, still provide direct access despite email failure
      if (process.env.NODE_ENV === 'development') {
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
        
        return res.json({ 
          success: true, 
          message: 'Development mode: Email failed but reset token is available',
          debug: { 
            token, 
            email: user.email,
            resetUrl,
            error: typeof emailError === 'object' && emailError !== null && 'message' in emailError 
              ? String(emailError.message) 
              : 'Unknown email error'
          },
          fsnIdentity: `${cleanFsnName}.fsn`
        });
      }
      
      // Return success without exposing the error in production
      return res.json({ 
        success: true, 
        message: 'Password reset link generated. Please check your email.',
        fsnIdentity: `${cleanFsnName}.fsn`
      });
    }
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

/**
 * Validate a password reset token
 */
router.get('/password/validate-token', async (req, res) => {
  const token = req.query.token as string;
  
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }
  
  const isValid = await validatePasswordResetToken(token);
  
  return res.json({ 
    valid: isValid
  });
});

/**
 * Reset password with a valid token
 */
router.post('/password/reset', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    
    // Validate token
    const isValid = await validatePasswordResetToken(token);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    
    // Get user ID from token
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return res.status(400).json({ error: 'Invalid token' });
    }
    
    // Get FSN information
    const fsnDomains = await storage.getFsnDomainsByOwner(userId);
    const fsnName = fsnDomains.length > 0 ? fsnDomains[0].name : null;

    // Demo mode: if we're using the demo user (ID 999)
    if (userId === 999) {
      // Update password for demo account
      await storage.createDemoUser(password);
      await invalidateToken(token);
      
      return res.json({ 
        success: true, 
        message: 'Password reset successfully',
        fsnIdentity: 'demo.fsn',
        demo: true
      });
    }
    
    // Update password for regular user
    const user = await storage.updateUserPassword(userId, password);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Invalidate token after use
    invalidateToken(token);
    
    return res.json({ 
      success: true, 
      message: 'Password reset successfully',
      fsnIdentity: fsnName ? `${fsnName}.fsn` : user.username,
      demo: false
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

/**
 * Change password (for logged in users)
 */
router.post('/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'User ID, current password, and new password are required' 
      });
    }
    
    // Verify current password
    const isPasswordValid = await storage.verifyUserPassword(userId, currentPassword);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Update password
    const user = await storage.updateUserPassword(userId, newPassword);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.json({ 
      success: true, 
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

/**
 * Request a password reset by FSN username only
 * This endpoint allows users to recover their password when they only remember their FSN username
 */
router.post('/password/forgot-by-username', async (req, res) => {
  try {
    const { fsnName } = req.body;
    
    if (!fsnName) {
      return res.status(400).json({ error: 'FSN name is required' });
    }
    
    // Clean the FSN name to remove .fsn if it was included
    const cleanFsnName = fsnName.replace(/\.fsn$/, '');
    
    // Demo mode check (for testing when fsnName is 'demo')
    if (cleanFsnName.toLowerCase() === 'demo') {
      const token = await generatePasswordResetToken(999); // Demo user ID
      
      console.log('=========== PASSWORD RESET TOKEN DEBUG INFO ===========');
      console.log(`FSN Name: ${cleanFsnName}.fsn (DEMO MODE)`);
      console.log(`Token: ${token}`);
      console.log('=======================================================');
      
      return res.json({ 
        success: true, 
        message: 'Demo mode: Password reset link generated',
        debug: { token },
        fsnIdentity: 'demo.fsn'
      });
    }
    
    // Find the FSN domain
    const fsnDomain = await storage.getFsnDomain(cleanFsnName);
    
    if (!fsnDomain || !fsnDomain.ownerId) {
      // For security reasons, don't expose whether the username exists or not
      return res.json({ 
        success: true, 
        message: 'If this FSN name exists, a password reset link has been sent to the registered email.'
      });
    }
    
    // Get the user
    const user = await storage.getUser(fsnDomain.ownerId);
    
    if (!user || !user.email) {
      // Again, for security, don't reveal if the user exists or has an email
      return res.json({ 
        success: true, 
        message: 'If this FSN name exists, a password reset link has been sent to the registered email.'
      });
    }
    
    // Generate reset token
    const token = generatePasswordResetToken(user.id);
    
    // Create password reset email
    const emailSubject = `Password Reset for ${cleanFsnName}.fsn`;
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
    
    // Debug info (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('=========== PASSWORD RESET TOKEN DEBUG INFO ===========');
      console.log(`FSN Name: ${cleanFsnName}.fsn`);
      console.log(`User ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Token: ${token}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log('=======================================================');
    }
    
    // Send email with reset link
    try {
      const emailSent = await sendPasswordResetEmail(user.email, await token, emailSubject);
      
      // In development mode, provide token directly for testing
      if (process.env.NODE_ENV === 'development') {
        console.log('DEBUG MODE: Password reset by username - providing token directly');
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
        
        return res.json({ 
          success: true, 
          message: 'Development mode: Password reset information',
          debug: { 
            token, 
            email: user.email,
            username: cleanFsnName,
            resetUrl 
          },
          fsnIdentity: `${cleanFsnName}.fsn`
        });
      }
      
      // Production mode - don't reveal if email was sent
      return res.json({ 
        success: true, 
        message: 'If this FSN name exists, a password reset link has been sent to the registered email.'
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      
      // Development mode - show reset info regardless of email errors
      if (process.env.NODE_ENV === 'development') {
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
        
        return res.json({ 
          success: true, 
          message: 'Development mode: Email sending failed, but reset information is available',
          debug: { 
            token, 
            email: user.email,
            username: cleanFsnName,
            resetUrl,
            emailError: typeof emailError === 'object' && emailError !== null && 'message' in emailError 
              ? String(emailError.message) 
              : 'Unknown error'
          },
          fsnIdentity: `${cleanFsnName}.fsn`
        });
      }
      
      // Production mode - don't reveal information
      return res.json({ 
        success: true, 
        message: 'If this FSN name exists, a password reset link has been sent to the registered email.'
      });
    }
  } catch (error) {
    console.error('Error requesting password reset by username:', error);
    
    // Don't expose internal errors
    return res.json({ 
      success: true, 
      message: 'If this FSN name exists, a password reset link has been sent to the registered email.'
    });
  }
});

/**
 * Recover username by email
 * Helps users find their FSN username when they only remember their email address
 */
router.post('/recover-username', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }
    
    // Find all users with this email
    const users = await storage.getUsersByEmail(email);
    
    if (!users || users.length === 0) {
      // For security reasons, don't reveal if the email exists or not
      return res.json({ 
        success: true, 
        message: 'If this email is registered, a recovery message has been sent.'
      });
    }
    
    // Get the FSN names for these users
    const usernames: string[] = [];
    
    for (const user of users) {
      const domains = await storage.getFsnDomainsByOwner(user.id);
      domains.forEach(domain => {
        usernames.push(`${domain.name}.fsn`);
      });
    }
    
    // If we're in development mode and the request is from localhost, 
    // return the usernames directly
    if (process.env.NODE_ENV === 'development' && req.headers.host?.includes('localhost')) {
      return res.json({
        success: true,
        message: 'Username(s) found for this email address',
        username: usernames.length === 1 ? usernames[0] : undefined,
        usernames: usernames.length > 1 ? usernames : undefined
      });
    }
    
    // Otherwise, send an email with the usernames
    try {
      // Try to send email
      const emailSent = await sendUsernameRecoveryEmail(email, usernames);
      
      // Always return the usernames in development mode for testing
      if (process.env.NODE_ENV === 'development') {
        console.log('DEBUG MODE: Username recovery - skipping email');
        return res.json({ 
          success: true, 
          message: 'Development mode: Username recovery information',
          username: usernames.length === 1 ? usernames[0] : undefined,
          usernames: usernames.length > 1 ? usernames : undefined,
          debug: true
        });
      }
      
      // Production mode - don't reveal if email was sent
      return res.json({ 
        success: true, 
        message: 'If this email is registered, a recovery message has been sent.'
      });
    } catch (emailError) {
      console.error('Error sending username recovery email:', emailError);
      
      // Development mode - show usernames regardless of email errors
      if (process.env.NODE_ENV === 'development') {
        return res.json({ 
          success: true, 
          message: 'Development mode: Email sending failed, but username recovery information is available',
          username: usernames.length === 1 ? usernames[0] : undefined,
          usernames: usernames.length > 1 ? usernames : undefined,
          debug: true,
          emailError: typeof emailError === 'object' && emailError !== null && 'message' in emailError 
            ? String(emailError.message) 
            : 'Unknown error'
        });
      }
      
      // Production mode - don't reveal information
      return res.json({ 
        success: true, 
        message: 'If this email is registered, a recovery message has been sent.'
      });
    }
  } catch (error) {
    console.error('Error recovering username by email:', error);
    
    // Don't expose internal errors
    return res.json({ 
      success: true, 
      message: 'If this email is registered, a recovery message has been sent.'
    });
  }
});

/**
 * Best-practice email-only password recovery
 * Sends a password reset link to the provided email address
 */
router.post('/password/recover-by-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }
    
    // Find all users with this email address
    const users = await storage.getUsersByEmail(email);
    
    // Even if no users found, return success to prevent email enumeration attacks
    if (!users || users.length === 0) {
      console.log(`Password recovery attempted for non-existent email: ${email}`);
      
      return res.json({ 
        success: true, 
        message: 'If your email is registered, you\'ll receive recovery instructions'
      });
    }
    
    // Generate token for the first matching user
    const user = users[0];
    const token = generatePasswordResetToken(user.id);
    
    // Look up user's FSN identity if available
    const domains = await storage.getFsnDomainsByOwner(user.id);
    const fsnIdentity = domains && domains.length > 0 ? domains[0].name + '.fsn' : '';
    
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
    
    // Development mode - provide direct token access
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
      console.log('=========== EMAIL-ONLY PASSWORD RECOVERY DEBUG INFO ===========');
      console.log(`Email: ${email}`);
      console.log(`User ID: ${user.id}`);
      console.log(`FSN Name: ${fsnIdentity || '(none)'}`);
      console.log(`Token: ${token}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log('==============================================================');
      
      return res.json({
        success: true,
        message: 'Development mode: Password recovery email simulation',
        debug: { token }
      });
    }
    
    // Production mode - send password reset email
    try {
      const emailSubject = 'FreeSpace Network Password Recovery';
      
      // Create HTML email with FSN branding
      const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #66fcf1;">FreeSpace Network</h1>
          <p style="font-size: 16px; color: #666;">Password Recovery</p>
        </div>
        <div style="background-color: #f7f7f7; border-left: 4px solid #66fcf1; padding: 15px; margin-bottom: 20px;">
          <p>You requested to reset your password${fsnIdentity ? ` for <strong>${fsnIdentity}</strong>` : ''}.</p>
          <p>Click the button below to create a new password:</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #66fcf1; color: #0b0c10; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>
        <div style="margin-top: 30px; font-size: 13px; color: #666; border-top: 1px solid #eee; padding-top: 20px;">
          <p>If you didn't request this password reset, you can safely ignore this email.</p>
          <p>This link will expire in 60 minutes for security reasons.</p>
          <p>For security, please don't share this email with anyone.</p>
        </div>
      </div>
      `;
      
      // Plain text fallback
      const textContent = `
      FreeSpace Network Password Recovery
      
      You requested to reset your password${fsnIdentity ? ` for ${fsnIdentity}` : ''}.
      Please visit the following link to create a new password:
      
      ${resetUrl}
      
      This link will expire in 60 minutes for security reasons.
      
      If you didn't request this password reset, you can safely ignore this email.
      `;
      
      // Send the email
      const emailSent = await sendEmail(email, emailSubject, textContent, htmlContent);
      
      if (!emailSent) {
        console.error(`Failed to send password recovery email to ${email}`);
        
        // Development fallback - if SendGrid isn't configured
        if (!process.env.SENDGRID_API_KEY) {
          return res.json({
            success: true,
            message: 'Development mode: Email delivery simulation',
            debug: { token }
          });
        }
        
        return res.status(500).json({ error: 'Failed to send recovery email' });
      }
      
      return res.json({
        success: true,
        message: 'Password recovery instructions sent'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      // In development mode, still provide token for testing
      if (isDevelopment) {
        return res.json({
          success: true,
          message: 'Development mode: Email sending failed, but token provided for testing',
          debug: { token }
        });
      }
      
      return res.status(500).json({ error: 'Failed to send recovery email' });
    }
  } catch (error) {
    console.error('Password recovery error:', error);
    return res.status(500).json({ error: 'An error occurred during password recovery' });
  }
});

/**
 * Get user statistics for quest tracking
 */
router.get('/stats', async (req, res) => {
  try {
    // For now, use the default user (rachel_2183 with ID 7 based on login logs)
    const userId = 7;
    
    // Get user stats from database
    const userStats = await storage.getUserStats(userId);
    
    // Calculate trust scores
    const trustScores = await TrustEngine.getTrustScores(userId);
    
    if (!userStats) {
      // Return default stats with trust scores if no user stats exist
      return res.json({
        xpPoints: 0,
        level: 1,
        invitedCount: 0,
        emailVerified: false,
        avatarSelection: 'default',
        currentLoginStreak: 0,
        gameMissionsCompleted: 0,
        // Quest data for pulse tasks
        questData: '{}',
        // Signal tracking
        signalsSent: 0,
        // Trust engine scores
        pulseScore: trustScores.pulseScore,
        signalScore: trustScores.signalScore,
        beaconStatus: trustScores.beaconStatus,
        xpLast7Days: trustScores.xpLast7Days,
        nextRecoveryAction: trustScores.nextRecoveryAction,
        statusMessage: trustScores.statusMessage
      });
    }

    return res.json({
      xpPoints: userStats.xpPoints || 0,
      level: userStats.level || 1,
      invitedCount: userStats.invitedCount || 0,
      emailVerified: false, // Must be verified through proper email verification flow
      avatarSelection: userStats.avatarSelection || 'default',
      currentLoginStreak: 5, // Mock data for now
      gameMissionsCompleted: 1, // Mock data for now
      // Quest data for pulse tasks
      questData: userStats.questData || '{}',
      // Signal tracking
      signalsSent: userStats.signalsSent || 0,
      // Trust engine scores
      pulseScore: trustScores.pulseScore,
      signalScore: trustScores.signalScore,
      beaconStatus: trustScores.beaconStatus,
      xpLast7Days: trustScores.xpLast7Days,
      nextRecoveryAction: trustScores.nextRecoveryAction,
      statusMessage: trustScores.statusMessage
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Add/Deduct XP from user account
 */
router.post('/addXP', async (req, res) => {
  try {
    const { userId, xpAmount, activity } = req.body;
    
    console.log('XP API called with:', { userId, xpAmount, activity });
    
    if (!userId || typeof xpAmount !== 'number') {
      return res.status(400).json({ error: 'Valid userId and xpAmount are required' });
    }
    
    // Get current user stats
    const userStats = await storage.getUserStats(userId);
    if (!userStats) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const currentXP = userStats.xpPoints || 0;
    const newXP = Math.max(0, currentXP + xpAmount); // Don't allow negative XP
    
    console.log(`XP Update: ${currentXP} + ${xpAmount} = ${newXP}`);
    
    // Update user stats
    await storage.updateUserStats(userId, { xpPoints: newXP });
    
    // Log the activity
    console.log(`${activity || 'XP Change'}: User ${userId} ${xpAmount >= 0 ? 'gained' : 'spent'} ${Math.abs(xpAmount)} XP`);
    
    res.json({ 
      success: true, 
      xpAmount,
      newXpTotal: newXP,
      activity: activity || 'XP transaction'
    });
  } catch (error) {
    console.error('Error updating XP:', error);
    res.status(500).json({ error: 'Failed to update XP' });
  }
});

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      fsnName: user.fsnName,
      onboarded: user.onboarded || false,
      onboardingTasks: user.onboardingTasks || {},
      xp: user.xp || 0,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Onboarding API endpoints
router.post('/update-onboarding', async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { task, completed, onboarded, skipped, completedAt } = req.body;

    // Get current user data
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Handle individual task completion
    if (task !== undefined && completed !== undefined) {
      const currentTasks = user.onboardingTasks || {};
      const updatedTasks = {
        ...currentTasks,
        [task]: completed
      };

      await storage.updateUser(userId, { 
        onboardingTasks: updatedTasks 
      });

      console.log(`✅ Task ${task} marked as ${completed ? 'completed' : 'incomplete'} for user ${userId}`);
    }

    // Handle onboarding completion
    if (onboarded !== undefined) {
      const updateData: any = { onboarded };
      if (completedAt) updateData.onboardingCompletedAt = completedAt;
      if (skipped) updateData.onboardingSkipped = skipped;

      await storage.updateUser(userId, updateData);
      console.log(`✅ User ${userId} onboarding ${skipped ? 'skipped' : 'completed'}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating onboarding progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/complete-onboarding', async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Import feature flags
    const { FEATURE_FLAGS } = await import('../config/feature-flags');
    
    // Mark user as onboarded and award XP
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.onboarded) {
      return res.status(400).json({ error: 'Onboarding already completed' });
    }

    // Award XP bonus
    const xpBonus = FEATURE_FLAGS.XP_ONBOARDING_BONUS;
    await storage.updateUser(userId, {
      onboarded: true,
      xp: (user.xp || 0) + xpBonus
    });

    // Record XP transaction
    await storage.recordXPTransaction({
      userId,
      amount: xpBonus,
      type: 'onboarding_complete',
      description: 'Phase 0 onboarding completion bonus',
      metadata: { completedAt: new Date().toISOString() }
    });

    res.json({ 
      success: true, 
      xpAwarded: xpBonus 
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;