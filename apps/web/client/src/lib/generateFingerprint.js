/**
 * Device fingerprinting utility for FSN identity verification
 * Uses FingerprintJS to generate unique device identifiers
 */
import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fpPromise = null;

/**
 * Initialize FingerprintJS (singleton pattern)
 */
async function initializeFingerprint() {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }
  return fpPromise;
}

/**
 * Generate a device fingerprint for identity verification
 * @returns {Promise<string>} Hashed device fingerprint
 */
export async function generateDeviceFingerprint() {
  try {
    const fp = await initializeFingerprint();
    const result = await fp.get();
    
    // Get the visitor ID (unique device identifier)
    const visitorId = result.visitorId;
    
    // Get additional components for enhanced security
    const components = result.components;
    
    // Create enhanced fingerprint with key components
    const enhancedData = {
      visitorId,
      screen: components.screenResolution?.value || 'unknown',
      timezone: components.timezone?.value || 'unknown',
      language: components.languages?.value || 'unknown',
      platform: components.platform?.value || 'unknown',
      cookiesEnabled: components.cookiesEnabled?.value || false,
      timestamp: Date.now()
    };
    
    // Convert to string and hash for privacy
    const fingerprintData = JSON.stringify(enhancedData);
    
    // Simple hash function (in production, use crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < fingerprintData.length; i++) {
      const char = fingerprintData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `fp_${Math.abs(hash).toString(36)}_${visitorId.slice(0, 8)}`;
  } catch (error) {
    console.error('Error generating device fingerprint:', error);
    // Fallback fingerprint based on browser characteristics
    const fallback = {
      userAgent: navigator.userAgent.slice(0, 50),
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      timestamp: Date.now()
    };
    
    let hash = 0;
    const fallbackString = JSON.stringify(fallback);
    for (let i = 0; i < fallbackString.length; i++) {
      const char = fallbackString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return `fp_fallback_${Math.abs(hash).toString(36)}`;
  }
}

/**
 * Get current device characteristics for verification
 * @returns {Promise<object>} Device characteristics
 */
export async function getDeviceCharacteristics() {
  try {
    const fp = await initializeFingerprint();
    const result = await fp.get();
    
    return {
      visitorId: result.visitorId,
      confidence: result.confidence?.score || 0,
      components: {
        screen: result.components.screenResolution?.value || 'unknown',
        timezone: result.components.timezone?.value || 'unknown',
        language: result.components.languages?.value || 'unknown',
        platform: result.components.platform?.value || 'unknown',
        cookiesEnabled: result.components.cookiesEnabled?.value || false
      }
    };
  } catch (error) {
    console.error('Error getting device characteristics:', error);
    return {
      visitorId: 'unknown',
      confidence: 0,
      components: {
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        cookiesEnabled: navigator.cookieEnabled
      }
    };
  }
}