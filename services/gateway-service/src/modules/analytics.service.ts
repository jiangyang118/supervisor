import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { InventoryService } from '../inventory/inventory.service';
import { HygieneRepository } from './repositories/hygiene.repository';
import { MorningChecksRepository } from './repositories/morning-checks.repository';
import { StaffCertsRepository } from './repositories/staff-certs.repository';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly inv?: InventoryService,
    private readonly hygiene?: HygieneRepository,
    private readonly morning?: MorningChecksRepository,
    private readonly staffCerts?: StaffCertsRepository,
  ) {}
  private events$ = new Subject<MessageEvent>();
  private rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  private nowISO() {
    return new Date().toISOString();
  }

  stream(): Observable<MessageEvent> {
    // push a hello event
    setTimeout(() => this.events$.next({ type: 'hello', data: { ok: true } }), 0);
    return this.events$.asObservable();
  }

  async dashboard(params?: { schoolId?: string }) {
    const sidInput = params?.schoolId;
    const sidNum = sidInput !== undefined && sidInput !== null && String(sidInput).trim() !== '' ? Number(sidInput) : NaN;
    const sid = Number.isFinite(sidNum) && Number.isInteger(sidNum) ? sidNum : 1;
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // Inventory
    const [inRows, outRows] = await Promise.all([
      this.inv?.listInbound(sid) || Promise.resolve([] as any[]),
      this.inv?.listOutbound(sid) || Promise.resolve([] as any[]),
    ]);
    const isToday = (d: any) => {
      try { const s = String(d || '').slice(0, 10); return s === todayStr; } catch { return false; }
    };
    const inToday = (inRows as any[]).filter(r => isToday(r.at));
    const outToday = (outRows as any[]).filter(r => isToday(r.at));
    const inboundCount = inToday.length;
    const inboundWeightKg = Math.round(inToday.reduce((s, r) => s + (Number(r.qty) || 0), 0));
    const inboundItems = inToday.slice(0, 20).map(r => ({ name: r.productId, qty: Number(r.qty) || 0 }));
    const inboundModeMap = new Map<string, number>();
    inToday.forEach(r => inboundModeMap.set(r.source || '手工', (inboundModeMap.get(r.source || '手工') || 0) + 1));
    const inboundMode = Array.from(inboundModeMap.entries()).map(([mode, value]) => ({ mode, value }));

    const outboundItems = outToday.slice(0, 20).map(r => ({ name: r.productId, qty: Number(r.qty) || 0 }));
    const outPurposeMap = new Map<string, number>();
    outToday.forEach(r => outPurposeMap.set(r.purpose || '日常', (outPurposeMap.get(r.purpose || '日常') || 0) + 1));
    const outboundPurpose = Array.from(outPurposeMap.entries()).map(([purpose, value]) => ({ purpose, value }));

    // Morning checks and hygiene
    const [mc, hy] = await Promise.all([
      this.morning?.search({ schoolId: sid, page: 1, pageSize: 1, start: todayStr, end: todayStr }) || Promise.resolve({ total: 0, items: [], page: 1, pageSize: 1 } as any),
      this.hygiene?.listInspections({ schoolId: sid, page: 1, pageSize: 1, start: todayStr, end: todayStr }) || Promise.resolve({ total: 0, items: [], page: 1, pageSize: 1 } as any),
    ]);
    const morningChecks = Number((mc as any).total || 0);
    const hygieneReports = Number((hy as any).total || 0);

    // Staff certs
    let canteenStaff = { total: 0, healthCertValid: 0, invalid: 0 };
    try {
      if (this.staffCerts && sid) {
        const pageRes = await this.staffCerts.list({ schoolId: Number(sid), page: 1, pageSize: 1000 });
        const items = pageRes.items || [];
        const todayDate = new Date(todayStr + 'T00:00:00Z');
        const valid = items.filter((c: any) => c.endAt ? new Date(c.endAt) >= todayDate : true).length;
        canteenStaff = { total: items.length, healthCertValid: valid, invalid: Math.max(0, items.length - valid) };
      }
    } catch {}

    // Warnings synthesized from DB-backed sources (hygiene NG + morning abnormal)
    const warnItems: Array<{ id: string; type: string; title: string; at: string; level: string }> = [];
    try {
      const hy2 = await this.hygiene?.listInspections({ schoolId: sid, page: 1, pageSize: 20, start: undefined as any, end: undefined as any });
      const hyBad = (hy2?.items || []).filter((x: any) => x.result === '不合格').slice(0, 10);
      for (const r of hyBad) warnItems.push({ id: `H-${r.id}`, type: '卫生', title: r.remark || '卫生不合格', at: r.date, level: '中' });
    } catch {}
    try {
      const mc2 = await this.morning?.search({ schoolId: sid, page: 1, pageSize: 20, abnormal: true } as any);
      const bad = (mc2?.items || []).slice(0, 10);
      for (const r of bad) warnItems.push({ id: `M-${r.id}`, type: '晨检', title: '晨检体温异常', at: r.checkTime, level: '中' });
    } catch {}

    // satisfaction is not DB-backed; omit or derive placeholder 0
    const satisfaction = 0;
    const dishesToday: Array<{ name: string }> = [];

    return {
      cards: { aiAlerts: 0, morningChecks, inboundCount, inboundWeightKg, satisfaction, hygieneReports },
      canteenStaff,
      inbound: { items: inboundItems, mode: inboundMode },
      outbound: { items: outboundItems, purpose: outboundPurpose },
      dishesToday,
      warnings: warnItems.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 20),
    };
  }

  async foodIndex(params?: { schoolId?: string }) {
    const sidInput = params?.schoolId;
    const sidNum = sidInput !== undefined && sidInput !== null && String(sidInput).trim() !== '' ? Number(sidInput) : NaN;
    const sid = Number.isFinite(sidNum) && Number.isInteger(sidNum) ? sidNum : 1;
    const todayStr = new Date().toISOString().slice(0, 10);
    const [mc, hy] = await Promise.all([
      this.morning?.search({ schoolId: sid, page: 1, pageSize: 1, start: todayStr, end: todayStr }) || Promise.resolve({ total: 0 } as any),
      this.hygiene?.listInspections({ schoolId: sid, page: 1, pageSize: 100 }) || Promise.resolve({ items: [], total: 0 } as any),
    ]);
    const totalHy = Number((hy as any).total || 0);
    const itemsHy = (hy as any).items || [];
    const pass = itemsHy.filter((x: any) => x.result === '合格').length;
    const passRate = totalHy ? Math.round((pass / totalHy) * 100) : 100;
    const mcToday = Number((mc as any).total || 0);
    const hygieneScore = passRate;
    const morningScore = Math.min(100, mcToday * 5 + 50); // simplistic scaling
    const score = Math.round(hygieneScore * 0.6 + morningScore * 0.4);
    const submetrics = [
      { metric: '综合得分', value: score },
      { metric: '操作卫生', value: hygieneScore },
      { metric: '晨检覆盖', value: morningScore },
    ];
    return { score, submetrics };
  }

  async alertsOverview(params?: { schoolId?: string }) {
    const sidInput = params?.schoolId;
    const sidNum = sidInput !== undefined && sidInput !== null && String(sidInput).trim() !== '' ? Number(sidInput) : NaN;
    const sid = Number.isFinite(sidNum) && Number.isInteger(sidNum) ? sidNum : 1;
    const items: Array<{ id: string; type: string; level: string; status: string; at: string }> = [];
    try {
      const hy = await this.hygiene?.listInspections({ schoolId: sid, page: 1, pageSize: 50 });
      for (const r of hy?.items || []) {
        if (r.result === '不合格') items.push({ id: `H-${r.id}`, type: '卫生', level: '中', status: '未处理', at: r.date });
      }
    } catch {}
    try {
      const mc = await this.morning?.search({ schoolId: sid, page: 1, pageSize: 50, abnormal: true } as any);
      for (const r of mc?.items || []) items.push({ id: `M-${r.id}`, type: '晨检', level: '中', status: '未处理', at: r.checkTime });
    } catch {}
    items.sort((a, b) => (a.at < b.at ? 1 : -1));
    const summaryMap = new Map<string, number>();
    items.forEach(x => summaryMap.set(x.type, (summaryMap.get(x.type) || 0) + 1));
    const summary = Array.from(summaryMap.entries()).map(([name, count]) => ({ name, count }));
    return { items: items.slice(0, 50), summary };
  }
}
