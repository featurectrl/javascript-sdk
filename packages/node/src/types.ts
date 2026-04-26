import type { FeatureFlagName, FeatureFlagSegmentName } from "@featurectrl/config";

export type Identity = {
  id: string;
  segments: FeatureFlagSegmentName[];
};

export type FeatureFlag<T extends FeatureFlagName = FeatureFlagName> = {
  name: T;
  defaultValue: boolean;
  enabledForSegments: ReadonlySet<FeatureFlagSegmentName>;
  disabledForSegments: ReadonlySet<FeatureFlagSegmentName>;
};
