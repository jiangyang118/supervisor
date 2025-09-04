import { Injectable } from '@nestjs/common';
import { TrustivsUpstreamService } from '../upstream.service';
import { TrustivsCacheService } from '../cache.service';
import { resolvePolicies } from '../cache.config';

@Injectable()
export class TrustivsPlaybackService {
  private policies = resolvePolicies();
  constructor(private readonly up: TrustivsUpstreamService, private readonly cache: TrustivsCacheService) {}

  async getBackUrl(query: any, headers?: Record<string, string>) {
    const key = `back:${JSON.stringify(query)}`;
    return this.cache.getOrRefresh(key, this.policies.playback, async () => {
      const res = await this.up.request<any>('GET', '/gatewayGBS/openApi/getBackUrl', { query, headers });
      if (res.code !== '1') throw new Error(res.message || 'upstream error');
      return res.data;
    }, 'back');
  }

  async getDownloadUrl(query: any, headers?: Record<string, string>) {
    const key = `download:${JSON.stringify(query)}`;
    return this.cache.getOrRefresh(key, this.policies.playback, async () => {
      const res = await this.up.request<any>('GET', '/gatewayGBS/openApi/getDownloadUrl', { query, headers });
      if (res.code !== '1') throw new Error(res.message || 'upstream error');
      return res.data;
    }, 'download');
  }
}

