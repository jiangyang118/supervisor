import { Injectable, MessageEvent, BadRequestException } from '@nestjs/common';
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
  private entries: MCEntry[] = [];
  private events$ = new Subject<MessageEvent>();

  constructor() {
    this.seed();
  }

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

  list(params: {
    schoolId?: string;
    staff?: string;
    result?: MCResult;
    start?: string;
    end?: string;
    page?: number | string;
    pageSize?: number | string;
  }) {
    const sid = params.schoolId || 'sch-001';
    let arr = this.entries.filter((e) => e.schoolId === sid);
    if (params.staff) arr = arr.filter((e) => e.staff.includes(params.staff!));
    if (params.result) arr = arr.filter((e) => e.result === params.result);
    if (params.start) arr = arr.filter((e) => e.at >= params.start!);
    if (params.end) arr = arr.filter((e) => e.at <= params.end!);
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
    staff: string;
    temp: number;
    source?: 'manual' | 'device';
  }): MCEntry {
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
    this.entries.unshift(entry);
    this.emit('created', entry);
    return entry;
  }

  deviceCallback(body: { schoolId?: string; staff: string; temp: number }) {
    return this.create({ ...body, source: 'device' });
  }

  setMeasure(id: string, measure: string) {
    const idx = this.entries.findIndex((e) => e.id === id);
    if (idx === -1) return { ok: false };
    this.entries[idx].measure = measure;
    this.emit('updated', this.entries[idx]);
    return { ok: true, entry: this.entries[idx] };
  }

  remove(id: string) {
    const idx = this.entries.findIndex((e) => e.id === id);
    if (idx === -1) return { ok: false };
    const [removed] = this.entries.splice(idx, 1);
    this.emit('deleted', removed);
    return { ok: true };
  }

  stream(): Observable<MessageEvent> {
    // Emit hello for new subscribers
    setTimeout(() => this.events$.next({ type: 'hello', data: { ok: true } }), 0);
    return this.events$.asObservable();
  }

  // Seed a few demo entries so UI has data; leave other schools empty to cover "no data" scenarios
  private seed() {
    const add = (
      schoolId: string,
      staff: string,
      temp: number,
      source: 'manual' | 'device',
      measure?: string,
    ) => {
      const entry: MCEntry = {
        id: this.makeId(),
        schoolId,
        staff,
        temp,
        result: this.judge(temp),
        at: this.nowIso(),
        source,
        reported: true,
        measure,
      };
      this.entries.unshift(entry);
    };
    // sch-001: include normal and abnormal
    add('sch-001', '张三', 36.6, 'manual');
    add('sch-001', '李四', 37.8, 'device', '已通知就医并居家观察');
    add('sch-001', '王五', 36.9, 'manual');
    // sch-002: small set
    add('sch-002', '赵六', 36.5, 'device');
  }
}
