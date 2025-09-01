import { Injectable, MessageEvent, BadRequestException } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

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
  private inspections: HygieneInspection[] = [];
  private assets: AssetMaintenance[] = [];
  private events$ = new Subject<MessageEvent>();

  constructor() {
    this.seed();
  }

  private id(prefix: 'HY' | 'AM', n: number) {
    return `${prefix}-${String(n).padStart(4, '0')}`;
  }
  private nowIso() {
    return new Date().toISOString();
  }
  private emit(type: string, data: any) {
    this.events$.next({ type, data });
  }

  listInspections(params: {
    schoolId?: string;
    result?: InspectResult;
    start?: string;
    end?: string;
    page?: number | string;
    pageSize?: number | string;
  }) {
    const sid = params.schoolId || 'sch-001';
    let arr = this.inspections.filter((r) => r.schoolId === sid);
    if (params.result) arr = arr.filter((r) => r.result === params.result);
    if (params.start) arr = arr.filter((r) => r.date >= params.start!);
    if (params.end) arr = arr.filter((r) => r.date <= params.end!);
    arr = arr.sort((a, b) => (a.date < b.date ? 1 : -1));
    let p = Math.max(1, parseInt(String(params.page ?? 1), 10) || 1);
    const ps = Math.max(1, parseInt(String(params.pageSize ?? 20), 10) || 20);
    const total = arr.length;
    const maxPage = Math.max(1, Math.ceil(total / ps) || 1);
    if (p > maxPage) p = maxPage;
    const items = arr.slice((p - 1) * ps, p * ps);
    return { items, total, page: p, pageSize: ps };
  }

  createInspection(body: {
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
    this.inspections.unshift(rec);
    this.emit('hygiene-created', rec);
    return rec;
  }

  listAssets(params: {
    schoolId?: string;
    asset?: string;
    start?: string;
    end?: string;
    page?: number | string;
    pageSize?: number | string;
  }) {
    const sid = params.schoolId || 'sch-001';
    let arr = this.assets.filter((r) => r.schoolId === sid);
    if (params.asset) arr = arr.filter((r) => r.asset.includes(params.asset!));
    if (params.start) arr = arr.filter((r) => r.date >= params.start!);
    if (params.end) arr = arr.filter((r) => r.date <= params.end!);
    arr = arr.sort((a, b) => (a.date < b.date ? 1 : -1));
    let p = Math.max(1, parseInt(String(params.page ?? 1), 10) || 1);
    const ps = Math.max(1, parseInt(String(params.pageSize ?? 20), 10) || 20);
    const total = arr.length;
    const maxPage = Math.max(1, Math.ceil(total / ps) || 1);
    if (p > maxPage) p = maxPage;
    const items = arr.slice((p - 1) * ps, p * ps);
    return { items, total, page: p, pageSize: ps };
  }

  createAsset(body: {
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
    this.assets.unshift(rec);
    this.emit('asset-created', rec);
    return rec;
  }

  stream(): Observable<MessageEvent> {
    setTimeout(() => this.events$.next({ type: 'hello', data: { ok: true } }), 0);
    return this.events$.asObservable();
  }

  private seed() {
    this.createInspection({ schoolId: 'sch-001', result: '合格', by: '张三' });
    this.createInspection({
      schoolId: 'sch-001',
      result: '不合格',
      by: '李四',
      remark: '厨房地面潮湿',
    });
    this.createInspection({ schoolId: 'sch-002', result: '合格', by: '王五' });
    this.createAsset({
      schoolId: 'sch-001',
      asset: '留样柜 A-1',
      action: '定期保养',
      by: '设备管理员',
    });
    this.createAsset({ schoolId: 'sch-001', asset: '消毒柜 D-2', action: '更换灯管', by: '后勤' });
    this.createAsset({ schoolId: 'sch-002', asset: '蒸箱', action: '阀门检修', by: '设备管理员' });
  }
}
