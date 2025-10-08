/**
 * Congratulations Email Service
 * Sends beautiful congratulations emails when users claim their FSN names
 */

import { sendEmailWithResend } from './freeEmailService';

interface CongratulationsEmailParams {
  email: string;
  fsnName: string;
  userXP?: number;
}

export async function sendCongratulationsEmail(params: CongratulationsEmailParams): Promise<boolean> {
  const { email, fsnName, userXP = 0 } = params;
  
  try {
    console.log(`🎉 Sending congratulations email to ${email} for claiming ${fsnName}.fsn`);
    
    const emailSubject = `🎉 Congratulations! You've claimed ${fsnName}.fsn`;
    
    const emailText = `
Congratulations ${fsnName}!

You've successfully claimed your FSN identity: ${fsnName}.fsn

Your Web3 journey begins now! Here's what you've unlocked:
• Your unique .fsn identity
• +50 XP reward (Total XP: ${userXP})
• Access to the FSN ecosystem
• Secure vault storage
• AI agent interactions

Welcome to the FreeSpace Network!

Next steps:
1. Complete your profile setup
2. Explore the FSN dashboard  
3. Connect with other .fsn users
4. Start earning more XP

Best regards,
The FreeSpace Network Team
    `;

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f1419 0%, #1a2332 100%); color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            🎉 Congratulations!
          </h1>
          <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">
            Your FSN identity has been claimed successfully
          </p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          
          <!-- FSN Name Badge -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #1f2937 0%, #374151 100%); border: 2px solid #06b6d4; border-radius: 12px; padding: 20px 30px; box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);">
              <div style="font-size: 28px; font-weight: bold; color: #06b6d4; margin-bottom: 5px;">
                ${fsnName}.fsn
              </div>
              <div style="font-size: 14px; color: #9ca3af;">
                Your new Web3 identity
              </div>
            </div>
          </div>
          
          <!-- Welcome Message -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #f9fafb; font-size: 24px; margin-bottom: 15px;">
              Welcome to the FreeSpace Network!
            </h2>
            <p style="color: #d1d5db; font-size: 16px; line-height: 1.6; margin: 0;">
              You've successfully claimed your FSN identity and joined an exclusive community of Web3 pioneers.
            </p>
          </div>
          
          <!-- Rewards Section -->
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); border-radius: 10px; padding: 25px; margin-bottom: 30px; border: 1px solid #3b82f6;">
            <h3 style="color: #f9fafb; font-size: 20px; margin: 0 0 15px 0; text-align: center;">
              🏆 Your Rewards
            </h3>
            <div style="display: flex; justify-content: space-around; text-align: center;">
              <div>
                <div style="font-size: 24px; font-weight: bold; color: #60a5fa; margin-bottom: 5px;">+50 XP</div>
                <div style="font-size: 14px; color: #cbd5e1;">Claim Reward</div>
              </div>
              <div>
                <div style="font-size: 24px; font-weight: bold; color: #34d399; margin-bottom: 5px;">${userXP}</div>
                <div style="font-size: 14px; color: #cbd5e1;">Total XP</div>
              </div>
              <div>
                <div style="font-size: 24px; font-weight: bold; color: #f59e0b; margin-bottom: 5px;">∞</div>
                <div style="font-size: 14px; color: #cbd5e1;">Possibilities</div>
              </div>
            </div>
          </div>
          
          <!-- What's Unlocked -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #f9fafb; font-size: 18px; margin-bottom: 20px;">
              🔓 What you've unlocked:
            </h3>
            <div style="space-y: 10px;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="color: #06b6d4; margin-right: 10px; font-size: 16px;">✅</span>
                <span style="color: #d1d5db;">Unique .fsn identity and profile</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="color: #06b6d4; margin-right: 10px; font-size: 16px;">✅</span>
                <span style="color: #d1d5db;">Secure vault for file and NFT storage</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="color: #06b6d4; margin-right: 10px; font-size: 16px;">✅</span>
                <span style="color: #d1d5db;">Access to AI agent ecosystem</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="color: #06b6d4; margin-right: 10px; font-size: 16px;">✅</span>
                <span style="color: #d1d5db;">FSN-to-FSN messaging system</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="color: #06b6d4; margin-right: 10px; font-size: 16px;">✅</span>
                <span style="color: #d1d5db;">XP progression and achievement system</span>
              </div>
            </div>
          </div>
          
          <!-- Next Steps -->
          <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); border-radius: 10px; padding: 25px; margin-bottom: 20px; border: 1px solid #10b981;">
            <h3 style="color: #f9fafb; font-size: 18px; margin: 0 0 15px 0;">
              🚀 Next Steps:
            </h3>
            <ol style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Complete your profile setup for bonus XP</li>
              <li style="margin-bottom: 8px;">Explore the FSN dashboard and features</li>
              <li style="margin-bottom: 8px;">Connect with other .fsn community members</li>
              <li style="margin-bottom: 8px;">Upload your first items to the vault</li>
              <li style="margin-bottom: 8px;">Start earning more XP through quests</li>
            </ol>
          </div>
          
        </div>
        
        <!-- Footer -->
        <div style="background: #111827; padding: 20px; text-align: center; border-top: 1px solid #374151;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Welcome to the future of Web3 identity.
          </p>
          <p style="color: #4b5563; font-size: 12px; margin: 10px 0 0 0;">
            © ${new Date().getFullYear()} FreeSpace Network. Building the decentralized web, one .fsn at a time.
          </p>
        </div>
        
      </div>
    `;

    const emailSent = await sendEmailWithResend({
      to: email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    });

    if (emailSent) {
      console.log(`✅ Congratulations email sent successfully to ${email}`);
      return true;
    } else {
      console.error(`❌ Failed to send congratulations email to ${email}`);
      return false;
    }

  } catch (error) {
    console.error('Error sending congratulations email:', error);
    return false;
  }
}