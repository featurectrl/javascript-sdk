export type AsyncController = {
  promise: Promise<void>;
  resolve: () => void;
};

export function createAsyncController(): AsyncController {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}
