# basic-browser

Minimal Vite + browser example for [`@featurectrl/browser`](../../packages/browser).

## Run

From the repo root:

```sh
bun install
bun --filter @featurectrl/example-basic-browser dev
```

Then open the URL Vite prints.

Set `VITE_FEATURECTRL_API_KEY` (e.g. in a local `.env`) to fetch real flags.
Without it the client runs in offline mode and falls back to flag default values.
