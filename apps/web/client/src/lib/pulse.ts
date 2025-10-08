export function isPulseQualified(user: any): boolean {
  // New Logic: Any XP-earning action = Pulse active
  return user.xp > 0;
}