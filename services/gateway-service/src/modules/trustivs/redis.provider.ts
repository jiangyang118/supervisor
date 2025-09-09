// Avoid hard dependency on ioredis types; define minimal interface
type RedisClientLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: any[]): Promise<any>;
  del(key: string): Promise<any>;
  expire(key: string, seconds: number): Promise<any>;
  pipeline(): any;
};

export type RedisLike = RedisClientLike | null;

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
