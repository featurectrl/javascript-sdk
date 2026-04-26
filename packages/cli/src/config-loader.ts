import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Config, ResolvedConfig } from "@featurectrl/config";
import { createJiti } from "jiti";
import { CliError } from "./errors";
import { findDuplicates } from "./utils";

export async function loadConfig(cwd: string, configPath: string): Promise<ResolvedConfig> {
  const configAbsPath = resolve(cwd, configPath);
  if (!existsSync(configAbsPath)) {
    throw new CliError(`featurectrl: config not found at ${configAbsPath}`, 2);
  }

  const jiti = createJiti(import.meta.url, { interopDefault: true, moduleCache: false });

  let module: unknown;
  try {
    module = await jiti.import<unknown>(configAbsPath);
  } catch (err) {
    throw new CliError(
      `featurectrl: failed to load ${configAbsPath}: ${(err as Error).message}`,
      2,
    );
  }

  const moduleDefaultExport = (module as { default?: unknown }).default ?? module;
  if (!moduleDefaultExport || typeof moduleDefaultExport !== "object") {
    throw new CliError(`featurectrl: ${configAbsPath} did not export a config object`, 2);
  }

  const config = moduleDefaultExport as Partial<Config>;
  if (typeof config.app !== "string" || config.app.length === 0) {
    throw new CliError(`featurectrl: config is missing required "app" string`, 2);
  }
  if (!config.flags || typeof config.flags !== "object") {
    throw new CliError(`featurectrl: config is missing required "flags" object`, 2);
  }
  if (!Array.isArray(config.segments) || !config.segments.every((s) => typeof s === "string")) {
    throw new CliError(`featurectrl: config "segments" must be a string[]`, 2);
  }

  const dupes = findDuplicates(config.segments);
  if (dupes.length > 0) {
    throw new CliError(`featurectrl: duplicate segment names: ${dupes.join(", ")}`, 2);
  }

  if (
    config.outputFile !== undefined &&
    (typeof config.outputFile !== "string" || config.outputFile.length === 0)
  ) {
    throw new CliError(`featurectrl: config "outputFile" must be a non-empty string`, 2);
  }

  return config as ResolvedConfig;
}
