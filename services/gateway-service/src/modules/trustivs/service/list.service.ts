import { Injectable } from '@nestjs/common';
import { TrustivsUpstreamService } from '../upstream.service';
import { TrustivsCacheService } from '../cache.service';
import { resolvePolicies } from '../cache.config';
import { normalizePage } from '../pagination';

@Injectable()
export class TrustivsListService {
  private policies = resolvePolicies();
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
      const res = await this.up.request<any>('POST', '/gatewayGBS/openApi/getCameraByCompany', { body, headers });
      if (res.code !== '1') throw new Error(res.message || 'upstream error');
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

