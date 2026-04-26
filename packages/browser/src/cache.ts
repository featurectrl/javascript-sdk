import type { FeatureFlagName, FeatureFlagSegmentName } from "@featurectrl/config";
import type { FeatureFlag } from "./types";

export type ClientCacheOptions = {
  storage?: Storage;
  storageKey?: string;
};

type SerializedFlag = {
  name: string;
  defaultValue: boolean;
  enabledForSegments: string[];
  disabledForSegments: string[];
};

type SerializedCache = {
  version: number;
  data: SerializedFlag[];
};

/** `Storage`-backed cache so the client has flags ready before the next network refresh. */
export class ClientCache {
  private static _VERSION = 1;

  private readonly _storage: Storage;
  private readonly _storageKey: string;

  constructor({ storage, storageKey }: ClientCacheOptions) {
    this._storage = storage ?? localStorage;
    this._storageKey = storageKey ?? "featurectrl_cache";
  }

  /** Stores the latest flags for `app`, replacing any previous snapshot. */
  updateData({
    app,
    data,
  }: {
    app: string;
    data: ReadonlyMap<FeatureFlagName, FeatureFlag>;
  }): void {
    const key = `${this._storageKey}:${app}`;

    const payload: SerializedCache = {
      version: ClientCache._VERSION,
      data: Array.from(data.values()).map((flag) => ({
        name: flag.name,
        defaultValue: flag.defaultValue,
        enabledForSegments: [...flag.enabledForSegments],
        disabledForSegments: [...flag.disabledForSegments],
      })),
    };

    try {
      this._storage.setItem(key, JSON.stringify(payload));
    } catch {
      // quota exceeded, storage disabled, etc. - caching is best-effort
    }
  }

  /**
   * Returns the previously cached flags for `app`, or `undefined` if missing,
   * unreadable, or written by a different cache schema version.
   */
  readData({ app }: { app: string }): Map<FeatureFlag["name"], FeatureFlag> | undefined {
    const key = `${this._storageKey}:${app}`;

    let raw: string | null;
    try {
      raw = this._storage.getItem(key);

      if (!raw) {
        return undefined;
      }
    } catch {
      return undefined;
    }

    try {
      const parsed = JSON.parse(raw) as SerializedCache;

      if (!parsed || parsed.version !== ClientCache._VERSION || !Array.isArray(parsed.data)) {
        return undefined;
      }

      const map = new Map<FeatureFlagName, FeatureFlag>();
      for (const flag of parsed.data) {
        map.set(flag.name as FeatureFlagName, {
          name: flag.name as FeatureFlagName,
          defaultValue: flag.defaultValue,
          enabledForSegments: new Set(flag.enabledForSegments) as Set<FeatureFlagSegmentName>,
          disabledForSegments: new Set(flag.disabledForSegments) as Set<FeatureFlagSegmentName>,
        });
      }

      return map;
    } catch {
      return undefined;
    }
  }
}
