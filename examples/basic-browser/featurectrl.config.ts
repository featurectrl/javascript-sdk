import { defineConfig } from "@featurectrl/config";

export default defineConfig({
  app: "basic-browser-example/1.0.0",
  outputFile: "src/featurectrl.d.ts",
  flags: {
    "new-checkout": {
      defaultValue: false,
      description: "Render the redesigned checkout flow",
    },
  },
  segments: ["beta", "internal"],
});
