import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenBlacklistService {
  private store = new Map<string, number>(); // token -> exp (epoch seconds)

  add(token: string, exp?: number) {
    const now = Math.floor(Date.now() / 1000);
    const ttl = exp && exp > now ? exp : now + 8 * 3600; // default 8h if no exp
    this.cleanup();
    this.store.set(token, ttl);
  }

  has(token: string) {
    this.cleanup();
    const exp = this.store.get(token);
    if (!exp) return false;
    const now = Math.floor(Date.now() / 1000);
    if (exp <= now) {
      this.store.delete(token);
      return false;
    }
    return true;
  }

  private cleanup() {
    const now = Math.floor(Date.now() / 1000);
    for (const [t, exp] of this.store.entries()) if (exp <= now) this.store.delete(t);
  }
}

