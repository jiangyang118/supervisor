import { Injectable, Logger } from '@nestjs/common';
import fetch from 'node-fetch';
import crypto from 'crypto';
import { logInfo, logError } from '../../common/file-logger';

type ReqInit = {
  method: string;
  path: string;
  query?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
};

@Injectable()
export class TrustivsConfigService {
  private readonly logger = new Logger('TrustivsHttp');
  readonly baseURL: string;
  readonly timeoutMs = 15_000;
  private static tokenCache: { token: string; expiresAt: number } | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor() {
    console.log('999',process.env.ylt_baseurl )
    this.baseURL = process.env.ylt_baseurl || process.env.TRUSTIVS_BASE || 'http://127.0.0.1:9086';
    // Warm up token in background and schedule refresh to avoid per-request fetching
    this.ensureToken().catch(() => {});
    this.scheduleTokenRefresh();
  }

  private scheduleTokenRefresh() {
    try { if (this.refreshTimer) clearInterval(this.refreshTimer as any); } catch {}
    const minutes = Number(process.env.YLT_TOKEN_REFRESH_MINUTES || process.env.ylt_token_refresh_minutes || 1440); // default 1 day
    const intervalMs = Math.max(1, minutes) * 60_000;
    this.refreshTimer = setInterval(() => {
      this.ensureToken(true).then((t) => {
        if (t) this.logger.log('Token refreshed by scheduler');
      }).catch((e) => this.logger.warn(`Token scheduler refresh failed: ${e?.message || e}`));
    }, intervalMs);
    // Don't keep process alive due to timer
    (this.refreshTimer as any).unref?.();
  }

  private async rawFetch(method: string, path: string, body?: any) {
    const url = this.baseURL.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path);
    const headers: Record<string, string> = { 'Content-Type': 'application/json', time: String(Date.now()), uuid: process.env.ylt_uuid || 'cpt' };
    const started = Date.now();
    this.logger.log(`REQUEST ${method.toUpperCase()} ${url} (raw)`);
    logInfo('trustivs.request', { method: method.toUpperCase(), url, headers, body });
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, { method: method.toUpperCase(), headers: headers as any, body: body ? JSON.stringify(body) : undefined, signal: ctrl.signal } as any);
      const text = await res.text();
      const tookMs = Date.now() - started;
      const resHeaders = (() => { try { return Object.fromEntries((res.headers as any).entries()); } catch { return {}; } })();
      this.logger.log(`RESPONSE ${method.toUpperCase()} ${url} ${res.status} ${tookMs}ms (raw)`);
      logInfo('trustivs.response', { url, status: res.status, tookMs, headers: resHeaders, body: text });
      let json: any = undefined;
      try { json = JSON.parse(text); } catch {}
      return { status: res.status, text, json };
    } finally { /* @ts-ignore */ clearTimeout(t); }
  }

  private async ensureToken(force = false): Promise<string | undefined> {
    const now = Date.now();
    if (!force && TrustivsConfigService.tokenCache && TrustivsConfigService.tokenCache.expiresAt > now) {
      return TrustivsConfigService.tokenCache.token;
    }
    const acc = process.env.ylt_account || process.env.TRUSTIVS_ACCOUNT || 'STANDTRUST';
    const pwdMd5Env = process.env.ylt_password_md5 || process.env.TRUSTIVS_PASSWORD_MD5 || '';
    let fpwd = pwdMd5Env;
    if (!fpwd) {
      const raw = process.env.ylt_password || process.env.TRUSTIVS_PASSWORD || '12345678';
      fpwd = crypto.createHash('md5').update(raw).digest('hex');
    }
    try {
      const res = await this.rawFetch('POST', '/gatewayGBS/openApi/token/getOpenApiToken', { fnumber: acc, fpwd });
      const token = (res.json && (res.json.data || res.json.token || res.json.message)) || '';
      const ttlMin = Number(process.env.ylt_token_ttl_minutes || '10');
      TrustivsConfigService.tokenCache = { token: String(token || ''), expiresAt: now + ttlMin * 60_000 };
      return TrustivsConfigService.tokenCache.token;
    } catch (e) {
      this.logger.warn(`Token fetch failed: ${(e as any)?.message || e}`);
      return undefined;
    }
  }

  private async buildHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    const uuid = process.env.ylt_uuid || 'cpt';
    h['time'] = String(Date.now());
    h['uuid'] = uuid;
    let token = process.env.TRUSTIVS_TOKEN || process.env.ylt_token || '';
    if (!token) token = (await this.ensureToken()) || '';
    if (token) h['token'] = token;
    for (const [k, v] of Object.entries(extra || {})) h[k] = v;
    return h;
  }

  private qs(obj?: Record<string, any>) {
    if (!obj) return '';
    const ent = Object.entries(obj).flatMap(([k, v]) => (Array.isArray(v) ? v.map((x) => [k, x]) : [[k, v]]));
    return ent.length ? '?' + new URLSearchParams(ent as any).toString() : '';
  }

  async request(init: ReqInit): Promise<{ status: number; url: string; text: string; json?: any }>
  {
    const url = this.baseURL.replace(/\/$/, '') + (init.path.startsWith('/') ? init.path : '/' + init.path) + this.qs(init.query);
    let headers = await this.buildHeaders(init.headers);
    const started = Date.now();
    this.logger.log(`REQUEST ${init.method.toUpperCase()} ${url}`);
    logInfo('trustivs.request', { method: init.method.toUpperCase(), url, headers, body: init.body });
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const body = init.body && init.method.toUpperCase() !== 'GET'
        ? (typeof init.body === 'string' ? init.body : JSON.stringify(init.body))
        : undefined;
      const doFetch = async (hdrs: Record<string, string>) => fetch(url, {
        method: init.method.toUpperCase(),
        headers: hdrs as any,
        body,
        signal: ctrl.signal,
      } as any);

      let res = await doFetch(headers);
      let text = await res.text();
      let tookMs = Date.now() - started;
      this.logger.log(`RESPONSE ${init.method.toUpperCase()} ${url} ${res.status} ${tookMs}ms`);
      let resHeaders = (() => { try { return Object.fromEntries((res.headers as any).entries()); } catch { return {}; } })();
      logInfo('trustivs.response', { url, status: res.status, tookMs, headers: resHeaders, body: text });
      let json: any = undefined;
      try { json = JSON.parse(text); } catch {}

      // Token expired handling: code === '405' in JSON with message like 'Token已过期'
      if (res.status === 200 && json && String(json.code) === '405') {
        this.logger.warn('TrustIVS token expired, refreshing and retrying once');
        const newToken = await this.ensureToken(true);
        if (newToken) {
          headers = { ...headers, token: newToken };
          const started2 = Date.now();
          res = await doFetch(headers);
          text = await res.text();
          tookMs = Date.now() - started2;
          resHeaders = (() => { try { return Object.fromEntries((res.headers as any).entries()); } catch { return {}; } })();
          this.logger.log(`RESPONSE(retry) ${init.method.toUpperCase()} ${url} ${res.status} ${tookMs}ms`);
          logInfo('trustivs.response', { url, status: res.status, tookMs, headers: resHeaders, body: text });
          try { json = JSON.parse(text); } catch { json = undefined; }
        }
      }
      return { status: res.status, url, text, json };
    } finally {
      clearTimeout(t);
    }
  }
}
