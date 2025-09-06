import { Injectable, Logger } from '@nestjs/common';
import { TrustivsUpstreamService } from '../upstream.service';
import { TrustivsCacheService } from '../cache.service';
import { resolvePolicies } from '../cache.config';
import { logInfo, logWarn } from '../../../common/file-logger';

@Injectable()
export class TrustivsStreamService {
  private policies = resolvePolicies();
  private readonly logger = new Logger('TrustivsStreamService');
  constructor(private readonly up: TrustivsUpstreamService, private readonly cache: TrustivsCacheService) {}

  async getStreamURL(body: any, headers?: Record<string, string>) {
    const key = `stream:${JSON.stringify(body)}`;
    return this.cache.getOrRefresh(key, this.policies.stream, async () => {
      this.logger.log(`Calling getStreamURL body=${JSON.stringify(body)}`);
      logInfo('trustivs.getStreamURL.request', { body });
      const res = await this.up.request<any>('POST', '/gatewayGBS/openApi/getStreamURL', { body, headers });
      logInfo('trustivs.getStreamURL.response', res);
      if (res.code !== '1') { logWarn('trustivs.getStreamURL.non_success', res); throw new Error(res.message || 'upstream error'); }
      return res.data;
    }, 'stream');
  }

  async getSnap(query: any, headers?: Record<string, string>) {
    const key = `snap:${JSON.stringify(query)}`;
    return this.cache.getOrRefresh(key, this.policies.snapshot, async () => {
      this.logger.log(`Calling getSnap query=${JSON.stringify(query)}`);
      logInfo('trustivs.getSnap.request', { query });
      const res = await this.up.request<any>('GET', '/gatewayGBS/openApi/getSnap', { query, headers });
      logInfo('trustivs.getSnap.response', res);
      if (res.code !== '1') { logWarn('trustivs.getSnap.non_success', res); throw new Error(res.message || 'upstream error'); }
      return res.data;
    }, 'snap');
  }
}
