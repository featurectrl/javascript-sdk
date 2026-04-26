import type { FeatureFlagName } from "@featurectrl/config";
import type { FeatureFlag } from "../types";

/**
 * Pluggable cache backend used by {@link Client} to keep a warm flag snapshot
 * across instantiations.
 */
export interface CacheAdapter {
  readData(args: { app: string }): Map<FeatureFlagName, FeatureFlag> | undefined;
  updateData(args: { app: string; data: ReadonlyMap<FeatureFlagName, FeatureFlag> }): void;
}
