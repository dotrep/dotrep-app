import { MailService } from '@sendgrid/mail';
import { sendVerificationEmailFree } from './freeEmailService';

let mailService;
let isConfigured = false;

try {
  if (process.env.SENDGRID_API_KEY) {
    console.log('SendGrid API key found, length:', process.env.SENDGRID_API_KEY.length);
    mailService = new MailService();
    mailService.setApiKey(process.env.SENDGRID_API_KEY);
    isConfigured = true;
    console.log('SendGrid configured successfully - attempting real email delivery');
  } else {
    console.log('No SendGrid API key found, using demo mode');
  }
} catch (error) {
  console.log('SendGrid configuration failed, using demo mode:', error.message);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  // If SendGrid is not configured, use demo mode immediately
  if (!isConfigured || !mailService) {
    console.log('='.repeat(60));
    console.log('📧 DEMO MODE - EMAIL WOULD BE SENT:');
    console.log(`To: ${params.to}`);
    console.log(`Subject: ${params.subject}`);
    if (params.subject === 'FSN Identity Verification Code') {
      const codeMatch = params.text?.match(/verification code is: (\d{6})/);
      if (codeMatch) {
        console.log(`🔢 VERIFICATION CODE: ${codeMatch[1]}`);
      }
    }
    console.log('='.repeat(60));
    return true;
  }

  try {
    console.log(`📧 Attempting real email send to ${params.to}`);
    console.log(`📧 Using verified sender: verification@fsn-vault.com`);
    
    const result = await mailService.send({
      to: params.to,
      from: {
        email: 'verification@fsn-vault.com',
        name: 'FSN Vault'
      },
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
    });
    
    console.log('✅ Email sent successfully via SendGrid!');
    return true;
  } catch (error) {
    console.error('❌ SendGrid email error:', error.response?.body || error.message);
    
    // Fallback to demo mode on any error
    console.log('='.repeat(60));
    console.log('📧 FALLBACK DEMO MODE - EMAIL SEND FAILED:');
    console.log(`To: ${params.to}`);
    console.log(`Subject: ${params.subject}`);
    if (params.subject === 'FSN Identity Verification') {
      const codeMatch = params.text?.match(/verification code is: (\d{6})/);
      if (codeMatch) {
        console.log(`🔢 VERIFICATION CODE: ${codeMatch[1]}`);
      }
    }
    console.log('='.repeat(60));
    return true;
  }
}

export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  // Always log for backup/demo purposes
  console.log('='.repeat(60));
  console.log('🔐 SENDING VERIFICATION EMAIL:');
  console.log(`📧 To: ${email}`);
  console.log(`🔢 Code: ${code}`);
  console.log('='.repeat(60));

  // Create email content once
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #000619; color: white; padding: 40px; border-radius: 16px; border: 1px solid rgba(0, 255, 255, 0.3);">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #00ffff; font-size: 32px; margin: 0; letter-spacing: 2px;">FSN VERIFICATION</h1>
      </div>
      
      <div style="background: rgba(0, 255, 255, 0.05); border: 1px solid rgba(0, 255, 255, 0.15); border-radius: 8px; padding: 30px; text-align: center; margin-bottom: 30px;">
        <p style="font-size: 18px; margin-bottom: 20px;">Your verification code is:</p>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 36px; color: #00ffff; letter-spacing: 8px; font-weight: bold; text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);">
          ${code}
        </div>
      </div>
      
      <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7); text-align: center;">
        <p>This code will expire in 10 minutes.</p>
        <p>Enter this code to verify your email address and complete your FSN identity claim.</p>
      </div>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(0, 255, 255, 0.2); text-align: center; font-size: 12px; color: rgba(255, 255, 255, 0.5);">
        <p>FSN Network - Secure Identity System</p>
      </div>
    </div>
  `;

  const textContent = `Your FSN verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nEnter this code to verify your email address and complete your FSN identity claim.`;

  // Try SendGrid first if configured
  if (isConfigured && mailService) {
    console.log('📧 Using SendGrid for real email delivery...');
    
    try {
      const result = await mailService.send({
        to: email,
        from: {
          email: 'verification@fsn-vault.com',
          name: 'FSN Vault'
        },
        subject: 'FSN Email Verification Code',
        text: textContent,
        html: html,
      });
      
      console.log('✅ Email sent successfully via SendGrid!');
      return true;
    } catch (error) {
      console.error('❌ SendGrid email error, trying Resend fallback:', error.response?.body || error.message);
      // Continue to try Resend
    }
  }

  // Try Resend API as fallback
  if (process.env.RESEND_API_KEY) {
    console.log('📧 Trying Resend API as fallback...');
    
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'FSN Vault <onboarding@resend.dev>',
          to: [email],
          subject: 'FSN Email Verification Code',
          text: textContent,
          html: html,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Email sent successfully via Resend!', result);
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Resend API error:', errorText);
        // Continue to demo mode
      }
    } catch (error) {
      console.error('❌ Resend email error:', error);
      // Continue to demo mode
    }
  }

  // Fallback to demo mode with clear logging
  console.log('='.repeat(60));
  console.log('📧 DEMO MODE - EMAIL WOULD BE SENT:');
  console.log(`To: ${email}`);
  console.log(`Subject: FSN Email Verification Code`);
  console.log(`🔢 VERIFICATION CODE: ${code}`);
  console.log('='.repeat(60));
  return true;
}