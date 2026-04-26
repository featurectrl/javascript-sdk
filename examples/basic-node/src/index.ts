import { Client } from "@featurectrl/node";

const client = new Client({
  app: "basic-node-example/1.0.0",
  apiKey: process.env.FEATURECTRL_API_KEY,
});

client.identify({
  id: "user_123",
  segments: ["beta"],
});

await client.whenReady();

const enabled = client.isEnabled("new-checkout");
console.log(`new-checkout: ${enabled ? "on" : "off"}`);

client.destroy();
