export function computeSignalStatus(user: any): string {
  if (user.xp > 200) return "sentinel";
  if (user.xp > 100) return "core";
  if (user.xp > 50) return "basic";
  return "none";
}