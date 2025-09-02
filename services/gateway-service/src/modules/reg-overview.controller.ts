import { Controller, Get, Post, Patch, Body, Query } from '@nestjs/common';
import { MorningCheckService } from './morning-check.service';
import { SamplingService } from './sampling.service';
import { DisinfectionService } from './disinfection.service';
import { DineService } from './dine.service';
import { WasteService } from './waste.service';
import { DevicesService } from './devices.service';
import { PublicFeedbackService } from './public-feedback.service';
import { DataStore } from './data.store';
import { SchoolsRepository } from './repositories/schools.repository';

@Controller('reg')
export class RegOverviewController {
  constructor(
    private readonly morning: MorningCheckService,
    private readonly sampling: SamplingService,
    private readonly disinfection: DisinfectionService,
    private readonly dine: DineService,
    private readonly waste: WasteService,
    private readonly devices: DevicesService,
    private readonly feedback: PublicFeedbackService,
    private readonly schoolsRepo: SchoolsRepository,
  ) {}
  @Get('overview')
  async overview() {
    const schoolsList = await this.localSchools();
    const schools = schoolsList.length;
    const canteens = schools; // 可替换为真实食堂数
    // 今日 00:00 开始
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const sliceAll = <T>(x: { items: T[] }) => (x?.items || []) as T[];
    const mc = sliceAll(await this.morning.list({ start: dayStart, page: 1, pageSize: 100000 }));
    const sp = sliceAll(await this.sampling.listSamples({ start: dayStart, page: 1, pageSize: 100000 }));
    const df = sliceAll(await this.disinfection.list({ start: dayStart, page: 1, pageSize: 100000 }));
    const dn = sliceAll(await this.dine.list({ start: dayStart, page: 1, pageSize: 100000 }));
    const ws = sliceAll(await this.waste.list({ start: dayStart, page: '1', pageSize: '100000' }));
    const todayReports = mc.length + sp.length + df.length + dn.length + ws.length;
    // AI 预警（OPEN）
    const aiOpen = (DataStore.aiEvents || []).filter((e) => e.status === 'OPEN').length;
    // 卫生合格率（以晨检为例）
    const ok = mc.filter((e: any) => e.result === '正常').length;
    const hygienePassRate = mc.length ? Math.round((ok / mc.length) * 100) : 100;
    // 设备在线率
    const devs = this.devices.list({});
    const online = devs.filter((d) => d.status === 'ONLINE').length;
    const devicesOnlineRate = devs.length ? Math.round((online / devs.length) * 100) : 100;
    // AI 类型分布
    const aiByTypeMap = new Map<string, number>();
    (DataStore.aiEvents || []).forEach((e) => {
      if (e.status !== 'OPEN') return;
      aiByTypeMap.set(e.type, (aiByTypeMap.get(e.type) || 0) + 1);
    });
    const aiByType = Array.from(aiByTypeMap.entries()).map(([type, count]) => ({ type, count }));
    // 近 7 天上报数量（按晨检）
    const dailyReports = await Promise.all(Array.from({ length: 7 }).map(async (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
      const s = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      const sNext = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();
      const cntRes = await this.morning.list({ start: s, end: sNext, page: 1, pageSize: 100000 });
      return { day: s.slice(5, 10), count: cntRes.total };
    }));
    // 投诉待处理 Top（学校）
    const pending = (await this.feedback.list({ status: '待处理', page: 1, pageSize: 100000 }))
      .items as any[];
    const bySchool = new Map<string, number>();
    pending.forEach((r) =>
      bySchool.set(r.schoolId || '-', (bySchool.get(r.schoolId || '-') || 0) + 1),
    );
    const schoolsArr = await this.schools();
    const topWarnings = Array.from(bySchool.entries())
      .map(([id, warnings]) => ({
        school: schoolsArr.find((s: any) => s.id === id)?.name || id,
        warnings,
      }))
      .sort((a, b) => b.warnings - a.warnings)
      .slice(0, 5)
      .map((x, i) => ({ rank: i + 1, ...x }));
    // 证件临期占位（后续接入证件服务到期扫描）
    const expiringCerts: any[] = [];
    return {
      kpis: {
        schools,
        canteens,
        todayReports,
        aiWarnings: aiOpen,
        hygienePassRate,
        devicesOnlineRate,
      },
      aiByType,
      dailyReports,
      topWarnings,
      expiringCerts,
    };
  }

