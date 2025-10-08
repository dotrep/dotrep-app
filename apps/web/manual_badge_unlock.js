// Manual badge unlock for testing
// Run this in browser console to unlock Trust Verified badge

console.log("🔓 Unlocking Trust Verified badge...");
localStorage.setItem('trustBadgeUnlocked', 'true');
console.log("✅ Trust Verified badge unlocked!");
console.log("🔄 Please refresh the Social page to see your badge");

// Also unlock Core Signal badge for testing
localStorage.setItem('coreSignalBadgeUnlocked', 'true');
console.log("✅ Core Signal badge also unlocked!");

// Trigger storage event to update any listening components
window.dispatchEvent(new Event('storage'));