import { Injectable, MessageEvent, BadRequestException } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

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
  private records: PesticideRecord[] = [];
  private events$ = new Subject<MessageEvent>();

  constructor() {
    this.seed();
  }

  private id() {
    return `PT-${String(this.seq++).padStart(4, '0')}`;
  }
  private nowIso() {
    return new Date().toISOString();
  }
  private emit(type: string, data: any) {
    this.events$.next({ type, data });
  }

  list(params: {
    schoolId?: string;
    q?: string;
    result?: PesticideResult;
    start?: string;
    end?: string;
    page?: number | string;
    pageSize?: number | string;
  }) {
    const sid = params.schoolId || 'sch-001';
    let arr = this.records.filter((r) => r.schoolId === sid);
    if (params.q) {
      const q = params.q.trim();
      arr = arr.filter((r) => r.sample.includes(q) || r.device.includes(q));
    }
    if (params.result) arr = arr.filter((r) => r.result === params.result);
    if (params.start) arr = arr.filter((r) => r.at >= params.start!);
    if (params.end) arr = arr.filter((r) => r.at <= params.end!);
    arr = arr.sort((a, b) => (a.at < b.at ? 1 : -1));
    let p = Math.max(1, parseInt(String(params.page ?? 1), 10) || 1);
    const ps = Math.max(1, parseInt(String(params.pageSize ?? 20), 10) || 20);
    const total = arr.length;
    const maxPage = Math.max(1, Math.ceil(total / ps) || 1);
    if (p > maxPage) p = maxPage;
    const items = arr.slice((p - 1) * ps, p * ps);
    return { items, total, page: p, pageSize: ps };
  }

  create(body: {
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
    this.records.unshift(rec);
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

  setMeasure(id: string, measure: string) {
    const idx = this.records.findIndex((r) => r.id === id);
    if (idx === -1) return { ok: false };
    this.records[idx].measure = measure;
    this.emit('pesticide-updated', this.records[idx]);
    return { ok: true, record: this.records[idx] };
  }

  stream(): Observable<MessageEvent> {
    setTimeout(() => this.events$.next({ type: 'hello', data: { ok: true } }), 0);
    return this.events$.asObservable();
  }

  private seed() {
    this.create({ schoolId: 'sch-001', sample: '黄瓜', device: 'PRT-100', result: '合格' });
    this.create({
      schoolId: 'sch-001',
      sample: '菠菜',
      device: 'PRT-100',
      result: '不合格',
      remark: '农残偏高',
    });
    this.create({ schoolId: 'sch-002', sample: '西红柿', device: 'PRT-200', result: '合格' });
  }
}
