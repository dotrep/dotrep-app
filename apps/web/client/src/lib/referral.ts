export async function checkAndGrantReferralXP(user: any): Promise<boolean> {
  if (!user.referredBy || user.referralBonusGiven) return false;

  // Give referrer 5 XP
  // (You would fetch referrer from DB and update their XP here)
  user.referralBonusGiven = true;
  return true;
}