import { Injectable, MessageEvent, BadRequestException } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { DineRepository } from './repositories/dine.repository';
import { MealTypeEnum, MealTypeLabel } from '../enums/meal-type.enum';

export type Meal = '早餐' | '午餐' | '晚餐';
export const MEALS: Meal[] = ['早餐', '午餐', '晚餐'];
export const MEAL_OPTIONS: Array<{ key: Meal; value: string }> = [
  { key: '早餐', value: '早餐' },
  { key: '午餐', value: '午餐' },
  { key: '晚餐', value: '晚餐' },
];
export type DineSource = 'manual' | 'qr' | 'camera';

export type DineRecord = {
  id: string; // external ID like DW-000001
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
  private events$ = new Subject<MessageEvent>();
  private qrTokens = new Map<string, { schoolId: string; meal: Meal; createdAt: number }>();
  constructor(private readonly repo: DineRepository) {}
  private nowIso() {
    return new Date().toISOString();
  }
  private emit(event: string, data: any) {
    this.events$.next({ type: event, data });
  }

  async list(params: {
    schoolId?: string;
    meal?: Meal;
    exception?: 'true' | 'false';
    start?: string;
    end?: string;
    page?: number | string;
    pageSize?: number | string;
  }) {
    const sid = params.schoolId || '1';
    const page = Math.max(1, parseInt(String(params.page ?? 1), 10) || 1);
    const pageSize = Math.max(1, parseInt(String(params.pageSize ?? 20), 10) || 20);
    const res = await this.repo.search({
      schoolId: sid,
      meal: params.meal,
      exception: params.exception === 'true' ? true : params.exception === 'false' ? false : undefined,
      start: params.start,
      end: params.end,
      page,
      pageSize,
    });
    const items: DineRecord[] = res.items.map((r) => ({
      id: `DW-${String(r.id).padStart(6, '0')}`,
      schoolId: String(r.schoolId),
      meal: (r.meal as Meal),
      people: (r.people || '').split(',').filter(Boolean),
      imageUrl: r.imageUrl || undefined,
      comment: r.comment || undefined,
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
    meal: Meal;
    people: string[];
    imageUrl?: string;
    comment?: string;
    source?: DineSource;
  }) {
    if (!body?.meal) throw new BadRequestException('meal is required');
    if (!Array.isArray(body.people) || body.people.length === 0)
      throw new BadRequestException('people is required');
    const at = this.nowIso();
    const exception = !body.imageUrl || (body.people?.length ?? 0) === 0;
    const mealKey = this.mealToKey(body.meal);
    const insertId = await this.repo.insert({
      schoolId: Number(body.schoolId || 1),
      mealKey,
      meal: body.meal,
      people: body.people.join(','),
      imageUrl: body.imageUrl,
      comment: body.comment,
      at,
      source: body.source || 'manual',
      exception: exception ? 1 : 0,
      exceptionReason: exception
        ? (!body.imageUrl ? '缺少陪餐图片' : (body.people?.length ?? 0) === 0 ? '缺少陪餐人员' : undefined)
        : undefined,
      measure: undefined,
    } as any);
    const rec: DineRecord = {
      id: `DW-${String(insertId).padStart(6, '0')}`,
      schoolId: String(body.schoolId || 1),
      meal: body.meal,
      people: body.people,
      imageUrl: body.imageUrl,
      comment: body.comment,
      at,
      source: body.source || 'manual',
      exception,
      exceptionReason: exception
        ? (!body.imageUrl ? '缺少陪餐图片' : (body.people?.length ?? 0) === 0 ? '缺少陪餐人员' : undefined)
        : undefined,
      measure: undefined,
    };
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

  async setMeasure(id: string, measure: string) {
    const numericId = this.externalIdToNumber(id);
    await this.repo.updateMeasure(numericId, measure);
    this.emit('dine-updated', { id, measure });
    return { ok: true } as any;
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

  private mealToKey(meal: Meal): string {
    // reverse map label -> enum key
    const code = Object.entries(MealTypeLabel).find(([, v]) => v === meal)?.[0];
    const key = Object.keys(MealTypeEnum).find((k) => (MealTypeEnum as any)[k] === Number(code));
    return key || 'LUNCH';
  }
  private externalIdToNumber(external: string): number {
    const m = String(external || '').match(/(\d+)/);
    return m ? Number(m[1]) : Number(external);
  }
}
