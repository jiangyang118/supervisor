import { Injectable, MessageEvent, BadRequestException } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { PesticideRepository } from './repositories/pesticide.repository';

export type PesticideResult = '合格' | '不合格';

export type PesticideRecord = {
  id: number;
  schoolId: number;
  sample: string;
  device: string;
  result: PesticideResult;
  imageUrl?: string;
  remark?: string;
  at: string; // ISO
  source: 'manual' | 'device';
  exception: boolean;
  measure?: string;
};

@Injectable()
export class PesticideService {
  private seq = 1;
  private events$ = new Subject<MessageEvent>();

  constructor(private readonly repo: PesticideRepository) {}

  // id is DB auto-increment
  private nowIso() {
    return new Date().toISOString();
  }
  private emit(type: string, data: any) {
    this.events$.next({ type, data });
  }

  async list(params: {
    schoolId?: number | string;
    q?: string;
    result?: PesticideResult;
    start?: string;
    end?: string;
    page?: number | string;
    pageSize?: number | string;
  }) {
    const p = Math.max(1, parseInt(String(params.page ?? 1), 10) || 1);
    const ps = Math.max(1, parseInt(String(params.pageSize ?? 20), 10) || 20);
    const sidInput = params.schoolId;
    const sidNum = sidInput !== undefined && sidInput !== null && String(sidInput).trim() !== '' ? Number(sidInput) : NaN;
    const sid = Number.isFinite(sidNum) && Number.isInteger(sidNum) ? sidNum : undefined;
    return this.repo.list({
      schoolId: sid,
      q: params.q,
      result: params.result,
      start: params.start,
      end: params.end,
      page: p,
      pageSize: ps,
    });
  }

  async create(body: {
    schoolId?: number | string;
    sample: string;
    device: string;
    result: PesticideResult;
    imageUrl?: string;
    remark?: string;
    source?: 'manual' | 'device';
  }) {
    if (!body?.sample || String(body.sample).trim() === '')
      throw new BadRequestException('sample is required');
    if (!body?.device || String(body.device).trim() === '')
      throw new BadRequestException('device is required');
    if (!body?.result) throw new BadRequestException('result is required');
    const schoolId = (() => { const s = body.schoolId; const n = s!==undefined&&s!==null&&String(s).trim()!==''?Number(s):NaN; return Number.isFinite(n)&&Number.isInteger(n)?n:1; })();
    const at = this.nowIso();
    const exception = body.result === '不合格';
    const insertId = await this.repo.insert({ schoolId, sample: body.sample, device: body.device, result: body.result, imageUrl: body.imageUrl, remark: body.remark, at, source: body.source || 'manual', exception });
    const rec: PesticideRecord = { id: insertId, schoolId, sample: body.sample, device: body.device, result: body.result, imageUrl: body.imageUrl, remark: body.remark, at, source: body.source || 'manual', exception };
    this.emit('pesticide-created', rec);
    return rec;
  }

  deviceCallback(body: {
    schoolId?: number | string;
    sample: string;
    device: string;
    result: PesticideResult;
    remark?: string;
  }) {
    return this.create({ ...body, source: 'device' });
  }

  async setMeasure(id: number, measure: string) {
    await this.repo.setMeasure(id, measure);
    this.emit('pesticide-updated', { id, measure });
    return { ok: true } as any;
  }

  stream(): Observable<MessageEvent> {
    setTimeout(() => this.events$.next({ type: 'hello', data: { ok: true } }), 0);
    return this.events$.asObservable();
  }

  private seed() {}
}
