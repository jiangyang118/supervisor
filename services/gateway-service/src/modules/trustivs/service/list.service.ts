import { Injectable, Logger } from '@nestjs/common';
import { TrustivsUpstreamService } from '../upstream.service';
import { TrustivsCacheService } from '../cache.service';
import { resolvePolicies } from '../cache.config';
import { normalizePage } from '../pagination';
import { logInfo, logWarn, logError } from '../../../common/file-logger';

@Injectable()
export class TrustivsListService {
  private policies = resolvePolicies();
  private readonly logger = new Logger('TrustivsListService');
  constructor(private readonly up: TrustivsUpstreamService, private readonly cache: TrustivsCacheService) {}

  async getCompanyList(body: any, headers?: Record<string, string>) {
    const { pageNum, pageSize } = normalizePage(body || {});
    const key = `company:${pageNum}:${pageSize}:${JSON.stringify(body)}`;
    return this.cache.getOrRefresh(key, this.policies.lists, async () => {
      const res = await this.up.request<any>('POST', '/gatewayGBS/openApi/getCompanyList', { body: { ...body, pageNum, pageSize }, headers });
      if (res.code !== '1') throw new Error(res.message || 'upstream error');
      return res.data;
    }, 'company');
  }

  async getDeviceListByCompany(body: any, headers?: Record<string, string>) {
    const { pageNum, pageSize } = normalizePage(body || {});
    const key = `devlist:${pageNum}:${pageSize}:${JSON.stringify(body)}`;
    return this.cache.getOrRefresh(key, this.policies.lists, async () => {
      const res = await this.up.request<any>('POST', '/gatewayGBS/openApi/getDeviceListByCompany', { body: { ...body, pageNum, pageSize }, headers });
      if (res.code !== '1') throw new Error(res.message || 'upstream error');
      return res.data;
    }, 'device');
  }

  async getCameraByCompany(body: any, headers?: Record<string, string>) {
    const key = `camera:${JSON.stringify(body)}`;
    return this.cache.getOrRefresh(key, this.policies.lists, async () => {
      this.logger.log(`Calling getCameraByCompany with body=${JSON.stringify(body)}`);
      logInfo('trustivs.getCameraByCompany.request', { body });
      const res = await this.up.request<any>('POST', '/gatewayGBS/openApi/getCameraByCompany', { body, headers });
      // Log full upstream response for debugging (as requested)
      logInfo('trustivs.getCameraByCompany.response', res);
      this.logger.log(`getCameraByCompany code=${res?.code} size=${Array.isArray(res?.data?.list)? res.data.list.length : 'n/a'}`);
      if (res.code !== '1') {
        logWarn('trustivs.getCameraByCompany.non_success', res);
        throw new Error(res.message || 'upstream error');
      }
      return res.data;
    }, 'camera');
  }

  async getChannelByDevice(body: any, headers?: Record<string, string>) {
    const key = `channel:${JSON.stringify(body)}`;
    return this.cache.getOrRefresh(key, this.policies.lists, async () => {
      const res = await this.up.request<any>('POST', '/gatewayGBS/openApi/getChannelByDevice', { body, headers });
      if (res.code !== '1') throw new Error(res.message || 'upstream error');
      return res.data;
    }, 'channel');
  }
}
