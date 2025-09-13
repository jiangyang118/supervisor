import { Injectable, Logger } from '@nestjs/common';
import { TrustivsConfigService } from './trustivs.config.service';
import { TrustivsCamerasRepository } from '../repositories/trustivs-cameras.repository';

@Injectable()
export class CameraService {
  private readonly logger = new Logger('TrustivsCameraService');
  constructor(
    private readonly http: TrustivsConfigService,
    private readonly camsRepo: TrustivsCamerasRepository,
  ) {}

  private buildPayload(params?: { pageNum?: number; pageSize?: number; thirdCom?: string; deviceSn?: string; schoolId?: number | string; canteenId?: number | string }) {
    const pageNum = params?.pageNum ?? 1;
    const pageSize = params?.pageSize ?? 10;
    return {
      fthirdcomnum: params?.thirdCom || process.env.ylt_thirdcom || 'cpt0904',
      deviceSn: params?.deviceSn || process.env.ylt_device_sn || 'HQDZKFGBDJGCJ0017',
      pageNum,
      pageSize,
    };
  }

  private async tryPost(path: string, params?: { pageNum?: number; pageSize?: number; thirdCom?: string; deviceSn?: string; schoolId?: number | string; canteenId?: number | string }) {
    const body = this.buildPayload(params);
    // First try JSON
    const r1 = await this.http.request({ method: 'POST', path, body });
    if (r1.status !== 405) return r1;
    // If 405, try form-urlencoded (some gateways require it)
    const form = new URLSearchParams(Object.entries(body) as any).toString();
    return this.http.request({ method: 'POST', path, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form });
  }

  async getCameraByCompany(params?: { pageNum?: number; pageSize?: number; thirdCom?: string; deviceSn?: string; schoolId?: number | string; canteenId?: number | string }) {
    const path = '/gatewayGBS/openApi/getCameraByCompany';
    const res = await this.tryPost(path, params);
    if (res.status === 200 && res.json && (res.json.code === '1' || res.json.code === 1)) {
      try {
        const data = res.json?.data ?? res.json;
        const list: any[] = Array.isArray(data?.list) ? data.list : Array.isArray(data) ? data : [];
        if (list.length) {
          await this.camsRepo.upsertList(list, {
            schoolId: params?.schoolId,
            canteenId: params?.canteenId,
            api: path,
            third: this.buildPayload(params).fthirdcomnum,
          });
        }
      } catch (e) {
        this.logger.warn(`Persist cameras failed: ${String((e as any)?.message || e)}`);
      }
      return res.json;
    }
    if (res.status === 405) {
      this.logger.warn(`POST ${path} returned 405 (json and form tried)`);
    }
    return { code: '0', message: 'getCameraByCompany 调用失败（POST不可用）' };
  }
}
