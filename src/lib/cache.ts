export class TtlCache<T> {
  private readonly ttlMs: number;
  private readonly storage = new Map<string, { value: T; expiresAt: number }>();

  constructor(ttlMs: number) {
    this.ttlMs = ttlMs;
  }

  get(key: string): T | undefined {
    const item = this.storage.get(key);
    if (!item) {
      return undefined;
    }

    if (item.expiresAt <= Date.now()) {
      this.storage.delete(key);
      return undefined;
    }

    return item.value;
  }

  set(key: string, value: T): void {
    this.storage.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }
}

