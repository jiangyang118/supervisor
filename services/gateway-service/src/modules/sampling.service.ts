import { Injectable, MessageEvent, BadRequestException } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { SamplingRepository } from './repositories/sampling.repository';

export type SampleStatus = 'ACTIVE' | 'EXPIRED' | 'CLEARED';
export type SampleSource = 'manual' | 'device';
export type CleanupSource = 'manual' | 'cabinet';

export type SampleRecord = {
  id: number;
  schoolId: number;
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
  id: number;
  schoolId: number;
  sampleId?: number;
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
  private events$ = new Subject<MessageEvent>();

  constructor(private readonly repo: SamplingRepository) {}

  private devLog(event: string, payload: any) {
    if (process.env.NODE_ENV === 'production') return;
    try {
      // eslint-disable-next-line no-console
      console.log(`[DEV][sampling] ${event}:`, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }

  // ids are DB auto-increment
  private nowIso() {
    return new Date().toISOString();
  }
  private emit(event: string, data: any) {
    this.events$.next({ type: event, data });
  }

  async listSamples(params: {
    schoolId?: number | string;
    sample?: string;
    status?: SampleStatus;
    exception?: 'true' | 'false';
    start?: string;
    end?: string;
    page?: number | string;
    pageSize?: number | string;
  }) {
    const sidInput = params.schoolId;
    const sidNum = sidInput !== undefined && sidInput !== null && String(sidInput).trim() !== '' ? Number(sidInput) : NaN;
    const sid = Number.isFinite(sidNum) && Number.isInteger(sidNum) ? sidNum : 1;
    const p = Math.max(1, parseInt(String(params.page ?? 1), 10) || 1);
    const ps = Math.max(1, parseInt(String(params.pageSize ?? 20), 10) || 20);
    const res = await this.repo.searchSamples({
      schoolId: sid,
      sample: params.sample,
      status: params.status,
      exception: params.exception === 'true' ? true : params.exception === 'false' ? false : undefined,
      start: params.start,
      end: params.end,
      page: p,
      pageSize: ps,
    });
    return res;
  }

  async createSample(body: {
    schoolId?: number | string;
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
    const schoolId = (() => {
      const s = body.schoolId;
      const n = s !== undefined && s !== null && String(s).trim() !== '' ? Number(s) : NaN;
      return Number.isFinite(n) && Number.isInteger(n) ? n : 1;
    })();
    const at = this.nowIso();
    const exception = Number(body.weight) < 50;
    const insertId = await this.repo.insertSample({
      schoolId,
      sample: body.sample,
      weight: Number(body.weight),
      imageUrl: body.imageUrl,
      duration: Number(body.duration),
      by: body.by,
      cabinet: body.cabinet,
      at,
      status: 'ACTIVE',
      source: body.source || 'manual',
      exception,
      exceptionReason: exception ? '重量不足' : undefined,
      measure: undefined,
    } as any);
    const rec: SampleRecord = {
      id: insertId,
      schoolId,
      sample: body.sample,
      weight: Number(body.weight),
      imageUrl: body.imageUrl,
      duration: Number(body.duration),
      by: body.by,
      cabinet: body.cabinet,
      at,
      status: 'ACTIVE',
      source: body.source || 'manual',
      exception,
      exceptionReason: exception ? '重量不足' : undefined,
      measure: undefined,
    } as any;
    this.devLog('insertSample.ok', { id: rec.id, schoolId: rec.schoolId, sample: rec.sample });
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

  async setSampleMeasure(id: number, measure: string) {
    await this.repo.updateSampleMeasure(id, measure);
    this.devLog('updateSampleMeasure.ok', { id, measure });
    this.emit('sample-updated', { id, measure });
    return { ok: true } as any;
  }

  async listCleanups(params: { schoolId?: number | string; page?: number | string; pageSize?: number | string }) {
    const sidInput = params.schoolId;
    const sidNum = sidInput !== undefined && sidInput !== null && String(sidInput).trim() !== '' ? Number(sidInput) : NaN;
    const sid = Number.isFinite(sidNum) && Number.isInteger(sidNum) ? sidNum : 1;
    const p = Math.max(1, parseInt(String(params.page ?? 1), 10) || 1);
    const ps = Math.max(1, parseInt(String(params.pageSize ?? 20), 10) || 20);
    return this.repo.listCleanups({ schoolId: sid, page: p, pageSize: ps });
  }

  async createCleanup(body: {
    schoolId?: number | string;
    sampleId?: number | string;
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
    const schoolId = (() => { const s = body.schoolId; const n = s!==undefined&&s!==null&&String(s).trim()!==''?Number(s):NaN; return Number.isFinite(n)&&Number.isInteger(n)?n:1; })();
    const sampleId = (() => { const s = body.sampleId; const n = s!==undefined&&s!==null&&String(s).trim()!==''?Number(s):NaN; return Number.isFinite(n)&&Number.isInteger(n)?n:undefined; })();
    const at = this.nowIso();
    let insertId: number;
    try {
      insertId = await this.repo.insertCleanup({
        schoolId,
        sampleId: sampleId ?? null,
        sample: body.sample,
        weight: Number(body.weight),
        imageUrl: body.imageUrl,
        method: body.method,
        by: body.by,
        at,
        source: body.source || 'manual',
      } as any);
    } catch (err: any) {
      // Map common DB errors to 400 to avoid 500s for client mistakes
      const code = err?.code || err?.errno;
      if (code === 'ER_NO_REFERENCED_ROW_2' || code === 1452) {
        throw new BadRequestException('Invalid schoolId or sampleId (foreign key not found)');
      }
      if (code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' || code === 1366) {
        throw new BadRequestException('Invalid field type or value');
      }
      throw err;
    }
    const rec: CleanupRecord = { id: insertId, schoolId, sampleId: sampleId as any, sample: body.sample, weight: Number(body.weight), imageUrl: body.imageUrl, method: body.method, by: body.by, at, source: body.source || 'manual' } as any;
    this.devLog('insertCleanup.ok', { id: rec.id, schoolId: rec.schoolId, sampleId: rec.sampleId });
    if (sampleId) {
      await this.repo.markSampleCleared(sampleId);
      this.devLog('markSampleCleared.ok', { sampleId: body.sampleId });
    }
    this.emit('cleanup-created', rec);
    return rec;
  }

  async cabinetCleanupCallback(body: {
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

  private seed() {}
}
