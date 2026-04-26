import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: false,
  sourcemap: true,
  clean: true,
  target: "node18",
  platform: "node",
  splitting: false,
  minify: false,
  banner: { js: "#!/usr/bin/env node" },
  external: ["@featurectrl/config", "jiti"],
});
