import type { FeatureFlagName, FeatureFlagSegmentName } from "@featurectrl/config";
import type { FeatureFlag } from "./types";

export type ApiClientOptions = {
  app: string;
  endpoint?: string;
  apiKey: string;
  fetch?: typeof fetch;
  signal: AbortSignal;
};

const SDK_VERSION = "0.0.1";

export type ApiResponse = {
  data: {
    flags: {
      name: string;
      defaultValue: boolean;
      config: {
        enabledForSegments: string[];
        disabledForSegments: string[];
      };
    }[];
  };
};

export class ApiClient {
  private readonly _endpoint: string;
  private readonly _apiKey: string;
  private readonly _app: string;
  private readonly _fetch: typeof fetch;
  private readonly _signal: AbortSignal;

  constructor({
    app,
    endpoint = "https://api.featurectrl.io",
    apiKey,
    fetch: fetchFn,
    signal,
  }: ApiClientOptions) {
    this._endpoint = endpoint;
    this._apiKey = apiKey;
    this._app = app;
    this._fetch = fetchFn ?? fetch;
    this._signal = signal;
  }

  async getFeatureFlags(): Promise<Map<FeatureFlagName, FeatureFlag>> {
    const resp = await this._fetch(`${this._endpoint}/v1/flags`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this._apiKey}`,
        "X-App": this._app,
        "X-Sdk": SDK_VERSION,
      },
      signal: this._signal,
    });

    if (!resp.ok) {
      throw new Error(`featurectrl: failed to fetch flags (${resp.status} ${resp.statusText})`);
    }

    const { data } = (await resp.json()) as ApiResponse;

    const map = new Map<FeatureFlagName, FeatureFlag>();
    for (const flagDef of data.flags) {
      map.set(flagDef.name as FeatureFlagName, {
        name: flagDef.name as FeatureFlagName,
        defaultValue: flagDef.defaultValue,
        enabledForSegments: new Set(
          flagDef.config.enabledForSegments ?? [],
        ) as Set<FeatureFlagSegmentName>,
        disabledForSegments: new Set(
          flagDef.config.disabledForSegments ?? [],
        ) as Set<FeatureFlagSegmentName>,
      });
    }

    return map;
  }
}
