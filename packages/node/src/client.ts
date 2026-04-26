import { EventEmitter } from "node:events";
import type http from "node:http";
import type https from "node:https";
import type { FeatureFlagName } from "@featurectrl/config";
import { ApiClient } from "./api";
import type { CacheAdapter } from "./cache";
import { evaluate } from "./evaluate";
import type { FeatureFlag, Identity } from "./types";
import { type AsyncController, createAsyncController } from "./utils/async-controller";

/** Options accepted by the {@link Client} constructor. */
export type ClientConstructorOptions = {
  /** App identifier; may include an optional `app/version` suffix (e.g. `"featurectrl/1.0"`). */
  app: string;

  endpoint?: string;
  /** When omitted, the client runs in offline mode: no network, evaluates only cached/default values. */
  apiKey: string | undefined;
  /** Custom `http.Agent` / `https.Agent` for connection pooling, keep-alive, proxy, etc. */
  agent?: http.Agent | https.Agent;

  /** Optional persistent cache; pass `null` (or omit) to disable caching. */
  cache?: CacheAdapter | null;
};

/** Stable identification of which app this client is reading flags for. */
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

type ClientEmitterEvents = {
  event: [ClientEvent];
};

/**
 * SDK Client
 *
 * Flag fetches happen in the background; the client is usable immediately
 * (returning cached values) and emits `ready` once the first fetch attempt settles.
 */
export class Client {
  public readonly metadata: ClientMetadata;

  private readonly api: ApiClient | null;
  private readonly cache: CacheAdapter | null;
  private readonly emitter: EventEmitter<ClientEmitterEvents>;
  private readonly abort: AbortController;

  private readyState: boolean;
  private readyCtrl: AsyncController;

  private activeIdentity: Identity | null = null;
  private flags: Map<FeatureFlagName, FeatureFlag>;

  constructor(opts: ClientConstructorOptions) {
    this.metadata = {
      app: opts.app,
    };

    this.abort = new AbortController();

    this.api = opts.apiKey
      ? new ApiClient({
          app: opts.app,
          endpoint: opts.endpoint,
          apiKey: opts.apiKey,
          agent: opts.agent,
          signal: this.abort.signal,
        })
      : null;

    this.emitter = new EventEmitter<ClientEmitterEvents>();

    this.cache = opts.cache ?? null;
    this.flags =
      this.cache?.readData({
        app: this.metadata.app,
      }) ?? new Map<FeatureFlagName, FeatureFlag>();

    this.readyState = false;
    this.readyCtrl = createAsyncController();

    void this.refresh();
  }

  /** The identity currently used for flag evaluation */
  get identity(): Identity | null {
    return this.activeIdentity;
  }

  /** Sets the active identity. */
  identify(identity: Identity | null): void {
    this.assertAlive();

    this.activeIdentity = identity;
    this.emit({ type: "identityUpdated", identity });
  }

  /** Returns whether a feature flag is enabled */
  isEnabled(name: FeatureFlagName): boolean {
    this.assertAlive();

    const flag = this.flags.get(name);
    if (!flag) {
      return false;
    }

    return evaluate(this.activeIdentity, flag);
  }

  isReady(): boolean {
    return this.readyState && !this.abort.signal.aborted;
  }

  /** Resolves when the client becomes ready */
  whenReady(): Promise<void> {
    return this.readyCtrl.promise;
  }

  /**
   * Subscribes to lifecycle and state-change events; returns an unsubscribe function. */
  subscribe(listener: (event: ClientEvent) => void): () => void {
    this.emitter.on("event", listener);
    return () => {
      this.emitter.off("event", listener);
    };
  }

  /** Re-fetches flag definitions on demand. No-op when the client has no API key. */
  async refresh(): Promise<void> {
    this.assertAlive();

    await this.fetchFlags();

    if (!this.readyState) {
      this.readyState = true;
      this.readyCtrl.resolve();
      this.emit({ type: "ready" });
    }
  }

  /** Aborts in-flight requests and prevents further use of the client. */
  destroy(): void {
    if (!this.readyState) {
      this.readyCtrl.resolve();
    }

    this.abort.abort();
  }

  private async fetchFlags(): Promise<void> {
    this.assertAlive();
    if (!this.api) {
      return;
    }

    try {
      const flags = await this.api.getFeatureFlags();
      this.flags = flags;
      this.cache?.updateData({
        app: this.metadata.app,
        data: flags,
      });
      this.emit({ type: "flagsUpdated", flags: Array.from(flags.keys()) });
    } catch (err) {
      if (!this.abort.signal.aborted) {
        this.emit({ type: "error", error: err });
      }

      throw err;
    }
  }

  private assertAlive(): void {
    this.abort.signal.throwIfAborted();
  }

  private emit(event: ClientEvent): void {
    this.emitter.emit("event", event);
  }
}
