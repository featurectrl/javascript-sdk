# basic-node

Minimal Node.js example for [`@featurectrl/node`](../../packages/node).

## Run

From the repo root:

```sh
bun install
bun --filter @featurectrl/example-basic-node start
```

Set `FEATURECTRL_API_KEY` to fetch real flags. Without it the client runs in
offline mode and falls back to flag default values.
