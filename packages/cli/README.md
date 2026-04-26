# @featurectrl/cli

[![npm version](https://img.shields.io/npm/v/@featurectrl/cli.svg)](https://www.npmjs.com/package/@featurectrl/cli)
[![license](https://img.shields.io/npm/l/@featurectrl/cli.svg)](./LICENSE)

Command line tool for [featurectrl](https://featurectrl.io).

## Quick start

Initialize a config and generate types in one step:

```sh
npx @featurectrl/cli init
# or
pnpm @featurectrl/cli init
# or
bunx @featurectrl/cli init
```

This will generate an empty `featurectrl.config.ts` and basic `featurectrl.d.ts`.

Edit `featurectrl.config.ts` to declare your flags and segments, then re-run type generation:

```sh
npx @featurectrl/cli generate
```

## License

[MIT](./LICENSE)