  @Get('schools')
  async schools() {
    try {
      const rows = await this.schoolsRepo.listAll();
      return rows.map((r) => ({ id: r.id, name: r.name }));
    } catch {
      // Fallback to local list if DB not ready
      return [
        { id: 'sch-001', name: '示例一中' },
        { id: 'sch-002', name: '示例二小' },
        { id: 'sch-003', name: '示例三幼' },
        { id: 'sch-004', name: '示例四小' },
        { id: 'sch-005', name: '示例五中' },
      ];
    }
  }

  // System management: schools config
  @Get('schools/config')
  async schoolsConfig() {
    const rows = await this.schoolsRepo.listAll(true);
    return rows.map((r) => ({ id: r.id, name: r.name, enabled: !!r.enabled }));
  }
  @Post('schools/config')
  async createSchool(@Body() b: { id?: string; name: string; enabled?: boolean }) {
    if (!b?.name || String(b.name).trim() === '') {
      return { ok: false, message: 'name required' };
    }
    const id = b.id && String(b.id).trim() !== '' ? b.id : this.genId('sch');
    await this.schoolsRepo.insert(id, b.name.trim(), b.enabled ?? true);
    return { ok: true, id };
  }
  @Patch('schools/config')
  async updateSchool(@Query('id') id: string, @Body() b: { name?: string; enabled?: boolean }) {
    if (!id) return { ok: false, message: 'id required' } as any;
    await this.schoolsRepo.update(id, b);
    return { ok: true };
  }
  @Post('schools/config/delete')
  async deleteSchool(@Body() body: { id: string }) {
    if (!body?.id) return { ok: false, message: 'id required' } as any;
    await this.schoolsRepo.update(body.id, { enabled: false });
    return { ok: true };
  }

  @Get('schools/stats')
  async schoolStats() {
    const base = await this.localSchools();
    return base.map((s) => {
      const online = Math.floor(Math.random() * 4) + 2;
      const offline = Math.floor(Math.random() * 2);
      return { ...s, online, offline };
    });
  }

  @Get('schools/sch-001/cameras')
  cams1() { return this._cameras('示例一中'); }
  @Get('schools/sch-002/cameras')
  cams2() { return this._cameras('示例二小'); }
  @Get('schools/sch-003/cameras')
  cams3() { return this._cameras('示例三幼'); }
  @Get('schools/sch-004/cameras')
  cams4() { return this._cameras('示例四小'); }
  @Get('schools/sch-005/cameras')
  cams5() { return this._cameras('示例五中'); }

  private _cameras(school: string) {
    const base = process.env.WVP_BASE || 'http://localhost:18080';
    const online = () => Math.random() < 0.85;
    const make = (id: string, name: string) => ({
      id,
      school,
      name,
      online: online(),
      snapshotUrl: null,
      flvUrl: `${base}/live/${encodeURIComponent(school)}-${id}.flv`,
      hlsUrl: `${base}/live/${encodeURIComponent(school)}-${id}.m3u8`,
    });
    return [
      make('ch-01', '后厨-操作台'),
      make('ch-02', '后厨-清洗区'),
      make('ch-03', '配菜间'),
      make('ch-04', '备餐间'),
      make('ch-05', '库房'),
      make('ch-06', '公示栏'),
      make('ch-07', '洗消间'),
      make('ch-08', '粗加工间'),
    ];
  }

  private async localSchools() {
    // Prefer DB, fallback to defaults
    try {
      const rows = await this.schoolsRepo.listAll();
      if (rows && rows.length) return rows.map((r) => ({ id: r.id, name: r.name }));
    } catch {}
    return [
      { id: 'sch-001', name: '示例一中' },
      { id: 'sch-002', name: '示例二小' },
      { id: 'sch-003', name: '示例三幼' },
      { id: 'sch-004', name: '示例四小' },
      { id: 'sch-005', name: '示例五中' },
    ];
  }

  private genId(prefix: string) {
    const rand = Math.random().toString(36).slice(2, 8);
    return `${prefix}-${rand}`;
  }
}
