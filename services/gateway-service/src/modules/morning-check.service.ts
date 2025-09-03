import { Injectable, MessageEvent, BadRequestException } from '@nestjs/common';
import { MorningChecksRepository } from './repositories/morning-checks.repository';
import { Observable, Subject } from 'rxjs';

export type MCResult = '正常' | '异常';
export type MCEntry = {
  id: number;
  schoolId: number;
  staff: string;
  temp: number;
  result: MCResult;
  at: string; // ISO time
  source: 'manual' | 'device';
  reported: boolean;
  measure?: string; // 处理措施（仅异常）
};

@Injectable()
export class MorningCheckService {
  private seq = 1;
  private events$ = new Subject<MessageEvent>();

  constructor(private readonly repo?: MorningChecksRepository) {}

  private makeId() {
    const ts = Date.now();
    const rand = Math.floor(Math.random() * 1000);
    return ts * 1000 + rand;
  }
  private nowIso() {
    return new Date().toISOString();
  }
  private judge(temp: number): MCResult {
    return temp >= 37.3 ? '异常' : '正常';
  }
  private emit(event: string, data: any) {
    this.events$.next({ type: event, data });
  }

  async list(params: {
    schoolId?: number | string;
    staff?: string;
    result?: MCResult;
    start?: string;
    end?: string;
    page?: number | string;
    pageSize?: number | string;
  }) {
    const sidRaw = params.schoolId;
    const sidNum = sidRaw !== undefined && sidRaw !== null && String(sidRaw).trim() !== '' ? Number(sidRaw) : NaN;
    const sid = Number.isFinite(sidNum) && Number.isInteger(sidNum) ? sidNum : 1;
    const p = Math.max(1, parseInt(String(params.page ?? 1), 10) || 1);
    const ps = Math.max(1, parseInt(String(params.pageSize ?? 20), 10) || 20);
    if (this.repo) {
      try {
        const { items, total } = await this.repo.search({
          schoolId: sid,
          userId: params.staff,
          equipmentCode: undefined,
          abnormal: params.result ? params.result === '异常' : undefined,
          start: params.start,
          end: params.end,
          page: p,
          pageSize: ps,
        });
        const mapped = items.map((r) => ({
          id: Number(r.id),
          schoolId: Number(r.schoolId ?? sid),
          staff: r.userId,
          temp: Number(r.foreheadTemp),
          result: r.abnormalTemp ? ('异常' as MCResult) : ('正常' as MCResult),
          at: new Date(r.checkTime).toISOString(),
          source: 'manual' as const,
          reported: true,
          measure: (r.raw && (r.raw as any).measure) || undefined,
        }));
        return { items: mapped as MCEntry[], total, page: p, pageSize: ps };
      } catch {}
    }
    // fallback：DB 不可用时返回空集
    return { items: [], total: 0, page: p, pageSize: ps };
  }

  async create(body: {
    schoolId?: number | string;
    staff: string;
    temp: number;
    source?: 'manual' | 'device';
  }): Promise<MCEntry> {
    if (!body?.staff || String(body.staff).trim() === '')
      throw new BadRequestException('staff is required');
    if (body.temp === undefined || body.temp === null || Number.isNaN(Number(body.temp)))
      throw new BadRequestException('temp is required');
    const t = Number(body.temp);
    if (t < 30 || t > 45) throw new BadRequestException('temp out of range');
    const sidInput = body.schoolId;
    const sidNum = sidInput !== undefined && sidInput !== null && String(sidInput).trim() !== '' ? Number(sidInput) : NaN;
    const sid = Number.isFinite(sidNum) && Number.isInteger(sidNum) ? sidNum : 1;
    // 先写库，获取自增 id
    const atIso = this.nowIso();
    const insertId = await this.repo!.insert({
      schoolId: sid,
      equipmentCode: body.source === 'device' ? 'DEVICE' : 'MANUAL',
      userId: body.staff,
      checkTime: new Date(atIso),
      foreheadTemp: t,
      normalTemperatureMin: 35.5,
      normalTemperatureMax: 37.2,
      abnormalTemp: this.judge(t) === '异常' ? 1 : 0,
      handCheckResult: [],
      healthAskResult: [],
      health: this.judge(t) === '异常' ? 0 : 1,
      images: {},
      raw: { measure: undefined, schoolId: sid },
    } as any);
    const entry: MCEntry = {
      id: insertId,
      schoolId: sid,
      staff: body.staff,
      temp: t,
      result: this.judge(t),
      at: atIso,
      source: body.source || 'manual',
      reported: true,
    };
    this.emit('created', entry);
    return entry;
  }

  async deviceCallback(body: { schoolId?: number | undefined; staff: string; temp: number }) {
    return this.create({ ...body, source: 'device' });
  }

  async setMeasure(id: number, measure: string) {
    await this.repo!.setMeasure(id, measure);
    this.emit('updated', { id, measure });
    return { ok: true } as any;
  }

  async remove(id: number) {
    await this.repo!.remove(id);
    this.emit('deleted', { id });
    return { ok: true } as any;
  }

  stream(): Observable<MessageEvent> {
    // Emit hello for new subscribers
    setTimeout(() => this.events$.next({ type: 'hello', data: { ok: true } }), 0);
    return this.events$.asObservable();
  }

  // no in-memory seed; data is persisted in DB
}
