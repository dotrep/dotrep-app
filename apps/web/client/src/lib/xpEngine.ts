import { XP_RULES } from "./xpRules";

export function canGrantXP(user: any, action: string, now: Date): boolean {
  const rule = (XP_RULES as any)[action];
  if (!rule) return false;
  
  const lastTime = user[`last${capitalize(action)}XPAt`];

  const timeSinceLast = lastTime ? (now.getTime() - new Date(lastTime).getTime()) / 1000 : Infinity;
  const today = new Date().toISOString().slice(0, 10);
  const grantedToday = user?.xpLog?.[today]?.[action] || 0;

  return timeSinceLast > rule.cooldownSeconds && grantedToday < rule.maxPerDay;
}

export async function grantXP(user: any, action: string, amount: number, now: Date) {
  const today = new Date().toISOString().slice(0, 10);
  user.xpLog = user.xpLog || {};
  user.xpLog[today] = user.xpLog[today] || {};
  user.xpLog[today][action] = (user.xpLog[today][action] || 0) + 1;
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function computePulseLevel(totalXP: number): number {
  if (totalXP >= 1000) return 4; // Sentinel Pulse
  if (totalXP >= 500) return 3;  // Core Pulse
  if (totalXP >= 250) return 2;  // Stable Pulse
  if (totalXP > 0) return 1;     // Initial Pulse
  return 0; // No pulse
}

export function getPulseLabel(level: number): string {
  switch(level) {
    case 1: return "Initial Pulse";
    case 2: return "Stable Pulse";
    case 3: return "Core Pulse";
    case 4: return "Sentinel Pulse";
    default: return "Inactive";
  }
}

export function isPulseActive(totalXP: number): boolean {
  return totalXP > 0;
}