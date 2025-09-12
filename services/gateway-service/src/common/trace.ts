import { AsyncLocalStorage } from 'async_hooks';

type Store = { traceId?: string };

export const traceAls = new AsyncLocalStorage<Store>();

export function getTraceId(): string | undefined {
  return traceAls.getStore()?.traceId;
}

export function withTraceId<T>(traceId: string, fn: () => T): T {
  const store: Store = { traceId };
  return traceAls.run(store, fn);
}

