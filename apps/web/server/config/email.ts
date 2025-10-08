// Email configuration for wallet-first mode
export const emailConfig = {
  enabled: process.env.EMAIL_ENABLED === 'true',
  requiredForClaim: process.env.EMAIL_REQUIRED_FOR_CLAIM === 'true',
  
  // Check if email verification is required
  isRequired(): boolean {
    return this.enabled && this.requiredForClaim;
  },
  
  // Check if email features should be shown in UI
  showEmailUI(): boolean {
    return this.enabled;
  }
};

export default emailConfig;