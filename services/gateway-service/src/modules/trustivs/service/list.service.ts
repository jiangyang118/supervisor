import { Injectable, Logger } from '@nestjs/common';
import { TrustivsUpstreamService } from '../upstream.service';
import { TrustivsCacheService } from '../cache.service';
import { resolvePolicies } from '../cache.config';
import { normalizePage } from '../pagination';
import { logInfo, logWarn } from '../../../common/file-logger';

@Injectable()
export class TrustivsListService {
  private policies = resolvePolicies();
  private readonly logger = new Logger('TrustivsListService');
  constructor(private readonly up: TrustivsUpstreamService, private readonly cache: TrustivsCacheService) {}

  async getCompanyList(body: any, headers?: Record<string, string>) {
    const { pageNum, pageSize } = normalizePage(body || {});
    const key = `company:${pageNum}:${pageSize}:${JSON.stringify(body)}`;
    return this.cache.getOrRefresh(key, this.policies.lists, async () => {
      const req = { ...body, pageNum, pageSize };
      this.logger.log(`Calling getCompanyList body=${JSON.stringify(req)}`);
      logInfo('trustivs.getCompanyList.request', { body: req });
      const res = await this.up.request<any>('POST', '/gatewayGBS/openApi/getCompanyList', { body: req, headers });
      logInfo('trustivs.getCompanyList.response', res);
      if (res.code !== '1') { logWarn('trustivs.getCompanyList.non_success', res); throw new Error(res.message || 'upstream error'); }
      return res.data;
    }, 'company');
  }

  async getDeviceListByCompany(body: any, headers?: Record<string, string>) {
    const { pageNum, pageSize } = normalizePage(body || {});
    const key = `devlist:${pageNum}:${pageSize}:${JSON.stringify(body)}`;
    return this.cache.getOrRefresh(key, this.policies.lists, async () => {
      const req = { ...body, pageNum, pageSize };
      this.logger.log(`Calling getDeviceListByCompany body=${JSON.stringify(req)}`);
      logInfo('trustivs.getDeviceListByCompany.request', { body: req });
      const res = await this.up.request<any>('POST', '/gatewayGBS/openApi/getDeviceListByCompany', { body: req, headers });
      logInfo('trustivs.getDeviceListByCompany.response', res);
      if (res.code !== '1') { logWarn('trustivs.getDeviceListByCompany.non_success', res); throw new Error(res.message || 'upstream error'); }
      return res.data;
    }, 'device');
  }

  // getCameraByCompany removed: unified into CameraService

  async getChannelByDevice(body: any, headers?: Record<string, string>) {
    const key = `channel:${JSON.stringify(body)}`;
    return this.cache.getOrRefresh(key, this.policies.lists, async () => {
      this.logger.log(`Calling getChannelByDevice body=${JSON.stringify(body)}`);
      logInfo('trustivs.getChannelByDevice.request', { body });
      const res = await this.up.request<any>('POST', '/gatewayGBS/openApi/getChannelByDevice', { body, headers });
      logInfo('trustivs.getChannelByDevice.response', res);
      if (res.code !== '1') { logWarn('trustivs.getChannelByDevice.non_success', res); throw new Error(res.message || 'upstream error'); }
      return res.data;
    }, 'channel');
  }
}
