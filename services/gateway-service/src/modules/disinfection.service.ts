import { Injectable, MessageEvent, BadRequestException } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { DisinfectionRepository } from './repositories/disinfection.repository';

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
  private events$ = new Subject<MessageEvent>();

  constructor(private readonly repo: DisinfectionRepository) {}
  private nowIso() {
    return new Date().toISOString();
  }
  private emit(type: string, data: any) {
    this.events$.next({ type, data });
  }

  async list(params: {
    schoolId?: string;
    method?: DisinfectionMethod;
    exception?: 'true' | 'false';
    start?: string;
    end?: string;
    page?: number | string;
    pageSize?: number | string;
  }) {
    const sid = params.schoolId || '1';
    const p = Math.max(1, parseInt(String(params.page ?? 1), 10) || 1);
    const ps = Math.max(1, parseInt(String(params.pageSize ?? 20), 10) || 20);
    const res = await this.repo.search({
      schoolId: sid,
      method: params.method,
      exception: params.exception === 'true' ? true : params.exception === 'false' ? false : undefined,
      start: params.start,
      end: params.end,
      page: p,
      pageSize: ps,
    });
    const items: DisinfectionRecord[] = res.items.map((r) => ({
      id: `DS-${String(r.id).padStart(6, '0')}`,
      schoolId: String(r.schoolId),
      method: r.method as DisinfectionMethod,
      duration: Number(r.duration),
      items: r.items,
      imageUrl: r.imageUrl || undefined,
      at: new Date(r.at).toISOString(),
      source: r.source,
      exception: r.exception === 1,
      exceptionReason: r.exceptionReason || undefined,
      measure: r.measure || undefined,
    }));
    return { items, total: res.total, page: res.page, pageSize: res.pageSize };
  }

  async create(body: {
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
    const at = this.nowIso();
    const exception = duration < 10 || !body.imageUrl;
    const insertId = await this.repo.insert({
      schoolId: Number(body.schoolId || 1),
      method: body.method,
      duration,
      items: body.items,
      imageUrl: body.imageUrl,
      at,
      source: body.source || 'manual',
      exception: exception ? 1 : 0,
      exceptionReason: duration < 10 ? '时长不足' : !body.imageUrl ? '缺少图片' : undefined,
      measure: undefined,
    } as any);
    const rec: DisinfectionRecord = {
      id: `DS-${String(insertId).padStart(6, '0')}`,
      schoolId: String(body.schoolId || 1),
      method: body.method,
      duration,
      items: body.items,
      imageUrl: body.imageUrl,
      at,
      source: body.source || 'manual',
      exception,
      exceptionReason: duration < 10 ? '时长不足' : !body.imageUrl ? '缺少图片' : undefined,
      measure: undefined,
    };
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

  async setMeasure(id: string, measure: string) {
    const num = this.idToNumber(id);
    await this.repo.updateMeasure(num, measure);
    this.emit('disinfection-updated', { id, measure });
    return { ok: true } as any;
  }

  stream(): Observable<MessageEvent> {
    setTimeout(() => this.events$.next({ type: 'hello', data: { ok: true } }), 0);
    return this.events$.asObservable();
  }

  private idToNumber(external: string) {
    const m = String(external || '').match(/(\d+)/);
    return m ? Number(m[1]) : Number(external);
  }
}
