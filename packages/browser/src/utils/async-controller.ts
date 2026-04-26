export type AsyncController = {
  _promise: Promise<void>;
  _resolve: () => void;
};

export function createAsyncController(): AsyncController {
  let _resolve!: () => void;
  const _promise = new Promise<void>((res) => {
    _resolve = res;
  });
  return { _promise, _resolve };
}
