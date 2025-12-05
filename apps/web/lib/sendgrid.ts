import sgMail from '@sendgrid/mail';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=sendgrid',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key || !connectionSettings.settings.from_email)) {
    throw new Error('SendGrid not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, email: connectionSettings.settings.from_email };
}

export async function getUncachableSendGridClient() {
  const { apiKey, email } = await getCredentials();
  sgMail.setApiKey(apiKey);
  return {
    client: sgMail,
    fromEmail: email
  };
}

export async function sendAdminNotification(repName: string, walletAddress: string) {
  console.log(`[SendGrid] Starting admin notification for ${repName}.rep to ${walletAddress}`);
  try {
    console.log('[SendGrid] Getting credentials...');
    const { client, fromEmail } = await getUncachableSendGridClient();
    console.log(`[SendGrid] Got credentials, sending from: ${fromEmail}`);
    
    const msg = {
      to: 'info@dotrep.io',
      from: fromEmail,
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
    };

    await client.send(msg);
    console.log(`[SendGrid] Admin notification sent for ${repName}.rep`);
    return true;
  } catch (error) {
    console.error('[SendGrid] Failed to send admin notification:', error);
    return false;
  }
}
