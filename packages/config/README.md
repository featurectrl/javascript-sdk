# @featurectrl/config

[![npm version](https://img.shields.io/npm/v/@featurectrl/config.svg)](https://www.npmjs.com/package/@featurectrl/config)
[![license](https://img.shields.io/npm/l/@featurectrl/config.svg)](./LICENSE)

Shared configuration helpers for [featurectrl](https://featurectrl.io) feature flags.

## Installation

```sh
npm install @featurectrl/config
# or
pnpm add @featurectrl/config
# or
yarn add @featurectrl/config
# or
bun add @featurectrl/config
```

## Quick start

```ts
import {defineConfig} from "@featurectrl/config";

export default defineConfig({
  app: "my-web-app",
  flags: {
    "new-checkout": {
      defaultValue: false,
      description: "Render the redesigned checkout flow",
    },
  },
});
```

## License

[MIT](./LICENSE)
