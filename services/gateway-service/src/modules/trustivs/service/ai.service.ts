import { Injectable } from '@nestjs/common';
import { TrustivsUpstreamService } from '../upstream.service';
import { TrustivsCacheService } from '../cache.service';
import { resolvePolicies } from '../cache.config';
import { normalizePage } from '../pagination';

@Injectable()
export class TrustivsAIService {
  private policies = resolvePolicies();
  constructor(private readonly up: TrustivsUpstreamService, private readonly cache: TrustivsCacheService) {}

  async getAIRecordByCompany(body: any, headers?: Record<string, string>) {
    const { pageNum, pageSize } = normalizePage(body || {});
    const key = `ai:${pageNum}:${pageSize}:${JSON.stringify(body)}`;
    return this.cache.getOrRefresh(key, this.policies.lists, async () => {
      const res = await this.up.request<any>('POST', '/gatewayGBS/openApi/getAIRecordByCompany', { body: { ...body, pageNum, pageSize }, headers });
      if (res.code !== '1') throw new Error(res.message || 'upstream error');
      return res.data;
    }, 'ai');
  }

  async sendAIRecordByCompany(body: any, headers?: Record<string, string>) {
    const res = await this.up.request<any>('POST', '/openApi/sendAIRecordByCompany', { body, headers });
    // 软失效可能相关的缓存
    this.cache.invalidate('ai:').catch(() => {});
    return res;
  }
}

