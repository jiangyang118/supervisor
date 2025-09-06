import { Injectable, Logger } from '@nestjs/common';
import { TrustivsUpstreamService } from '../upstream.service';
import { TrustivsCacheService } from '../cache.service';
import { resolvePolicies } from '../cache.config';
import { logInfo, logWarn } from '../../../common/file-logger';

@Injectable()
export class TrustivsPlaybackService {
  private policies = resolvePolicies();
  private readonly logger = new Logger('TrustivsPlaybackService');
  constructor(private readonly up: TrustivsUpstreamService, private readonly cache: TrustivsCacheService) {}

  async getBackUrl(query: any, headers?: Record<string, string>) {
    const key = `back:${JSON.stringify(query)}`;
    return this.cache.getOrRefresh(key, this.policies.playback, async () => {
      this.logger.log(`Calling getBackUrl with query=${JSON.stringify(query)}`);
      logInfo('trustivs.getBackUrl.request', { query });
      const res = await this.up.request<any>('GET', '/gatewayGBS/openApi/getBackUrl', { query, headers });
      logInfo('trustivs.getBackUrl.response', res);
      if (res.code !== '1') { logWarn('trustivs.getBackUrl.non_success', res); throw new Error(res.message || 'upstream error'); }
      return res.data;
    }, 'back');
  }

  async getDownloadUrl(query: any, headers?: Record<string, string>) {
    const key = `download:${JSON.stringify(query)}`;
    return this.cache.getOrRefresh(key, this.policies.playback, async () => {
      this.logger.log(`Calling getDownloadUrl with query=${JSON.stringify(query)}`);
      logInfo('trustivs.getDownloadUrl.request', { query });
      const res = await this.up.request<any>('GET', '/gatewayGBS/openApi/getDownloadUrl', { query, headers });
      logInfo('trustivs.getDownloadUrl.response', res);
      if (res.code !== '1') { logWarn('trustivs.getDownloadUrl.non_success', res); throw new Error(res.message || 'upstream error'); }
      return res.data;
    }, 'download');
  }
}
