import type { Redis } from 'ioredis';

export type RedisLike = Pick<Redis, 'get' | 'set' | 'del' | 'expire' | 'pipeline'> | null;

export function createRedis(): RedisLike {
  try {
    if ((process.env.USE_REDIS_CACHE || 'false') !== 'true') return null;
    // Lazy require to avoid dependency if not installed
    const RedisLib = require('ioredis');
    const url = process.env.REDIS_URL;
    const client = url ? new RedisLib(url) : new RedisLib({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
    });
    client.on('error', () => {/* degrade silently */});
    return client;
  } catch {
    return null;
  }
}

