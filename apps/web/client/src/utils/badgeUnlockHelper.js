// Helper functions to manually unlock badges for testing/debugging

export function unlockTrustBadge() {
  localStorage.setItem('trustBadgeUnlocked', 'true');
  console.log('Trust Verified badge unlocked!');
  // Trigger a page refresh or badge component update
  window.dispatchEvent(new Event('storage'));
}

export function unlockCoreSignalBadge() {
  localStorage.setItem('coreSignalBadgeUnlocked', 'true');
  console.log('Core Signal badge unlocked!');
  window.dispatchEvent(new Event('storage'));
}

export function unlockOnboardingBadge() {
  localStorage.setItem('onboardingBadgeUnlocked', 'true');
  console.log('Onboarding badge unlocked!');
  window.dispatchEvent(new Event('storage'));
}

export function resetAllBadges() {
  localStorage.removeItem('trustBadgeUnlocked');
  localStorage.removeItem('coreSignalBadgeUnlocked');
  localStorage.removeItem('onboardingBadgeUnlocked');
  console.log('All badge unlocks reset!');
  window.dispatchEvent(new Event('storage'));
}

// Debug function to check badge status
export function checkBadgeStatus() {
  console.log('Badge Status:');
  console.log('Trust Verified:', localStorage.getItem('trustBadgeUnlocked') === 'true');
  console.log('Core Signal:', localStorage.getItem('coreSignalBadgeUnlocked') === 'true');
  console.log('Onboarding:', localStorage.getItem('onboardingBadgeUnlocked') === 'true');
}