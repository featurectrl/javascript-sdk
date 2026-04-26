import { type ConfigDefaults, defaultConfig } from "./default-config";

export type FlagDeclaration = {
  defaultValue?: boolean;
  description?: string;
};

// biome-ignore lint/suspicious/noEmptyInterface: interface is overridden in client code
export interface FeatureFlagRegistry {}

// biome-ignore lint/suspicious/noEmptyInterface: interface is overridden in client code
export interface FeatureFlagSegmentRegistry {}

export type FeatureFlagName = keyof FeatureFlagRegistry & string;
export type FeatureFlagSegmentName = keyof FeatureFlagSegmentRegistry & string;

export interface Config {
  app: string;
  flags: Record<string, FlagDeclaration>;
  segments: string[];
  /** Path of the generated .d.ts, relative to cwd. Defaults to `featurectrl.d.ts`. */
  outputFile?: string;
}

export type ResolvedConfig = Config & ConfigDefaults;

export function defineConfig(config: Config): ResolvedConfig {
  return {
    ...defaultConfig,
    ...config,
  };
}
