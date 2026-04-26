import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { loadConfig } from "../config-loader";
import { render } from "../render";

export type GenerateOptions = {
  check: boolean;
  configPath: string;
  cwd?: string;
};

export async function runGenerate(opts: GenerateOptions): Promise<number> {
  const cwd = opts.cwd ?? process.cwd();
  const config = await loadConfig(cwd, opts.configPath);

  const expected = render({
    app: config.app,
    flagNames: Object.keys(config.flags),
    segmentNames: config.segments,
  });

  const outPath = resolve(cwd, config.outputFile);
  const relPath = `./${relative(cwd, outPath) || config.outputFile}`;

  if (opts.check) {
    if (!existsSync(outPath)) {
      process.stderr.write(
        `featurectrl: ${relPath} does not exist. Run \`featurectrl generate\` to create it.\n`,
      );
      return 1;
    }

    const actual = (await readFile(outPath, "utf8")).replace(/\r\n/g, "\n");
    if (actual === expected) {
      process.stdout.write(`featurectrl: ${relPath} is up to date.\n`);
      return 0;
    }

    process.stderr.write(
      `featurectrl: ${relPath} is out of date. Run \`featurectrl generate\` to update.\n`,
    );
    return 1;
  }

  await writeFile(outPath, expected, "utf8");
  process.stdout.write(`featurectrl: wrote ${relPath}\n`);
  return 0;
}
