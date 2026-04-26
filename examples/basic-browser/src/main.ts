import { Client } from "@featurectrl/browser";
import { onRefresh, updateFlagWidget } from "./ui";

const client = new Client({
  app: "featurectrl-basic-browser-example",
  apiKey: import.meta.env.VITE_FEATURECTRL_API_KEY,
});

client.identify({
  id: "user_123",
  segments: ["beta"],
});

await client.whenReady();

updateFlagWidget(client.isEnabled("new-checkout"));

onRefresh(async () => {
  updateFlagWidget(undefined);
  await client.refresh();
  updateFlagWidget(client.isEnabled("new-checkout"));
});
