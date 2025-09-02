import { Injectable, MessageEvent, BadRequestException } from '@nestjs/common';
import { MorningChecksRepository } from './repositories/morning-checks.repository';
import { Observable, Subject } from 'rxjs';

export type MCResult = '正常' | '异常';
export type MCEntry = {
  id: string;
  schoolId: string;
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
    return `MC-${String(this.seq++).padStart(4, '0')}`;
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
    schoolId?: string;
    staff?: string;
    result?: MCResult;
    start?: string;
    end?: string;
    page?: number | string;
    pageSize?: number | string;
  }) {
    const sid = params.schoolId || 'sch-001';
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
          id: r.id,
          schoolId: r.schoolId || sid,
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
    schoolId?: string;
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
    const sid = body.schoolId || 'sch-001';
    const entry: MCEntry = {
      id: this.makeId(),
      schoolId: sid,
      staff: body.staff,
      temp: t,
      result: this.judge(t),
      at: this.nowIso(),
      source: body.source || 'manual',
      reported: true,
    };
    // 落库至 morning_checks（002 表结构）
    await this.repo!.insert({
      id: entry.id,
      schoolId: sid,
      equipmentCode: body.source === 'device' ? 'DEVICE' : 'MANUAL',
      userId: body.staff,
      checkTime: new Date(entry.at),
      foreheadTemp: entry.temp,
      normalTemperatureMin: 35.5,
      normalTemperatureMax: 37.2,
      abnormalTemp: entry.result === '异常' ? 1 : 0,
      handCheckResult: [],
      healthAskResult: [],
      health: entry.result === '异常' ? 0 : 1,
      images: {},
      raw: { measure: undefined, schoolId: sid },
    } as any);
    this.emit('created', entry);
    return entry;
  }

  async deviceCallback(body: { schoolId?: string; staff: string; temp: number }) {
    return this.create({ ...body, source: 'device' });
  }

  async setMeasure(id: string, measure: string) {
    await this.repo!.setMeasure(id, measure);
    this.emit('updated', { id, measure });
    return { ok: true } as any;
  }

  async remove(id: string) {
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
