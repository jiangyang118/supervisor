import fetch from 'node-fetch';
import { StdResponse } from './std-response';
import { logInfo, logWarn, logError } from '../../common/file-logger';
import crypto from 'crypto';

export class TrustivsUpstreamService {
  private base: string;
  private static tokenCache?: { token: string; expiresAt?: number };

  constructor() {
    this.base = process.env.TRUSTIVS_BASE || 'http://127.0.0.1:9086';
  }

  private now() { return Date.now(); }
  private getEnvToken() { return process.env.TRUSTIVS_TOKEN; }

  private async ensureToken(): Promise<string | undefined> {
    // Prefer cached
    if (TrustivsUpstreamService.tokenCache && (TrustivsUpstreamService.tokenCache.expiresAt || 0) > this.now()) {
      return TrustivsUpstreamService.tokenCache.token;
    }
    const envToken = this.getEnvToken();
    if (envToken) return envToken;
    // Build from ylt_* or TRUSTIVS_* env
    const acc = process.env.ylt_account || process.env.TRUSTIVS_ACCOUNT || 'STANDTRUST';
    const pwdMd5Env = process.env.ylt_password_md5 || process.env.TRUSTIVS_PASSWORD_MD5 || '';
    let fpwd = pwdMd5Env;
    if (!fpwd) {
      const raw = process.env.ylt_password || process.env.TRUSTIVS_PASSWORD || '12345678';
      fpwd = crypto.createHash('md5').update(raw).digest('hex');
    }
    const body = { fnumber: acc, fpwd };
    const res = await this.request<any>('POST', '/gatewayGBS/openApi/token/getOpenApiToken', { body }, false);
    const token = (res?.data as any) || undefined;
    const ttlMin = Number(process.env.ylt_token_ttl_minutes || process.env.TRUSTIVS_TOKEN_TTL_MINUTES || '10');
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
    const qs = opts?.query
      ?
        '?' +
        new URLSearchParams(
          (Object.entries(opts.query).flatMap(([k, v]) =>
            Array.isArray(v)
              ? (v as any[]).map((x) => [k, String(x)] as [string, string])
              : [[k, String(v)]]
          ) as unknown) as readonly [string, string][]
        ).toString()
      : '';
    const url = this.base.replace(/\/$/, '') + (path.startsWith('/')? path : '/' + path) + qs;
    const hdr = await this.headers(opts?.headers, autoAuth);
    let body: any = undefined;
    if (opts?.body && method.toUpperCase() !== 'GET') { hdr['Content-Type'] = hdr['Content-Type'] || 'application/json'; body = JSON.stringify(opts.body); }

    const started = Date.now();
    // Log full request
    logInfo('trustivs.request', { method: method.toUpperCase(), url, headers: hdr, body: body ? JSON.parse(body) : undefined });
    try {
      const res = await fetch(url, { method: method.toUpperCase(), headers: hdr as any, body });
      const text = await res.text();
      const tookMs = Date.now() - started;
      const resHeaders = (() => { try { return Object.fromEntries((res.headers as any).entries()); } catch { return {}; } })();
      // Log full response
      logInfo('trustivs.response', { url, status: res.status, tookMs, headers: resHeaders, body: text });
      try { return JSON.parse(text); } catch { return { code: res.ok ? '1':'0', message: text } as any; }
    } catch (e: any) {
      const tookMs = Date.now() - started;
      logError('trustivs.error', { url, method: method.toUpperCase(), tookMs, error: e?.message || String(e) });
      throw e;
    }
  }
}
