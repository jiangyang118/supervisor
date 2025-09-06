import { Injectable, Logger } from '@nestjs/common';
import { TrustivsUpstreamService } from '../upstream.service';
import { TrustivsCacheService } from '../cache.service';
import { resolvePolicies } from '../cache.config';
import { normalizePage } from '../pagination';
import { logInfo, logWarn } from '../../../common/file-logger';

@Injectable()
export class TrustivsAIService {
  private policies = resolvePolicies();
  private readonly logger = new Logger('TrustivsAIService');
  constructor(private readonly up: TrustivsUpstreamService, private readonly cache: TrustivsCacheService) {}

  async getAIRecordByCompany(body: any, headers?: Record<string, string>) {
    const { pageNum, pageSize } = normalizePage(body || {});
    const key = `ai:${pageNum}:${pageSize}:${JSON.stringify(body)}`;
    return this.cache.getOrRefresh(key, this.policies.lists, async () => {
      const req = { ...body, pageNum, pageSize };
      this.logger.log(`Calling getAIRecordByCompany body=${JSON.stringify(req)}`);
      logInfo('trustivs.getAIRecordByCompany.request', { body: req });
      const res = await this.up.request<any>('POST', '/gatewayGBS/openApi/getAIRecordByCompany', { body: req, headers });
      logInfo('trustivs.getAIRecordByCompany.response', res);
      if (res.code !== '1') { logWarn('trustivs.getAIRecordByCompany.non_success', res); throw new Error(res.message || 'upstream error'); }
      return res.data;
    }, 'ai');
  }

  async sendAIRecordByCompany(body: any, headers?: Record<string, string>) {
    this.logger.log(`Calling sendAIRecordByCompany body=${JSON.stringify(body)}`);
    logInfo('trustivs.sendAIRecordByCompany.request', { body });
    const res = await this.up.request<any>('POST', '/openApi/sendAIRecordByCompany', { body, headers });
    logInfo('trustivs.sendAIRecordByCompany.response', res);
    // 软失效可能相关的缓存
    this.cache.invalidate('ai:').catch(() => {});
    return res;
  }
}
