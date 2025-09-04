import { Injectable } from '@nestjs/common';
import { TrustivsUpstreamService } from '../upstream.service';
import { TrustivsCacheService } from '../cache.service';
import { resolvePolicies } from '../cache.config';

@Injectable()
export class TrustivsStreamService {
  private policies = resolvePolicies();
  constructor(private readonly up: TrustivsUpstreamService, private readonly cache: TrustivsCacheService) {}

  async getStreamURL(body: any, headers?: Record<string, string>) {
    const key = `stream:${JSON.stringify(body)}`;
    return this.cache.getOrRefresh(key, this.policies.stream, async () => {
      const res = await this.up.request<any>('POST', '/gatewayGBS/openApi/getStreamURL', { body, headers });
      if (res.code !== '1') throw new Error(res.message || 'upstream error');
      return res.data;
    }, 'stream');
  }

  async getSnap(query: any, headers?: Record<string, string>) {
    const key = `snap:${JSON.stringify(query)}`;
    return this.cache.getOrRefresh(key, this.policies.snapshot, async () => {
      const res = await this.up.request<any>('GET', '/gatewayGBS/openApi/getSnap', { query, headers });
      if (res.code !== '1') throw new Error(res.message || 'upstream error');
      return res.data;
    }, 'snap');
  }
}

