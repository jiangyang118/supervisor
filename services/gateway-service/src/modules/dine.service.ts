import { Injectable, MessageEvent, BadRequestException } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export type Meal = '早餐' | '午餐' | '晚餐';
export type DineSource = 'manual' | 'qr' | 'camera';

export type DineRecord = {
  id: string;
  schoolId: string;
  meal: Meal;
  people: string[];
  imageUrl?: string;
  comment?: string;
  at: string; // ISO time
  source: DineSource;
  exception?: boolean;
  exceptionReason?: string;
  measure?: string;
};

@Injectable()
export class DineService {
  private seq = 1;
  private records: DineRecord[] = [];
  private events$ = new Subject<MessageEvent>();
  private qrTokens = new Map<string, { schoolId: string; meal: Meal; createdAt: number }>();

  constructor() {
    this.seed();
  }

  private id() {
    return `DW-${String(this.seq++).padStart(4, '0')}`;
  }
  private nowIso() {
    return new Date().toISOString();
  }
  private emit(event: string, data: any) {
    this.events$.next({ type: event, data });
  }

  list(params: {
    schoolId?: string;
    meal?: Meal;
    exception?: 'true' | 'false';
    start?: string;
    end?: string;
    page?: number | string;
    pageSize?: number | string;
  }) {
    const sid = params.schoolId || 'sch-001';
    let arr = this.records.filter((r) => r.schoolId === sid);
    if (params.meal) arr = arr.filter((r) => r.meal === params.meal);
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
    meal: Meal;
    people: string[];
    imageUrl?: string;
    comment?: string;
    source?: DineSource;
  }) {
    if (!body?.meal) throw new BadRequestException('meal is required');
    if (!Array.isArray(body.people) || body.people.length === 0)
      throw new BadRequestException('people is required');
    const rec: DineRecord = {
      id: this.id(),
      schoolId: body.schoolId || 'sch-001',
      meal: body.meal,
      people: body.people,
      imageUrl: body.imageUrl,
      comment: body.comment,
      at: this.nowIso(),
      source: body.source || 'manual',
      exception: !body.imageUrl || (body.people?.length ?? 0) === 0,
      exceptionReason: !body.imageUrl
        ? '缺少陪餐图片'
        : (body.people?.length ?? 0) === 0
          ? '缺少陪餐人员'
          : undefined,
    };
    this.records.unshift(rec);
    this.emit('dine-created', rec);
    return rec;
  }

  cameraCallback(body: {
    schoolId?: string;
    meal: Meal;
    people: string[];
    imageUrl: string;
    comment?: string;
  }) {
    if (!body?.imageUrl) throw new BadRequestException('imageUrl is required');
    return this.create({ ...body, source: 'camera' });
  }

  setMeasure(id: string, measure: string) {
    const idx = this.records.findIndex((r) => r.id === id);
    if (idx === -1) return { ok: false };
    this.records[idx].measure = measure;
    this.emit('dine-updated', this.records[idx]);
    return { ok: true, record: this.records[idx] };
  }

  // QR
  createQr(payload: { schoolId?: string; meal: Meal }) {
    const token = Math.random().toString(36).slice(2, 10);
    this.qrTokens.set(token, {
      schoolId: payload.schoolId || 'sch-001',
      meal: payload.meal,
      createdAt: Date.now(),
    });
    const link = `/mobile/dine?token=${token}`;
    return { token, link };
  }
  submitQr(body: { token: string; people: string[]; imageUrl?: string; comment?: string }) {
    const meta = this.qrTokens.get(body.token);
    if (!meta) return { ok: false, message: 'token 无效或已过期' };
    if (!Array.isArray(body.people) || body.people.length === 0)
      throw new BadRequestException('people is required');
    this.qrTokens.delete(body.token);
    const rec = this.create({
      schoolId: meta.schoolId,
      meal: meta.meal,
      people: body.people,
      imageUrl: body.imageUrl,
      comment: body.comment,
      source: 'qr',
    });
    return { ok: true, record: rec };
  }

  stream(): Observable<MessageEvent> {
    setTimeout(() => this.events$.next({ type: 'hello', data: { ok: true } }), 0);
    return this.events$.asObservable();
  }

  private seed() {
    this.create({
      schoolId: 'sch-001',
      meal: '午餐',
      people: ['校长', '食堂主管'],
      imageUrl: null as any,
      comment: '满意',
      source: 'manual',
    });
    this.create({
      schoolId: 'sch-001',
      meal: '早餐',
      people: ['年级主任'],
      imageUrl: 'https://example.com/img1.jpg',
      comment: '良好',
      source: 'camera',
    });
    this.create({
      schoolId: 'sch-002',
      meal: '晚餐',
      people: ['后勤'],
      imageUrl: 'https://example.com/img2.jpg',
      comment: '一般',
      source: 'manual',
    });
  }
}
