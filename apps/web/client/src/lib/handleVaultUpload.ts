import { grantXP, canGrantXP } from "./xpEngine";
import { checkAndGrantReferralXP } from "./referral";
import { computeSignalStatus } from "./signal";
import { isPulseQualified } from "./pulse";
import { XP_ACTIONS, XP_RULES } from "./xpRules";

export async function handleVaultUpload(user: any) {
  const updates: Record<string, any> = {};
  const now = new Date();

  let xpGranted = false;
  if (canGrantXP(user, XP_ACTIONS.vaultUpload, now)) {
    const xpAmount = XP_RULES.vaultUpload.amount;
    await grantXP(user, XP_ACTIONS.vaultUpload, xpAmount, now);
    user.xp += xpAmount;
    user.lastVaultUploadXPAt = now;
    updates.xp = user.xp;
    xpGranted = true;
  }

  const referralXPGranted = await checkAndGrantReferralXP(user);

  const newSignal = computeSignalStatus(user);
  if (user.signal !== newSignal) {
    user.signal = newSignal;
    updates.signal = newSignal;
  }

  const pulseQualified = isPulseQualified(user);
  if (user.pulseQualified !== pulseQualified) {
    user.pulseQualified = pulseQualified;
    updates.pulseQualified = pulseQualified;
  }

  return {
    xpGranted,
    referralXPGranted,
    signal: user.signal,
    pulseQualified: user.pulseQualified,
    updatedFields: Object.keys(updates),
  };
}