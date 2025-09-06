import { Injectable, Logger } from '@nestjs/common';
import { TrustivsConfigService } from './trustivs.config.service';

@Injectable()
export class CameraService {
  private readonly logger = new Logger('TrustivsCameraService');
  constructor(private readonly http: TrustivsConfigService) {}

  private buildPayload(params?: { pageNum?: number; pageSize?: number }) {
    const pageNum = params?.pageNum ?? 1;
    const pageSize = params?.pageSize ?? 10;
    return {
      fthirdcomnum: process.env.ylt_thirdcom || 'cpt0904',
      deviceSn: process.env.ylt_device_sn || 'HQDZKFGBDJGCJ0017',
      pageNum,
      pageSize,
    };
  }

  private async tryPost(path: string, params?: { pageNum?: number; pageSize?: number }) {
    const body = this.buildPayload(params);
    // First try JSON
    const r1 = await this.http.request({ method: 'POST', path, body });
    if (r1.status !== 405) return r1;
    // If 405, try form-urlencoded (some gateways require it)
    const form = new URLSearchParams(Object.entries(body) as any).toString();
    return this.http.request({ method: 'POST', path, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form });
  }

  async getCameraByCompany(params?: { pageNum?: number; pageSize?: number }) {
    const path = '/gatewayGBS/openApi/getCameraByCompany';
    const res = await this.tryPost(path, params);
    if (res.status === 200 && res.json && (res.json.code === '1' || res.json.code === 1)) {
      return res.json;
    }
    if (res.status === 405) {
      this.logger.warn(`POST ${path} returned 405 (json and form tried)`);
    }
    return { code: '0', message: 'getCameraByCompany 调用失败（POST不可用）' };
  }
}
