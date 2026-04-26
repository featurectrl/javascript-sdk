import type { FeatureFlagName } from "@featurectrl/config";
import type { FeatureFlag } from "../types";
import type { CacheAdapter } from "./adapter";

/**
 * Per-instance in-memory cache. Each adapter owns its own store, so multiple
 * `Client`s sharing one adapter share the warm snapshot, while independent
 * adapters stay isolated.
 */
export class InMemoryCacheAdapter implements CacheAdapter {
  private readonly store = new Map<string, Map<FeatureFlagName, FeatureFlag>>();

  readData({ app }: { app: string }): Map<FeatureFlagName, FeatureFlag> | undefined {
    const snap = this.store.get(app);
    if (!snap) {
      return undefined;
    }
    return new Map(snap);
  }

  updateData({
    app,
    data,
  }: {
    app: string;
    data: ReadonlyMap<FeatureFlagName, FeatureFlag>;
  }): void {
    this.store.set(app, new Map(data));
  }
}
