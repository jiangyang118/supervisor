import { Injectable } from '@nestjs/common';
import { DbService } from '../db.service';
import { resolvePolicies, CachePolicy, CachePolicies } from './cache.config';
import { createRedis, RedisLike } from './redis.provider';

type CacheRow = { key: string; value: string; stale_at: Date; expires_at: Date; type?: string };

@Injectable()
export class TrustivsCacheService {
  private policies: CachePolicies = resolvePolicies();
  private redis: RedisLike;
  private inFlight = new Map<string, Promise<any>>();
  private circuit = { openUntil: 0, failures: 0 };

  constructor(private readonly db: DbService) {
    this.redis = createRedis();
  }

  private now() { return Date.now(); }
  private isOpen() { return this.now() < this.circuit.openUntil; }
  private onSuccess() { this.circuit.failures = 0; }
  private onFailure() {
    const p = this.policies.circuit;
    this.circuit.failures++;
    if (this.circuit.failures >= p.failureThreshold) {
      this.circuit.openUntil = this.now() + p.openTimeoutSec * 1000;
      this.circuit.failures = 0;
    }
  }

  private async readL1(key: string): Promise<CacheRow | null> {
    try {
      const { rows } = await this.db.query<any>(
        'select `key`, `value`, `stale_at` as stale_at, `expires_at` as expires_at, `type` from trustivs_cache where `key` = ? limit 1',
        [key],
      );
      return rows?.[0] || null;
    } catch { return null; }
  }
  private async writeL1(key: string, value: string, staleAt: Date, expiresAt: Date, type?: string) {
    await this.db.query(
      'insert into trustivs_cache(`key`,`value`,`stale_at`,`expires_at`,`type`) values(?,?,?,?,?) on duplicate key update `value`=values(`value`),`stale_at`=values(`stale_at`),`expires_at`=values(`expires_at`),`type`=values(`type`)',
      [key, value, staleAt, expiresAt, type || null],
    );
  }

  async getOrRefresh<T>(key: string, policy: CachePolicy, fetcher: () => Promise<T>, type?: string): Promise<T> {
    // L2
    if (this.redis) {
      try {
        const v = await (this.redis as any).get(key);
        if (v) return JSON.parse(v);
      } catch {}
    }
    // L1
    const row = await this.readL1(key);
    const now = new Date();
    if (row) {
      const isFresh = row.expires_at > now;
      const isStale = row.stale_at > now;
      if (isFresh) {
        return JSON.parse(row.value);
      }
      if (isStale) {
        // stale-while-revalidate
        this.refresh(key, policy, fetcher, type).catch(() => {});
        return JSON.parse(row.value);
      }
    }
    // miss
    return await this.refresh(key, policy, fetcher, type);
  }

  private async refresh<T>(key: string, policy: CachePolicy, fetcher: () => Promise<T>, type?: string): Promise<T> {
    const dedupeWindow = this.policies.dedupeWindowSec * 1000;
    const existing = this.inFlight.get(key);
    if (existing) return existing as Promise<T>;

    const p = (async () => {
      if (this.isOpen()) throw new Error('circuit-open');
      const start = Date.now();
      try {
        const data = await fetcher();
        this.onSuccess();
        const ttl = policy.ttl * 1000;
        const maxStale = policy.maxStale * 1000;
        const staleAt = new Date(start + ttl);
        const expiresAt = new Date(start + maxStale);
        const value = JSON.stringify(data);
        await this.writeL1(key, value, staleAt, expiresAt, type);
        if (this.redis) {
          try { await (this.redis as any).set(key, value, 'EX', Math.floor(ttl / 1000)); } catch {}
        }
        return data;
      } catch (e) {
        this.onFailure();
        throw e;
      } finally {
        setTimeout(() => this.inFlight.delete(key), dedupeWindow).unref?.();
      }
    })();
    this.inFlight.set(key, p);
    return p;
  }

  async invalidate(prefix: string) {
    try {
      await this.db.query('delete from trustivs_cache where `key` like ?', [prefix + '%']);
    } catch {}
    if (this.redis) {
      try {
        const r: any = this.redis;
        // best effort: Redis KEYS may be disabled; fallback to no-op
        if (r.scan) {
          let cursor = '0';
          const delKeys: string[] = [];
          do {
            const [next, arr] = await r.scan(cursor, 'MATCH', prefix + '*', 'COUNT', 1000);
            cursor = next;
            if (Array.isArray(arr)) delKeys.push(...arr);
          } while (cursor !== '0');
          if (delKeys.length) await r.del(...delKeys);
        }
      } catch {}
    }
  }
}
