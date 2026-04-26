import type { FeatureFlag, Identity } from "./types";

/**
 * Resolves a flag to a boolean for the given identity.
 */
export function evaluate(identity: Identity | null, flag: FeatureFlag): boolean {
  if (!identity) {
    return flag.defaultValue;
  }
  for (const segment of identity.segments) {
    if (flag.enabledForSegments.has(segment)) {
      return true;
    }

    if (flag.disabledForSegments.has(segment)) {
      return false;
    }
  }

  return flag.defaultValue;
}
