import flags from "../config/feature-flags.json"

export function isEnabled(key: string): boolean {
  return (flags as any)[key] === true
}

export function getFeatureFlags() {
  return flags
}