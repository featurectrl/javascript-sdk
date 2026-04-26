import { parseArgs } from "node:util";
import { runGenerate } from "./commands/generate";
import { runInit } from "./commands/init";
import { CliError } from "./errors";

const HELP = `featurectrl - generate types from your config

Usage:
  featurectrl <command> [options]

Commands:
  init                Create featurectrl.config.ts and run generate.
  generate            Write featurectrl.d.ts in the current directory.

Options:
  --check             Verify featurectrl.d.ts matches the config; exit 1 on drift.
  -c, --config <path> Path to config file (default: ./featurectrl.config.ts).
  --overwrite         Replace featurectrl.config.ts if it already exists (init only).
  -h, --help          Show this help.
  --version           Show version.
`;

const VERSION = "0.0.1";

async function main(): Promise<number> {
  let parsed: ReturnType<
    typeof parseArgs<{
      options: {
        check: { type: "boolean" };
        config: { type: "string"; short: "c" };
        overwrite: { type: "boolean" };
        help: { type: "boolean"; short: "h" };
        version: { type: "boolean" };
      };
      allowPositionals: true;
      strict: true;
    }>
  >;

  try {
    parsed = parseArgs({
      args: process.argv.slice(2),
      allowPositionals: true,
      strict: true,
      options: {
        check: { type: "boolean", default: false },
        config: { type: "string", short: "c", default: "./featurectrl.config.ts" },
        overwrite: { type: "boolean", default: false },
        help: { type: "boolean", short: "h", default: false },
        version: { type: "boolean", default: false },
      },
    });
  } catch (err) {
    throw new CliError((err as Error).message, 2);
  }

  const { values, positionals } = parsed;

  if (values.version) {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }

  const cmd = positionals[0];
  if (values.help || cmd === undefined) {
    process.stdout.write(HELP);
    return cmd === undefined && !values.help ? 2 : 0;
  }

  if (cmd === "generate") {
    return runGenerate({
      check: values.check ?? false,
      configPath: values.config ?? "./featurectrl.config.ts",
    });
  }

  if (cmd === "init") {
    return runInit({
      configPath: values.config ?? "./featurectrl.config.ts",
      overwrite: values.overwrite ?? false,
    });
  }

  throw new CliError(`Unknown command: ${cmd}`, 2);
}

main().then(
  (code) => {
    process.exit(code);
  },
  (err: unknown) => {
    if (err instanceof CliError) {
      process.stderr.write(`${err.message}\n`);
      process.exit(err.exitCode);
    }
    process.stderr.write(`featurectrl: ${(err as Error).stack ?? String(err)}\n`);
    process.exit(1);
  },
);
