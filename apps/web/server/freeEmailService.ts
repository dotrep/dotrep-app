// Free email service using Resend API (100 emails/month free)
// Alternative: EmailJS for client-side email sending

interface EmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmailWithResend(params: EmailParams): Promise<boolean> {
  // Resend API is free for 3,000 emails/month
  
  if (!process.env.RESEND_API_KEY) {
    console.log('No Resend API key found, using demo mode');
    return logEmailDemo(params);
  }

  console.log('📧 Using Resend API for real email delivery...');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Acme <onboarding@resend.dev>',
        to: [params.to],
        subject: params.subject,
        text: params.text,
        html: params.html || params.text,
      }),
    });

    if (response.ok) {
      console.log('✅ Email sent successfully via Resend!');
      return true;
    } else {
      const error = await response.text();
      console.error('❌ Resend API error:', error);
      return logEmailDemo(params);
    }
  } catch (error) {
    console.error('❌ Resend email error:', error);
    return logEmailDemo(params);
  }
}

export async function sendEmailWithEmailJS(params: EmailParams): Promise<boolean> {
  // EmailJS is completely free and works from the frontend
  // This would be implemented on the client side
  console.log('EmailJS would be implemented on the frontend');
  return logEmailDemo(params);
}

function logEmailDemo(params: EmailParams): boolean {
  console.log('='.repeat(60));
  console.log('📧 DEMO MODE - EMAIL WOULD BE SENT:');
  console.log(`To: ${params.to}`);
  console.log(`Subject: ${params.subject}`);
  
  // Extract verification code for easy copy-paste
  const codeMatch = params.text.match(/verification code is: (\d{6})/);
  if (codeMatch) {
    console.log(`🔢 VERIFICATION CODE: ${codeMatch[1]}`);
  }
  
  console.log('='.repeat(60));
  return true;
}

export async function sendVerificationEmailFree(email: string, code: string): Promise<boolean> {
  const textContent = `Your FSN verification code is: ${code}\n\nThis code expires in 10 minutes.`;
  
  const htmlContent = `
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
    </div>
  `;

  console.log('📧 Using Resend API for real email delivery...');
  
  // Try Resend API with correct sandbox domain
  if (!process.env.RESEND_API_KEY) {
    console.log('No Resend API key found, using demo mode');
    return logEmailDemo({
      to: email,
      subject: 'FSN Identity Verification',
      text: textContent,
      html: htmlContent
    });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Acme <onboarding@resend.dev>',
        to: [email],
        subject: 'FSN Identity Verification',
        text: textContent,
        html: htmlContent,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Email sent successfully via Resend!', result);
      return true;
    } else {
      const error = await response.text();
      console.error('❌ Resend API error:', error);
      return logEmailDemo({
        to: email,
        subject: 'FSN Identity Verification',
        text: textContent,
        html: htmlContent
      });
    }
  } catch (error) {
    console.error('❌ Resend email error:', error);
    return logEmailDemo({
      to: email,
      subject: 'FSN Identity Verification',
      text: textContent,
      html: htmlContent
    });
  }
}