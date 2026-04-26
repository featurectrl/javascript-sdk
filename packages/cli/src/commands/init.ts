import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { basename, relative, resolve } from "node:path";
import { CliError } from "../errors";
import { runGenerate } from "./generate";

export type InitOptions = {
  configPath: string;
  overwrite: boolean;
  cwd?: string;
};

export async function runInit(opts: InitOptions): Promise<number> {
  const cwd = opts.cwd ?? process.cwd();
  const resolvedConfigPath = resolve(cwd, opts.configPath);
  const relativeConfigPath = `./${relative(cwd, resolvedConfigPath) || opts.configPath}`;

  if (existsSync(resolvedConfigPath) && !opts.overwrite) {
    throw new CliError(
      `featurectrl: ${relativeConfigPath} already exists. Re-run with --overwrite to replace it.`,
      1,
    );
  }

  const app = await resolveAppName(cwd);
  const content =
    `import { defineConfig } from "@featurectrl/config";\n` +
    `\n` +
    `export default defineConfig({\n` +
    `  app: ${JSON.stringify(app)},\n` +
    `  flags: {},\n` +
    `  segments: ["staff", "developers"],\n` +
    `});\n`;

  await writeFile(resolvedConfigPath, content, "utf8");
  process.stdout.write(`featurectrl: wrote ${relativeConfigPath}\n`);

  return runGenerate({ check: false, configPath: opts.configPath, cwd });
}

async function resolveAppName(cwd: string): Promise<string> {
  const pkgPath = resolve(cwd, "package.json");
  if (existsSync(pkgPath)) {
    let raw: string;
    try {
      raw = await readFile(pkgPath, "utf8");
    } catch (err) {
      throw new CliError(`featurectrl: failed to read ${pkgPath}: ${(err as Error).message}`, 2);
    }
    let pkg: unknown;
    try {
      pkg = JSON.parse(raw);
    } catch (err) {
      throw new CliError(`featurectrl: failed to parse ${pkgPath}: ${(err as Error).message}`, 2);
    }
    const name = (pkg as { name?: unknown }).name;
    if (typeof name === "string" && name.length > 0) {
      const stripped = name.startsWith("@") ? (name.split("/", 2)[1] ?? "") : name;
      if (stripped.length > 0) return stripped;
    }
  }

  const dir = basename(cwd);
  if (dir.length === 0) {
    throw new CliError("featurectrl: could not determine app name", 2);
  }
  return dir;
}
