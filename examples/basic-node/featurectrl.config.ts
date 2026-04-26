import { defineConfig } from "@featurectrl/config";

export default defineConfig({
  app: "basic-node-example",
  outputFile: "src/featurectrl.d.ts",
  flags: {
    "new-checkout": {
      defaultValue: false,
      description: "Render the redesigned checkout flow",
    },
  },
  segments: ["beta", "internal"],
});
