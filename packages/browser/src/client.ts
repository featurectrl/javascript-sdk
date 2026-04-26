import type { FeatureFlagName } from "@featurectrl/config";
import { ApiClient } from "./api";
import type { ClientCache } from "./cache";
import { evaluate } from "./evaluate";
import type { FeatureFlag, Identity } from "./types";
import { type AsyncController, createAsyncController } from "./utils/async-controller";
import { Pub } from "./utils/pub";

/** Options accepted by the {@link Client} constructor. */
export type ClientConstructorOptions = {
  /** App identifier; may include an optional `app/version` suffix (e.g. `"featurectrl/1.0"`). */
  app: string;

  endpoint?: string;
  /** When omitted, the client runs in offline mode: no network, evaluates only cached/default values. */
  apiKey: string | undefined;
  fetch?: typeof fetch;

  /** Optional persistent cache; pass `null` (or omit) to disable caching. */
  cache?: ClientCache | null;
};

/** Stable identification of which app/version this client is reading flags for. */
export type ClientMetadata = {
  app: string;
};

/**
 * Lifecycle and state-change events emitted by {@link Client.subscribe}.
 *
 * - `ready`: initial flag load attempt finished (either success or failure).
 * - `identityUpdated`: `identify()` was called and changed the identity.
 * - `flagsUpdated`: a network refresh produced a new flag set.
 * - `error`: a flag fetch failed (not emitted for aborts caused by `destroy()`).
 */
export type ClientEvent =
  | { type: "ready" }
  | { type: "identityUpdated"; identity: Identity | null }
  | { type: "flagsUpdated"; flags: FeatureFlagName[] }
  | { type: "error"; error: unknown };

export type ClientEventType = ClientEvent["type"];

/**
 * SDK Client
 *
 * Flag fetches happen in the background; the client is usable immediately
 * (returning cached values) and emits `ready` once the first fetch attempt settles.
 */
export class Client {
  public readonly metadata: ClientMetadata;

  private readonly _api: ApiClient | null;
  private readonly _cache: ClientCache | null;
  private readonly _pub: Pub<ClientEvent>;
  private readonly _abort: AbortController;

  private _readyState: boolean;
  private _readyCtrl: AsyncController;

  private _identityValue: Identity | null = null;
  private _flags: Map<FeatureFlagName, FeatureFlag>;

  constructor(opts: ClientConstructorOptions) {
    this.metadata = {
      app: opts.app,
    };

    this._abort = new AbortController();

    this._api = opts.apiKey
      ? new ApiClient({
          app: opts.app,
          endpoint: opts.endpoint,
          apiKey: opts.apiKey,
          fetch: opts.fetch,
          signal: this._abort.signal,
        })
      : null;

    this._pub = new Pub<ClientEvent>();

    this._cache = opts.cache ?? null;
    this._flags =
      this._cache?.readData({
        app: this.metadata.app,
      }) ?? new Map<FeatureFlagName, FeatureFlag>();

    this._readyState = false;
    this._readyCtrl = createAsyncController();

    void this.refresh();
  }

  /** The identity currently used for flag evaluation */
  get identity(): Identity | null {
    return this._identityValue;
  }

  /** Sets the active identity. */
  identify(identity: Identity | null): void {
    this._assertAlive();

    this._identityValue = identity;
    this._pub.emit({ type: "identityUpdated", identity });
  }

  /** Returns whether a feature flag is enabled */
  isEnabled(name: FeatureFlagName): boolean {
    this._assertAlive();

    const flag = this._flags.get(name);
    if (!flag) {
      return false;
    }

    return evaluate(this._identityValue, flag);
  }

  isReady(): boolean {
    return this._readyState && !this._abort.signal.aborted;
  }

  /** Resolves when the client becomes ready */
  whenReady(): Promise<void> {
    return this._readyCtrl._promise;
  }

  /**
   * Subscribes to lifecycle and state-change events; returns an unsubscribe function. */
  subscribe(listener: (event: ClientEvent) => void): () => void {
    return this._pub.on(listener);
  }

  /** Re-fetches flag definitions on demand. No-op when the client has no API key. */
  async refresh(): Promise<void> {
    this._assertAlive();

    await this._fetchFlags();

    if (!this._readyState) {
      this._readyState = true;
      this._readyCtrl._resolve();
      this._pub.emit({ type: "ready" });
    }
  }

  /** Aborts in-flight requests and prevents further use of the client. */
  destroy(): void {
    if (!this._readyState) {
      this._readyCtrl._resolve();
    }

    this._abort.abort();
  }

  private async _fetchFlags(): Promise<void> {
    this._assertAlive();
    if (!this._api) {
      return;
    }

    try {
      const flags = await this._api.getFeatureFlags();
      this._flags = flags;
      this._cache?.updateData({
        app: this.metadata.app,
        data: flags,
      });
      this._pub.emit({ type: "flagsUpdated", flags: Array.from(flags.keys()) });
    } catch (err) {
      if (!this._abort.signal.aborted) {
        this._pub.emit({ type: "error", error: err });
      }

      throw err;
    }
  }

  private _assertAlive(): void {
    this._abort.signal.throwIfAborted();
  }
}
