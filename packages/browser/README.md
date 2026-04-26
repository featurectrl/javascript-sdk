# @featurectrl/browser

[![npm version](https://img.shields.io/npm/v/@featurectrl/browser.svg)](https://www.npmjs.com/package/@featurectrl/browser)
[![license](https://img.shields.io/npm/l/@featurectrl/browser.svg)](./LICENSE)

Browser JavaScript SDK for [featurectrl](https://featurectrl.io) feature flags.
Tiny, tree-shakeable, zero runtime dependencies

## Installation

```sh
npm install @featurectrl/browser
# or
pnpm add @featurectrl/browser
# or
yarn add @featurectrl/browser
# or
bun add @featurectrl/browser
```

## Quick start

```ts
import {Client} from "@featurectrl/browser";

const client = new Client({
  app: "my-web-app",
  version: "1.0.0",
  apiKey: process.env.FEATURECTRL_API_KEY,
});

client.identify({
  id: "user_123",
  segments: ["beta", "internal"],
});

await client.whenReady();

if (client.isEnabled("new-checkout")) {
  // render the new checkout
}
```

## License

[MIT](./LICENSE)