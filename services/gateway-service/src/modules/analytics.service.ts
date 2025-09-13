import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { InventoryService } from '../inventory/inventory.service';
import { HygieneRepository } from './repositories/hygiene.repository';
import { MorningChecksRepository } from './repositories/morning-checks.repository';
import { CertificatesService } from './certificates.service';
import { PesticideService } from './pesticide.service';
import { MorningCheckService } from './morning-check.service';
import { DevicesService } from './devices.service';
import { DisinfectionService } from './disinfection.service';
import { DataStore } from './data.store';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly inv?: InventoryService,
    private readonly hygiene?: HygieneRepository,
    private readonly morning?: MorningChecksRepository,
    private readonly certsSvc?: CertificatesService,
    private readonly pesticide?: PesticideService,
    private readonly mcSvc?: MorningCheckService,
    private readonly devices?: DevicesService,
    private readonly disinfection?: DisinfectionService,
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

    // Staff certs (removed): keep zeros for dashboard compatibility
    const canteenStaff = { total: 0, healthCertValid: 0, invalid: 0 };

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

  // removed: foodIndex() — 食安指数不再在“预警概览”模块展示

  async alertsOverview(params?: { schoolId?: string; type?: string; status?: '未处理' | '已处理'; start?: string; end?: string; canteenId?: string }) {
    const sidInput = params?.schoolId;
    const sidNum = sidInput !== undefined && sidInput !== null && String(sidInput).trim() !== '' ? Number(sidInput) : NaN;
    const sid = Number.isFinite(sidNum) && Number.isInteger(sidNum) ? sidNum : 1;
    const items: Array<{ id: string; type: string; level: string; status: '未处理' | '已处理'; at: string; detail?: string; school?: string; canteenId?: number }> = [];
    const cidInput = params?.canteenId;
    const cidNum = cidInput !== undefined && cidInput !== null && String(cidInput).trim() !== '' ? Number(cidInput) : NaN;
    const cid = Number.isFinite(cidNum) && Number.isInteger(cidNum) ? cidNum : undefined;

    // 1) 证件过期（学校/供应商等）
    try {
      const certs = await this.certsSvc?.list({ schoolId: sid, status: '过期' });
      (certs || []).forEach((c: any) =>
        items.push({ id: `CERT-${c.id}`, type: '证件过期', level: '中', status: '未处理', at: c.expireAt, detail: `${c.owner}:${c.type}已过期` }),
      );
    } catch {}
    try {
      const sup = await this.inv?.listSuppliers({ schoolId: sid, expired: 'true', page: 1, pageSize: 100000 });
      (sup?.items || []).forEach((s: any) =>
        items.push({ id: `SUP-${s.id}`, type: '证件过期', level: '中', status: '未处理', at: s.licenseExpireAt || new Date().toISOString(), detail: `${s.name || '供应商'}营业执照已到期` }),
      );
    } catch {}

    // 2) 健康证到期（人员）— 基于 school_personnel 表
    try {
      const q = 'select id, name, health_cert_expire_at as exp from school_personnel where school_id = ? and health_cert_expire_at is not null and health_cert_expire_at < now()';
      const res: any = (this as any).devices?.db ? await (this as any).devices.db.query(q, [sid]) : { rows: [] };
      const rows = res?.rows || [];
      rows.forEach((r: any) => items.push({ id: `PER-${r.id}`, type: '健康证到期', level: '中', status: '未处理', at: r.exp, detail: `${r.name || '人员'}健康证已过期` }));
    } catch {}

    // 3) 日常行为AI预警
    try {
      const sidStr = String(sid).padStart(3, '0');
      const schoolId = `sch-${sidStr}`;
      const events = (DataStore?.aiEvents || []).filter((e) => e.schoolId === schoolId);
      events.forEach((e) =>
        items.push({
          id: e.id,
          type: '日常行为AI预警',
          level: '中',
          status: e.status === 'OPEN' ? '未处理' : '已处理',
          at: e.detectedAt,
          detail: e.type,
        }),
      );
    } catch {}

    // 4) 环境监测异常（温控） & 设备安全异常（离线）
    try {
      const devs = this.devices?.list({ schoolId: `sch-${String(sid).padStart(3, '0')}` }) || [];
      devs.forEach((d: any) => {
        if (d?.metrics && typeof d.metrics.temp === 'number' && d.metrics.temp > 8)
          items.push({ id: d.id, type: '环境监测异常', level: '高', status: '未处理', at: d.lastSeen, detail: '温度超标' });
        if (d?.status === 'OFFLINE')
          items.push({ id: d.id, type: '设备安全异常', level: '高', status: '未处理', at: d.lastSeen, detail: '设备离线' });
      });
    } catch {}

    // 5) 农残检测（不合格）
    try {
      const bad = await this.pesticide?.list({ schoolId: sid, canteenId: cid, result: '不合格', page: 1, pageSize: 100000 });
      (bad?.items || []).forEach((r: any) =>
        items.push({ id: `PE-${r.id}`, type: '农残检测', level: '高', status: r.measure ? '已处理' : '未处理', at: r.at, detail: `${r.sample}不合格`, canteenId: r.canteenId ?? undefined }),
      );
    } catch {}

    // 6) 晨检异常
    try {
      const mc = await this.mcSvc?.list({ schoolId: sid, result: '异常', page: 1, pageSize: 100000 } as any);
      (mc?.items || []).forEach((r: any) =>
        items.push({ id: `MC-${r.id}`, type: '晨检异常', level: '中', status: r.measure ? '已处理' : '未处理', at: r.at, detail: '晨检异常' }),
      );
    } catch {}

    // 7) 消毒管理（当日未提交记录）
    try {
      const today = new Date();
      const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const df = await this.disinfection?.list({ schoolId: `sch-${String(sid).padStart(3, '0')}`, canteenId: cid, start: dayStart, page: 1, pageSize: 1 });
      if ((df?.total || 0) === 0)
        items.push({ id: `DS-NONE-${dayStart.slice(0,10)}`, type: '消毒管理', level: '中', status: '未处理', at: new Date().toISOString(), detail: '当日未提交消毒记录', canteenId: cid });
    } catch {}

    // 8) 食材过期预警（占位：暂无数据来源）
    // 可在接入库存保质期后补充

    // Filter
    let filtered = items;
    const startRaw = params?.start;
    const endRaw = params?.end;
    // 精确到日：仅比较 YYYY-MM-DD
    const toDay = (s?: string) => {
      if (!s) return undefined as string | undefined;
      try { return new Date(s).toISOString().slice(0, 10); } catch { return undefined as any; }
    };
    const startDay = toDay(startRaw);
    const endDay = toDay(endRaw);
    if (startDay || endDay) {
      filtered = filtered.filter((x) => {
        const d = (x.at || '').slice(0, 10);
        const isCert = x.type === '证件过期' || x.type === '健康证到期';
        if (isCert) {
          // 证件类：按“截至结束日已过期”的口径统计，忽略开始日
          return (!endDay || d <= endDay);
        }
        // 其它类型：按区间过滤（含起止）
        return (!startDay || d >= startDay) && (!endDay || d <= endDay);
      });
    }
    if (params?.type) filtered = filtered.filter((x) => x.type === params!.type);
    if (params?.status) filtered = filtered.filter((x) => x.status === params!.status);

    filtered.sort((a, b) => (a.at < b.at ? 1 : -1));
    const summaryMap = new Map<string, number>();
    filtered.forEach((x) => summaryMap.set(x.type, (summaryMap.get(x.type) || 0) + 1));
    const summary = Array.from(summaryMap.entries()).map(([name, count]) => ({ name, count }));
    const normalized = filtered.slice(0, 200).map((x) => ({ ...x, at: String(x.at || '').slice(0, 10) }));
    return { items: normalized, summary };
  }

  async handleAlert(b: { id: string; type: string; measure?: string; status?: '未处理' | '已处理' }) {
    const type = b?.type;
    const id = b?.id;
    const measure = b?.measure || '已处理';
    if (!type || !id) throw new Error('id/type required');
    // 农残检测
    if (type === '农残检测') {
      const m = String(id).match(/(\d+)/);
      if (!m) throw new Error('invalid id');
      await this.pesticide?.setMeasure(Number(m[1]), measure);
      return { ok: true };
    }
    // 晨检异常
    if (type === '晨检异常') {
      const m = String(id).match(/(\d+)/);
      if (!m) throw new Error('invalid id');
      await this.mcSvc?.setMeasure(Number(m[1]), measure);
      return { ok: true };
    }
    // 日常行为AI预警
    if (type === '日常行为AI预警') {
      const ev = (DataStore.aiEvents || []).find((e) => e.id === id);
      if (!ev) throw new Error('event not found');
      ev.measure = measure;
      ev.status = 'CLOSED';
      return { ok: true };
    }
    // 消毒管理（占位：仅对已有记录可处理；当日未提交 不可处理）
    if (type === '消毒管理') {
      if (id.startsWith('DS-')) {
        await this.disinfection?.setMeasure(id, measure);
        return { ok: true };
      }
      return { ok: false, message: '当日未提交记录无法设置处理' } as any;
    }
    // 证件过期/健康证到期/设备/环境/食材过期：当前无处理动作落库
    return { ok: false, message: '该类型暂不支持处理落库' } as any;
  }
}
