import { BadRequestException, Injectable } from '@nestjs/common';
import { DeviceSafetyRepository } from './repositories/device-safety.repository';

export type DeviceSafetyResult = '正常' | '异常';

@Injectable()
export class DeviceSafetyService {
  constructor(private readonly repo: DeviceSafetyRepository) {}

  async list(params: { schoolId?: number | string; canteenId?: number | string; start?: string; end?: string; page?: number | string; pageSize?: number | string }) {
    const sid = (() => { const s = params.schoolId; const n = s!==undefined&&s!==null&&String(s).trim()!==''?Number(s):NaN; return Number.isFinite(n)&&Number.isInteger(n)?n:1; })();
    const cid = (() => { const s = params.canteenId; const n = s!==undefined&&s!==null&&String(s).trim()!==''?Number(s):NaN; return Number.isFinite(n)&&Number.isInteger(n)?n:undefined; })();
    const p = Math.max(1, parseInt(String(params.page ?? 1), 10) || 1);
    const ps = Math.max(1, parseInt(String(params.pageSize ?? 20), 10) || 20);
    return this.repo.search({ schoolId: sid, canteenId: cid, start: params.start, end: params.end, page: p, pageSize: ps });
  }

  async create(body: {
    schoolId?: number | string;
    canteenId?: number | string;
    deviceName: string;
    items: string[];
    result: DeviceSafetyResult;
    description?: string;
    measures?: string;
    handler?: string;
    imageUrl?: string;
    signatureData?: string;
    checkDate: string; // ISO date
  }) {
    if (!body?.deviceName || String(body.deviceName).trim() === '') throw new BadRequestException('deviceName required');
    if (!Array.isArray(body.items) || body.items.length === 0) throw new BadRequestException('items required');
    if (body.result === '异常') {
      if (!body.measures || String(body.measures).trim() === '') throw new BadRequestException('measures required for abnormal');
      if (!body.handler || String(body.handler).trim() === '') throw new BadRequestException('handler required for abnormal');
    }
    if (!body.checkDate) throw new BadRequestException('checkDate required');
    const schoolId = (() => { const s = body.schoolId; const n = s!==undefined&&s!==null&&String(s).trim()!==''?Number(s):NaN; return Number.isFinite(n)&&Number.isInteger(n)?n:1; })();
    const canteenId = (() => { const s = body.canteenId; const n = s!==undefined&&s!==null&&String(s).trim()!==''?Number(s):NaN; return Number.isFinite(n)&&Number.isInteger(n)?n:undefined; })();
    const id = await this.repo.insert({
      schoolId,
      canteenId,
      deviceName: body.deviceName,
      items: body.items.join(','),
      result: body.result,
      description: body.description,
      measures: body.measures,
      handler: body.handler,
      imageUrl: body.imageUrl,
      signatureData: body.signatureData,
      checkDate: body.checkDate,
      createdAt: new Date().toISOString(),
    } as any);
    return { id };
  }

  async detail(id: number | string) {
    const num = (() => { const n = Number(id); return Number.isFinite(n) ? n : NaN; })();
    if (!Number.isFinite(num)) throw new BadRequestException('invalid id');
    const r = await this.repo.getById(num);
    if (!r) throw new BadRequestException('not found');
    return r;
  }
}

