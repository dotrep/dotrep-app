// Frontend email configuration
export const emailConfig = {
  enabled: import.meta.env.VITE_EMAIL_ENABLED === 'true',
  requiredForClaim: import.meta.env.VITE_EMAIL_REQUIRED_FOR_CLAIM === 'true',
  
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