/**
 * IP address retrieval utility for FSN identity verification
 * Fetches user's IP address from backend for soulbinding
 */

/**
 * Get the user's IP address from the server
 * @returns {Promise<string>} User's IP address
 */
export async function getUserIP() {
  try {
    const response = await fetch('/api/user/ip', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get IP address: ${response.status}`);
    }

    const data = await response.json();
    return data.ip || 'unknown';
  } catch (error) {
    console.error('Error fetching user IP:', error);
    // Return fallback IP (this should not happen in production)
    return 'unknown';
  }
}

/**
 * Get user's location info (optional for enhanced verification)
 * @returns {Promise<object>} Location information
 */
export async function getUserLocation() {
  try {
    const response = await fetch('/api/user/location', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get location: ${response.status}`);
    }

    const data = await response.json();
    return {
      country: data.country || 'unknown',
      region: data.region || 'unknown',
      city: data.city || 'unknown',
      timezone: data.timezone || 'unknown'
    };
  } catch (error) {
    console.error('Error fetching user location:', error);
    return {
      country: 'unknown',
      region: 'unknown', 
      city: 'unknown',
      timezone: 'unknown'
    };
  }
}