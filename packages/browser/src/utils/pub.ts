type BaseEvent = { type: string };

export class Pub<E extends BaseEvent> {
  private _listeners = new Set<(e: E) => void>();

  emit(event: E): void {
    for (const listener of this._listeners) {
      listener(event);
    }
  }

  on(listener: (e: E) => void): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }
}
