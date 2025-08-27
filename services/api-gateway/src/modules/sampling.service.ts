import { Injectable, MessageEvent, BadRequestException } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export type SampleStatus = 'ACTIVE' | 'EXPIRED' | 'CLEARED';
export type SampleSource = 'manual' | 'device';
export type CleanupSource = 'manual' | 'cabinet';

export type SampleRecord = {
  id: string;
  schoolId: string;
  sample: string;
  weight: number; // g
  imageUrl?: string;
  duration: number; // hours
  by: string; // 留样人
  cabinet?: string; // 柜位/编号
  at: string; // ISO time
  status: SampleStatus;
  source: SampleSource;
  exception?: boolean;
  exceptionReason?: string;
  measure?: string; // 异常处理措施
};

export type CleanupRecord = {
  id: string;
  schoolId: string;
  sampleId?: string;
  sample: string;
  weight: number;
  imageUrl?: string;
  method: string; // 销毁/回收/其他
  by: string;
  at: string; // ISO
  source: CleanupSource;
};

@Injectable()
export class SamplingService {
  private seq = 1;
  private cseq = 1;
  private samples: SampleRecord[] = [];
  private cleanups: CleanupRecord[] = [];
  private events$ = new Subject<MessageEvent>();

  constructor() {
    this.seed();
  }

  private id(prefix: string, n: number) {
    return `${prefix}-${String(n).padStart(4, '0')}`;
  }
  private nowIso() {
    return new Date().toISOString();
  }
  private emit(event: string, data: any) {
    this.events$.next({ type: event, data });
  }

  listSamples(params: {
    schoolId?: string;
    sample?: string;
    status?: SampleStatus;
    exception?: 'true' | 'false';
    start?: string;
    end?: string;
    page?: number | string;
    pageSize?: number | string;
  }) {
    const sid = params.schoolId || 'sch-001';
    let arr = this.samples.filter((r) => r.schoolId === sid);
    if (params.sample) arr = arr.filter((r) => r.sample.includes(params.sample!));
    if (params.status) arr = arr.filter((r) => r.status === params.status);
    if (params.exception === 'true') arr = arr.filter((r) => r.exception === true);
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

  createSample(body: {
    schoolId?: string;
    sample: string;
    weight: number;
    imageUrl?: string;
    duration: number;
    by: string;
    cabinet?: string;
    source?: SampleSource;
  }) {
    if (!body?.sample || String(body.sample).trim() === '')
      throw new BadRequestException('sample is required');
    if (body.weight === undefined || Number(body.weight) <= 0)
      throw new BadRequestException('weight must be > 0');
    if (body.duration === undefined || Number(body.duration) <= 0)
      throw new BadRequestException('duration must be > 0');
    if (!body?.by || String(body.by).trim() === '') throw new BadRequestException('by is required');
    const rec: SampleRecord = {
      id: this.id('SP', this.seq++),
      schoolId: body.schoolId || 'sch-001',
      sample: body.sample,
      weight: Number(body.weight),
      imageUrl: body.imageUrl,
      duration: Number(body.duration),
      by: body.by,
      cabinet: body.cabinet,
      at: this.nowIso(),
      status: 'ACTIVE',
      source: body.source || 'manual',
      exception: Number(body.weight) < 50, // demo: 低于50g视为异常
      exceptionReason: Number(body.weight) < 50 ? '重量不足' : undefined,
    };
    this.samples.unshift(rec);
    this.emit('sample-created', rec);
    return rec;
  }

  deviceCompleted(body: {
    schoolId?: string;
    sample: string;
    weight: number;
    imageUrl?: string;
    duration: number;
    by: string;
    cabinet?: string;
  }) {
    return this.createSample({ ...body, source: 'device' });
  }

  setSampleMeasure(id: string, measure: string) {
    const idx = this.samples.findIndex((r) => r.id === id);
    if (idx === -1) return { ok: false };
    this.samples[idx].measure = measure;
    this.emit('sample-updated', this.samples[idx]);
    return { ok: true, record: this.samples[idx] };
  }

  listCleanups(params: { schoolId?: string; page?: number | string; pageSize?: number | string }) {
    const sid = params.schoolId || 'sch-001';
    const arr = this.cleanups
      .filter((c) => c.schoolId === sid)
      .sort((a, b) => (a.at < b.at ? 1 : -1));
    let p = Math.max(1, parseInt(String(params.page ?? 1), 10) || 1);
    const ps = Math.max(1, parseInt(String(params.pageSize ?? 20), 10) || 20);
    const total = arr.length;
    const maxPage = Math.max(1, Math.ceil(total / ps) || 1);
    if (p > maxPage) p = maxPage;
    const items = arr.slice((p - 1) * ps, p * ps);
    return { items, total, page: p, pageSize: ps };
  }

  createCleanup(body: {
    schoolId?: string;
    sampleId?: string;
    sample: string;
    weight: number;
    imageUrl?: string;
    method: string;
    by: string;
    source?: CleanupSource;
  }) {
    if (!body?.sample || String(body.sample).trim() === '')
      throw new BadRequestException('sample is required');
    if (!body?.method || String(body.method).trim() === '')
      throw new BadRequestException('method is required');
    if (!body?.by || String(body.by).trim() === '') throw new BadRequestException('by is required');
    const rec: CleanupRecord = {
      id: this.id('CL', this.cseq++),
      schoolId: body.schoolId || 'sch-001',
      sampleId: body.sampleId,
      sample: body.sample,
      weight: Number(body.weight),
      imageUrl: body.imageUrl,
      method: body.method,
      by: body.by,
      at: this.nowIso(),
      source: body.source || 'manual',
    };
    this.cleanups.unshift(rec);
    if (body.sampleId) {
      const idx = this.samples.findIndex((r) => r.id === body.sampleId);
      if (idx !== -1) this.samples[idx].status = 'CLEARED';
    }
    this.emit('cleanup-created', rec);
    return rec;
  }

  cabinetCleanupCallback(body: {
    schoolId?: string;
    sampleId?: string;
    sample: string;
    weight: number;
    imageUrl?: string;
    by: string;
  }) {
    return this.createCleanup({ ...body, method: '自动清理', source: 'cabinet' });
  }

  stream(): Observable<MessageEvent> {
    setTimeout(() => this.events$.next({ type: 'hello', data: { ok: true } }), 0);
    return this.events$.asObservable();
  }

  private seed() {
    // Samples
    this.createSample({
      schoolId: 'sch-001',
      sample: '青椒肉丝',
      weight: 120,
      imageUrl: null as any,
      duration: 48,
      by: '张三',
      cabinet: 'A-01',
    });
    this.createSample({
      schoolId: 'sch-001',
      sample: '红烧肉',
      weight: 42,
      imageUrl: null as any,
      duration: 48,
      by: '李四',
      cabinet: 'A-02',
    }); // 异常：重量不足
    this.createSample({
      schoolId: 'sch-001',
      sample: '土豆丝',
      weight: 95,
      imageUrl: null as any,
      duration: 24,
      by: '王五',
      cabinet: 'B-03',
    });
    // Cleanup for one sample
    this.createCleanup({
      schoolId: 'sch-001',
      sampleId: 'SP-0001',
      sample: '青椒肉丝',
      weight: 120,
      by: '后勤',
      method: '销毁',
      imageUrl: null as any,
    });
    // Another school to test filter
    this.createSample({
      schoolId: 'sch-002',
      sample: '番茄炒蛋',
      weight: 130,
      imageUrl: null as any,
      duration: 48,
      by: '赵六',
      cabinet: 'C-01',
    });
  }
}
