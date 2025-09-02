import { Injectable, MessageEvent, BadRequestException } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { HygieneRepository } from './repositories/hygiene.repository';

export type InspectResult = '合格' | '不合格';

export type HygieneInspection = {
  id: string;
  schoolId: string;
  date: string; // ISO date/time
  result: InspectResult;
  by: string; // 检查人
  remark?: string;
};

export type AssetMaintenance = {
  id: string;
  schoolId: string;
  asset: string;
  date: string; // ISO date/time
  action: string; // 维护内容
  by: string; // 负责人
};

@Injectable()
export class HygieneService {
  private seqI = 1;
  private seqA = 1;
  private events$ = new Subject<MessageEvent>();

  constructor(private readonly repo: HygieneRepository) {}

  private id(prefix: 'HY' | 'AM', n: number) {
    return `${prefix}-${String(n).padStart(4, '0')}`;
  }
  private nowIso() {
    return new Date().toISOString();
  }
  private emit(type: string, data: any) {
    this.events$.next({ type, data });
  }

  async listInspections(params: {
    schoolId?: string;
    result?: InspectResult;
    start?: string;
    end?: string;
    page?: number | string;
    pageSize?: number | string;
  }) {
    const p = Math.max(1, parseInt(String(params.page ?? 1), 10) || 1);
    const ps = Math.max(1, parseInt(String(params.pageSize ?? 20), 10) || 20);
    return this.repo.listInspections({
      schoolId: params.schoolId || 'sch-001',
      result: params.result,
      start: params.start,
      end: params.end,
      page: p,
      pageSize: ps,
    });
  }

  async createInspection(body: {
    schoolId?: string;
    date?: string;
    result: InspectResult;
    by: string;
    remark?: string;
  }) {
    if (!body?.result) throw new BadRequestException('result is required');
    if (!body?.by || String(body.by).trim() === '') throw new BadRequestException('by is required');
    const rec: HygieneInspection = {
      id: this.id('HY', this.seqI++),
      schoolId: body.schoolId || 'sch-001',
      date: body.date || this.nowIso(),
      result: body.result,
      by: body.by,
      remark: body.remark,
    };
    await this.repo.insertInspection(rec);
    this.emit('hygiene-created', rec);
    return rec;
  }

  async listAssets(params: {
    schoolId?: string;
    asset?: string;
    start?: string;
    end?: string;
    page?: number | string;
    pageSize?: number | string;
  }) {
    const p = Math.max(1, parseInt(String(params.page ?? 1), 10) || 1);
    const ps = Math.max(1, parseInt(String(params.pageSize ?? 20), 10) || 20);
    return this.repo.listAssets({
      schoolId: params.schoolId || 'sch-001',
      asset: params.asset,
      start: params.start,
      end: params.end,
      page: p,
      pageSize: ps,
    });
  }

  async createAsset(body: {
    schoolId?: string;
    asset: string;
    date?: string;
    action: string;
    by: string;
  }) {
    if (!body?.asset || String(body.asset).trim() === '')
      throw new BadRequestException('asset is required');
    if (!body?.action || String(body.action).trim() === '')
      throw new BadRequestException('action is required');
    if (!body?.by || String(body.by).trim() === '') throw new BadRequestException('by is required');
    const rec: AssetMaintenance = {
      id: this.id('AM', this.seqA++),
      schoolId: body.schoolId || 'sch-001',
      asset: body.asset,
      date: body.date || this.nowIso(),
      action: body.action,
      by: body.by,
    };
    await this.repo.insertAsset(rec);
    this.emit('asset-created', rec);
    return rec;
  }

  stream(): Observable<MessageEvent> {
    setTimeout(() => this.events$.next({ type: 'hello', data: { ok: true } }), 0);
    return this.events$.asObservable();
  }

  private seed() {}
}
