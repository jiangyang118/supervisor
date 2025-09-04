import fetch from 'node-fetch';
import type { StdResponse, Paged, Company, Camera, AIRecord } from './trustivs.types';

export interface ProxyOptions {
  method: string;
  path: string; // includes query
  headers?: Record<string, string | string[]>;
  body?: any;
}

// StdResponse imported from types

export class TrustIVSService {
  private base: string;
  private static tokenCache?: { token: string; expiresAt?: number };

  constructor() {
    this.base = process.env.TRUSTIVS_BASE || 'http://127.0.0.1:9086';
  }

  private now() { return Date.now(); }

  private getDefaultToken() {
    const t = process.env.TRUSTIVS_TOKEN;
    if (t && t.trim()) return t.trim();
    return undefined;
  }

  private shouldRefreshToken() {
    if (!TrustIVSService.tokenCache) return true;
    const exp = TrustIVSService.tokenCache.expiresAt;
    return !!exp && this.now() >= exp - 30_000; // refresh 30s early
  }

  async fetchToken(): Promise<string | undefined> {
    // If you want auto-fetch, set TRUSTIVS_AUTH_PATH and TRUSTIVS_AUTH_BODY (JSON)
    const authPath = process.env.TRUSTIVS_AUTH_PATH; // e.g. /gatewayGBS/openApi/token/getOpenApiToken
    const authBodyRaw = process.env.TRUSTIVS_AUTH_BODY; // e.g. {"account":"xxx","password":"yyy"}
    if (!authPath || !authBodyRaw) return this.getDefaultToken();
    const body = JSON.parse(authBodyRaw);
    const res = await this.request<any>('POST', authPath, { body, headers: {} }, false);
    const token = (res?.data as any) || undefined;
    // Optional TTL from env
    const ttlMin = Number(process.env.TRUSTIVS_TOKEN_TTL_MINUTES || '10');
    TrustIVSService.tokenCache = { token: String(token || ''), expiresAt: this.now() + ttlMin * 60_000 };
    return TrustIVSService.tokenCache.token;
  }

  private headersWithAuth(headers?: Record<string, string | string[]>) {
    const hdr: Record<string, string> = {};
    for (const [k, v] of Object.entries(headers || {})) {
      if (Array.isArray(v)) hdr[k] = v.join(','); else if (typeof v === 'string') hdr[k] = v;
    }
    if (!hdr['time']) hdr['time'] = String(this.now());
    if (!hdr['uuid']) hdr['uuid'] = Math.random().toString(36).slice(2, 12);
    return hdr;
  }

  async request<T = any>(method: string, path: string, opts: { headers?: Record<string, any>; body?: any }, autoAuth = true): Promise<StdResponse<T>> {
    const url = this.base.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path);
    const hdr = this.headersWithAuth(opts.headers);
    // token injection
    if (!hdr['token'] && autoAuth) {
      // use cached token or env token
      const envToken = this.getDefaultToken();
      if (envToken) hdr['token'] = envToken;
      else if (!TrustIVSService.tokenCache || this.shouldRefreshToken()) {
        const t = await this.fetchToken();
        if (t) hdr['token'] = t;
      } else if (TrustIVSService.tokenCache?.token) {
        hdr['token'] = TrustIVSService.tokenCache.token;
      }
    }

    let body: any = undefined;
    const ctype = (hdr['content-type'] || hdr['Content-Type'] || '').toLowerCase();
    if (opts.body !== undefined && method.toUpperCase() !== 'GET') {
      if (!ctype) { hdr['Content-Type'] = 'application/json'; body = JSON.stringify(opts.body); }
      else if (ctype.includes('application/json')) { body = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body); }
      else { body = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body); }
    }

    const res = await fetch(url, { method: method.toUpperCase(), headers: hdr as any, body });
    const text = await res.text();
    let data: any = text;
    try { data = JSON.parse(text); } catch {}
    // If token invalid and autoAuth, try once to refresh token
    if (autoAuth && (res.status === 401 || (data && typeof data === 'object' && data.code === '0' && /token/i.test(String(data.message||''))))) {
      const t = await this.fetchToken();
      if (t) {
        hdr['token'] = t;
        const res2 = await fetch(url, { method: method.toUpperCase(), headers: hdr as any, body });
        const text2 = await res2.text();
        try { data = JSON.parse(text2); } catch { data = text2; }
        return data as StdResponse<T>;
      }
    }
    return data as StdResponse<T>;
  }

  // Convenience proxy used by generated controller
  async proxy(opts: ProxyOptions) {
    return this.request(opts.method, opts.path, { headers: opts.headers as any, body: opts.body });
  }

  // Examples of typed helpers for common endpoints
  async getStreamURL(body: any, headers?: Record<string,string>): Promise<StdResponse<Camera>> {
    return this.request<Camera>('POST', '/gatewayGBS/openApi/getStreamURL', { body, headers });
  }
  async getBackUrl(query: any, headers?: Record<string,string>): Promise<StdResponse<any>> {
    const qs = new URLSearchParams(Object.entries(query||{})).toString();
    const path = '/gatewayGBS/openApi/getBackUrl' + (qs? '?' + qs : '');
    return this.request<any>('GET', path, { headers });
  }
  async getDownloadUrl(query: any, headers?: Record<string,string>): Promise<StdResponse<any>> {
    const qs = new URLSearchParams(Object.entries(query||{})).toString();
    const path = '/gatewayGBS/openApi/getDownloadUrl' + (qs? '?' + qs : '');
    return this.request<any>('GET', path, { headers });
  }
  async getCompanyList(body: any, headers?: Record<string,string>): Promise<StdResponse<Paged<Company>>> {
    return this.request<Paged<Company>>('POST', '/gatewayGBS/openApi/getCompanyList', { body, headers });
  }
  async getCameraByCompany(body: any, headers?: Record<string,string>): Promise<StdResponse<Camera[]>> {
    return this.request<Camera[]>('POST', '/gatewayGBS/openApi/getCameraByCompany', { body, headers });
  }
  async getAIRecordByCompany(body: any, headers?: Record<string,string>): Promise<StdResponse<Paged<AIRecord>>> {
    return this.request<Paged<AIRecord>>('POST', '/gatewayGBS/openApi/getAIRecordByCompany', { body, headers });
  }
  async getDeviceListByCompany(body: any, headers?: Record<string,string>): Promise<StdResponse<any[]>> {
    return this.request<any[]>('POST', '/gatewayGBS/openApi/getDeviceListByCompany', { body, headers });
  }
  async getChannelByDevice(body: any, headers?: Record<string,string>): Promise<StdResponse<Camera[]>> {
    return this.request<Camera[]>('POST', '/gatewayGBS/openApi/getChannelByDevice', { body, headers });
  }
}
