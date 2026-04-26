import http from "node:http";
import https from "node:https";
import type { FeatureFlagName, FeatureFlagSegmentName } from "@featurectrl/config";
import type { FeatureFlag } from "./types";

export type ApiClientOptions = {
  app: string;
  endpoint?: string;
  apiKey: string;
  agent?: http.Agent | https.Agent;
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
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly app: string;
  private readonly agent: http.Agent | https.Agent | undefined;
  private readonly signal: AbortSignal;

  constructor({
    app,
    endpoint = "https://api.featurectrl.io",
    apiKey,
    agent,
    signal,
  }: ApiClientOptions) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.app = app;
    this.agent = agent;
    this.signal = signal;
  }

  async getFeatureFlags(): Promise<Map<FeatureFlagName, FeatureFlag>> {
    const url = new URL(`${this.endpoint}/v1/flags`);

    const body = await this.request(url, {
      Authorization: `Bearer ${this.apiKey}`,
      "X-App": this.app,
      "X-Sdk": SDK_VERSION,
    });

    const { data } = JSON.parse(body) as ApiResponse;

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

  private request(url: URL, headers: Record<string, string>): Promise<string> {
    const lib = url.protocol === "http:" ? http : https;

    return new Promise((resolve, reject) => {
      const req = lib.request(
        url,
        {
          method: "GET",
          headers,
          agent: this.agent,
          signal: this.signal,
        },
        (res) => {
          const status = res.statusCode ?? 0;
          const chunks: Buffer[] = [];
          res.on("data", (chunk: Buffer) => chunks.push(chunk));
          res.on("end", () => {
            if (status < 200 || status >= 300) {
              reject(
                new Error(
                  `featurectrl: failed to fetch flags (${status} ${res.statusMessage ?? ""})`,
                ),
              );
              return;
            }
            resolve(Buffer.concat(chunks).toString("utf8"));
          });
          res.on("error", reject);
        },
      );

      req.on("error", reject);
      req.end();
    });
  }
}
