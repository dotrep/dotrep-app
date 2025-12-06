import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAdminNotification(repName: string, walletAddress: string) {
  console.log(`[Email] Starting admin notification for ${repName}.rep to ${walletAddress}`);
  
  if (!process.env.RESEND_API_KEY) {
    console.error('[Email] RESEND_API_KEY not configured');
    return false;
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'dotrep.io <onboarding@resend.dev>',
      to: 'info@dotrep.io',
      subject: `New .rep Claim: ${repName}`,
      text: `A new .rep name has been claimed!\n\n` +
            `Name: ${repName}.rep\n` +
            `Wallet: ${walletAddress}\n` +
            `Time: ${new Date().toISOString()}\n\n` +
            `View all claims at your admin dashboard.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00f0ff;">New .rep Name Claimed!</h2>
          <div style="background: #0a1929; padding: 20px; border-radius: 8px; color: #fff;">
            <p><strong>Name:</strong> <span style="color: #00f0ff;">${repName}.rep</span></p>
            <p><strong>Wallet:</strong> <code style="background: #1a2a3a; padding: 4px 8px; border-radius: 4px;">${walletAddress}</code></p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="margin-top: 20px; color: #666;">
            View all claims in your <a href="https://dotrep.io/admin">admin dashboard</a>.
          </p>
        </div>
      `
    });

    if (error) {
      console.error('[Email] Resend error:', error);
      return false;
    }

    console.log(`[Email] Admin notification sent for ${repName}.rep, id: ${data?.id}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send admin notification:', error);
    return false;
  }
}
