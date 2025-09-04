import { EnvKind } from './enums';

export type CachePolicy = { ttl: number; maxStale: number; leadTime: number };

export type CachePolicies = {
  lists: CachePolicy; // device/channel/camera lists
  stream: CachePolicy; // getStreamURL
  playback: CachePolicy; // getBackUrl/getDownloadUrl
  snapshot: CachePolicy; // getSnap
  dedupeWindowSec: number;
  rate: { limitPerMin: number };
  circuit: { failureThreshold: number; halfOpenAfterSec: number; openTimeoutSec: number };
  schedule: { warmCron: string; topN: number };
  logging: { level: 'debug' | 'info' | 'warn'; slowMs: number };
  useRedis: boolean;
};

const dev: CachePolicies = {
  lists: { ttl: 600, maxStale: 1800, leadTime: 60 },
  stream: { ttl: 120, maxStale: 300, leadTime: 20 },
  playback: { ttl: 1800, maxStale: 3600, leadTime: 120 },
  snapshot: { ttl: 60, maxStale: 120, leadTime: 10 },
  dedupeWindowSec: 5,
  rate: { limitPerMin: 100 },
  circuit: { failureThreshold: 5, halfOpenAfterSec: 30, openTimeoutSec: 60 },
  schedule: { warmCron: '0 */30 * * * *', topN: 10 },
  logging: { level: 'debug', slowMs: 300 },
  useRedis: false,
};

const prod: CachePolicies = {
  lists: { ttl: 900, maxStale: 1800, leadTime: 90 },
  stream: { ttl: 120, maxStale: 180, leadTime: 20 },
  playback: { ttl: 1800, maxStale: 3600, leadTime: 300 },
  snapshot: { ttl: 60, maxStale: 90, leadTime: 10 },
  dedupeWindowSec: 8,
  rate: { limitPerMin: 300 },
  circuit: { failureThreshold: 3, halfOpenAfterSec: 60, openTimeoutSec: 120 },
  schedule: { warmCron: '0 */20 * * * *', topN: 20 },
  logging: { level: 'info', slowMs: 200 },
  useRedis: (process.env.USE_REDIS_CACHE || 'true') === 'true',
};

const stress: CachePolicies = {
  lists: { ttl: 300, maxStale: 600, leadTime: 30 },
  stream: { ttl: 60, maxStale: 120, leadTime: 15 },
  playback: { ttl: 900, maxStale: 1800, leadTime: 60 },
  snapshot: { ttl: 30, maxStale: 60, leadTime: 5 },
  dedupeWindowSec: 3,
  rate: { limitPerMin: 1000 },
  circuit: { failureThreshold: 10, halfOpenAfterSec: 15, openTimeoutSec: 30 },
  schedule: { warmCron: '0 */5 * * * *', topN: 50 },
  logging: { level: 'warn', slowMs: 150 },
  useRedis: false,
};

export function resolvePolicies(): CachePolicies {
  const env = (process.env.NODE_ENV || 'development') as EnvKind;
  const base = env === EnvKind.Prod ? prod : env === EnvKind.Stress ? stress : dev;
  return base;
}
