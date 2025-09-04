import fetch from 'node-fetch';
import { StdResponse } from './std-response';

export class TrustivsUpstreamService {
  private base: string;
  private static tokenCache?: { token: string; expiresAt?: number };

  constructor() {
    this.base = process.env.TRUSTIVS_BASE || 'http://127.0.0.1:9086';
  }

  private now() { return Date.now(); }
  private getEnvToken() { return process.env.TRUSTIVS_TOKEN; }

  private async ensureToken(): Promise<string | undefined> {
    const envToken = this.getEnvToken();
    if (envToken) return envToken;
    const path = process.env.TRUSTIVS_AUTH_PATH;
    const raw = process.env.TRUSTIVS_AUTH_BODY;
    if (!path || !raw) return undefined;
    const body = JSON.parse(raw);
    const res = await this.request<any>('POST', path, { body }, false);
    const token = (res?.data as any) || undefined;
    const ttlMin = Number(process.env.TRUSTIVS_TOKEN_TTL_MINUTES || '10');
    TrustivsUpstreamService.tokenCache = { token: String(token || ''), expiresAt: this.now() + ttlMin * 60_000 };
    return TrustivsUpstreamService.tokenCache.token;
  }

  private async headers(h?: Record<string, any>, autoAuth = true) {
    const hdr: Record<string, string> = {};
    for (const [k, v] of Object.entries(h || {})) hdr[k] = Array.isArray(v) ? v.join(',') : String(v);
    if (!hdr['time']) hdr['time'] = String(this.now());
    if (!hdr['uuid']) hdr['uuid'] = Math.random().toString(36).slice(2, 12);
    if (!hdr['token'] && autoAuth) {
      const t = await this.ensureToken();
      if (t) hdr['token'] = t;
    }
    return hdr;
  }

  async request<T = any>(method: string, path: string, opts: { query?: any; body?: any; headers?: Record<string, any> }, autoAuth = true): Promise<StdResponse<T>> {
    const qs = opts?.query ? '?' + new URLSearchParams(Object.entries(opts.query).flatMap(([k,v]) => Array.isArray(v)? v.map(x=>[k,x]): [[k, v]])).toString() : '';
    const url = this.base.replace(/\/$/, '') + (path.startsWith('/')? path : '/' + path) + qs;
    const hdr = await this.headers(opts?.headers, autoAuth);
    let body: any = undefined;
    if (opts?.body && method.toUpperCase() !== 'GET') { hdr['Content-Type'] = hdr['Content-Type'] || 'application/json'; body = JSON.stringify(opts.body); }
    const res = await fetch(url, { method: method.toUpperCase(), headers: hdr as any, body });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { code: res.ok ? '1':'0', message: text } as any; }
  }
}
