import { Injectable, MessageEvent, BadRequestException } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export type DisinfectionMethod = '酒精' | '紫外' | '高温';

export type DisinfectionRecord = {
  id: string;
  schoolId: string;
  method: DisinfectionMethod;
  duration: number; // minutes
  items: string; // objects/areas
  imageUrl?: string;
  at: string; // ISO time
  source: 'manual' | 'device';
  exception: boolean;
  exceptionReason?: string;
  measure?: string;
};

@Injectable()
export class DisinfectionService {
  private seq = 1;
  private records: DisinfectionRecord[] = [];
  private events$ = new Subject<MessageEvent>();

  constructor() {
    this.seed();
  }

  private id() {
    return `DS-${String(this.seq++).padStart(4, '0')}`;
  }
  private nowIso() {
    return new Date().toISOString();
  }
  private emit(type: string, data: any) {
    this.events$.next({ type, data });
  }

  list(params: {
    schoolId?: string;
    method?: DisinfectionMethod;
    exception?: 'true' | 'false';
    start?: string;
    end?: string;
    page?: number | string;
    pageSize?: number | string;
  }) {
    const sid = params.schoolId || 'sch-001';
    let arr = this.records.filter((r) => r.schoolId === sid);
    if (params.method) arr = arr.filter((r) => r.method === params.method);
    if (params.exception === 'true') arr = arr.filter((r) => r.exception);
    if (params.exception === 'false') arr = arr.filter((r) => !r.exception);
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
    method: DisinfectionMethod;
    duration: number;
    items: string;
    imageUrl?: string;
    source?: 'manual' | 'device';
  }) {
    if (!body?.method) throw new BadRequestException('method is required');
    if (body.duration === undefined || Number(body.duration) <= 0)
      throw new BadRequestException('duration must be > 0');
    if (!body?.items || String(body.items).trim() === '')
      throw new BadRequestException('items is required');
    const duration = Number(body.duration);
    const rec: DisinfectionRecord = {
      id: this.id(),
      schoolId: body.schoolId || 'sch-001',
      method: body.method,
      duration,
      items: body.items,
      imageUrl: body.imageUrl,
      at: this.nowIso(),
      source: body.source || 'manual',
      exception: duration < 10 || !body.imageUrl,
      exceptionReason: duration < 10 ? '时长不足' : !body.imageUrl ? '缺少图片' : undefined,
    };
    this.records.unshift(rec);
    this.emit('disinfection-created', rec);
    return rec;
  }

  deviceCallback(body: {
    schoolId?: string;
    method: DisinfectionMethod;
    duration: number;
    items: string;
    imageUrl?: string;
  }) {
    return this.create({ ...body, source: 'device' });
  }

  setMeasure(id: string, measure: string) {
    const idx = this.records.findIndex((r) => r.id === id);
    if (idx === -1) return { ok: false };
    this.records[idx].measure = measure;
    this.emit('disinfection-updated', this.records[idx]);
    return { ok: true, record: this.records[idx] };
  }

  stream(): Observable<MessageEvent> {
    setTimeout(() => this.events$.next({ type: 'hello', data: { ok: true } }), 0);
    return this.events$.asObservable();
  }

  private seed() {
    this.create({
      schoolId: 'sch-001',
      method: '酒精',
      duration: 30,
      items: '案板/台面',
      imageUrl: 'https://example.com/d1.jpg',
    });
    this.create({
      schoolId: 'sch-001',
      method: '紫外',
      duration: 8,
      items: '餐具',
      imageUrl: 'https://example.com/d2.jpg',
    }); // 异常：时长不足
    this.create({
      schoolId: 'sch-001',
      method: '高温',
      duration: 20,
      items: '蒸箱',
      imageUrl: '' as any,
    }); // 异常：缺少图片
    this.create({
      schoolId: 'sch-002',
      method: '酒精',
      duration: 25,
      items: '储物柜',
      imageUrl: 'https://example.com/d3.jpg',
    });
  }
}
