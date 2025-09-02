import { Injectable, MessageEvent, BadRequestException } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { PesticideRepository } from './repositories/pesticide.repository';

export type PesticideResult = '合格' | '不合格';

export type PesticideRecord = {
  id: string;
  schoolId: string;
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

  private id() {
    return `PT-${String(this.seq++).padStart(4, '0')}`;
  }
  private nowIso() {
    return new Date().toISOString();
  }
  private emit(type: string, data: any) {
    this.events$.next({ type, data });
  }

  async list(params: {
    schoolId?: string;
    q?: string;
    result?: PesticideResult;
    start?: string;
    end?: string;
    page?: number | string;
    pageSize?: number | string;
  }) {
    const p = Math.max(1, parseInt(String(params.page ?? 1), 10) || 1);
    const ps = Math.max(1, parseInt(String(params.pageSize ?? 20), 10) || 20);
    return this.repo.list({
      schoolId: params.schoolId || 'sch-001',
      q: params.q,
      result: params.result,
      start: params.start,
      end: params.end,
      page: p,
      pageSize: ps,
    });
  }

  async create(body: {
    schoolId?: string;
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
    const rec: PesticideRecord = {
      id: this.id(),
      schoolId: body.schoolId || 'sch-001',
      sample: body.sample,
      device: body.device,
      result: body.result,
      imageUrl: body.imageUrl,
      remark: body.remark,
      at: this.nowIso(),
      source: body.source || 'manual',
      exception: body.result === '不合格',
    };
    await this.repo.insert(rec);
    this.emit('pesticide-created', rec);
    return rec;
  }

  deviceCallback(body: {
    schoolId?: string;
    sample: string;
    device: string;
    result: PesticideResult;
    remark?: string;
  }) {
    return this.create({ ...body, source: 'device' });
  }

  async setMeasure(id: string, measure: string) {
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
