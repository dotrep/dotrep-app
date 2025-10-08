// Onboarding task completion detection utilities

// Task completion detection functions
export const detectTaskCompletion = {
  // Detect FSN name claim completion
  async checkFsnClaim(userId) {
    try {
      const response = await fetch(`/api/user/profile`);
      const userData = await response.json();
      return !!userData.fsnName; // Has FSN name
    } catch (error) {
      console.error('Error checking FSN claim:', error);
      return false;
    }
  },

  // Detect beacon recast completion
  async checkBeaconRecast(userId) {
    try {
      const response = await fetch('/api/user/stats');
      const userStats = await response.json();
      return (userStats.signalsSent || 0) > 0; // Has sent at least one broadcast
    } catch (error) {
      console.error('Error checking beacon recast:', error);
      return false;
    }
  },

  // Detect vault file upload completion
  async checkVaultUpload(userId) {
    try {
      const response = await fetch('/api/vault/items');
      const vaultItems = await response.json();
      return Array.isArray(vaultItems) && vaultItems.length > 0; // Has at least one vault item
    } catch (error) {
      console.error('Error checking vault upload:', error);
      return false;
    }
  },

  // Detect profile update completion
  async checkProfileUpdate(userId) {
    try {
      const response = await fetch(`/api/user/profile`);
      const userData = await response.json();
      // Profile is considered updated if user has email or any additional profile fields
      return !!userData.email || !!userData.bio; // Has email or bio
    } catch (error) {
      console.error('Error checking profile update:', error);
      return false;
    }
  }
};

// Function to check all task completions and update progress
export const updateOnboardingProgress = async () => {
  try {
    const tasks = {
      claimFsn: await detectTaskCompletion.checkFsnClaim(),
      recastBeacon: await detectTaskCompletion.checkBeaconRecast(),
      uploadVault: await detectTaskCompletion.checkVaultUpload(),
      updateProfile: await detectTaskCompletion.checkProfileUpdate()
    };

    // Update server with detected progress
    await fetch('/api/user/update-onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ tasks })
    });

    return tasks;
  } catch (error) {
    console.error('Error updating onboarding progress:', error);
    return {};
  }
};

// Hook for components to use onboarding detection
export const useOnboardingDetection = () => {
  const [tasks, setTasks] = useState({
    claimFsn: false,
    recastBeacon: false,
    uploadVault: false,
    updateProfile: false
  });

  const updateProgress = async () => {
    const detectedTasks = await updateOnboardingProgress();
    setTasks(detectedTasks);
  };

  return { tasks, updateProgress };
};