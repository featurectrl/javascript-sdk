# @featurectrl/node

[![npm version](https://img.shields.io/npm/v/@featurectrl/node.svg)](https://www.npmjs.com/package/@featurectrl/node)
[![license](https://img.shields.io/npm/l/@featurectrl/node.svg)](./LICENSE)

Node.js SDK for [featurectrl](https://featurectrl.io) feature flags.
Tree-shakeable, zero runtime dependencies, uses Node's built-in `node:http` / `node:https`.

## Installation

```sh
npm install @featurectrl/node
# or
pnpm add @featurectrl/node
# or
yarn add @featurectrl/node
# or
bun add @featurectrl/node
```

## Quick start

```ts
import { Client } from "@featurectrl/node";

const client = new Client({
  app: "my-service",
  version: "1.0.0",
  apiKey: process.env.FEATURECTRL_API_KEY,
});

client.identify({
  id: "user_123",
  segments: ["beta", "internal"],
});

await client.whenReady();

if (client.isEnabled("new-checkout")) {
  // serve the new checkout
}
```

## In-memory cache

Cache adapters live under the `/cache` subpath so unused adapters tree-shake away.

```ts
import { Client } from "@featurectrl/node";
import { InMemoryCacheAdapter } from "@featurectrl/node/cache";

const client = new Client({
  app: "my-service",
  apiKey: process.env.FEATURECTRL_API_KEY,
  cache: new InMemoryCacheAdapter(),
});
```

## Connection pooling

Pass a custom `http.Agent` / `https.Agent` to enable keep-alive, tune pool sizes,
or route through a proxy:

```ts
import https from "node:https";
import { Client } from "@featurectrl/node";

const client = new Client({
  app: "my-service",
  apiKey: process.env.FEATURECTRL_API_KEY,
  agent: new https.Agent({ keepAlive: true }),
});
```

## License

[MIT](./LICENSE)
