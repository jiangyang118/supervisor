import { Controller, Get, Post, Patch, Body, Query, ParseIntPipe, Param, UseGuards } from '@nestjs/common';
import { MorningCheckService } from './morning-check.service';
import { SamplingService } from './sampling.service';
import { DisinfectionService } from './disinfection.service';
import { PesticideService } from './pesticide.service';
import { DineService } from './dine.service';
import { WasteService } from './waste.service';
import { DevicesService } from './devices.service';
import { SchoolsRepository } from './repositories/schools.repository';
import { JwtGuard } from './jwt.guard';
import { PermissionGuard } from './permission.guard';
import { Perm } from './perm.decorator';
import { Public } from './public.decorator';

@Controller('reg')
@UseGuards(JwtGuard, PermissionGuard)
export class RegOverviewController {
  constructor(
    private readonly morning: MorningCheckService,
    private readonly sampling: SamplingService,
    private readonly disinfection: DisinfectionService,
    private readonly pesticide: PesticideService,
    private readonly dine: DineService,
    private readonly waste: WasteService,
    private readonly devices: DevicesService,
    // feedback module removed
    private readonly schoolsRepo: SchoolsRepository,
  ) {}
  private numId(id: string | number | undefined) {
    if (typeof id === 'number') return id;
    if (!id) return 0;
    const n = Number(String(id).replace(/\D/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  @Get('overview')
  @Perm('report:R')
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
    // 基于数据库的异常/预警聚合（替换原先的内存 AI 事件）
    const nowIso = new Date().toISOString();
    const mcAbnormal = await this.morning.list({ start: dayStart, end: nowIso, result: '异常', page: 1, pageSize: 100000 });
    const disEx = await this.disinfection.list({ start: dayStart, end: nowIso, exception: 'true', page: 1, pageSize: 100000 });
    const pestBad = await this.pesticide.list({ start: dayStart, end: nowIso, result: '不合格', page: 1, pageSize: 100000 });
    const aiOpen = (mcAbnormal.total || 0) + (disEx.total || 0) + (pestBad.total || 0);
    // 卫生合格率（以晨检为例）
    const ok = mc.filter((e: any) => e.result === '正常').length;
    const hygienePassRate = mc.length ? Math.round((ok / mc.length) * 100) : 100;
    // 设备在线率
    const devs = this.devices.list({});
    const online = devs.filter((d) => d.status === 'ONLINE').length;
    const devicesOnlineRate = devs.length ? Math.round((online / devs.length) * 100) : 100;
    // 预警类型分布（基于数据库统计）
    const aiByType = [
      { type: '晨检异常', count: mcAbnormal.total || 0 },
      { type: '消毒异常', count: disEx.total || 0 },
      { type: '农残不合格', count: pestBad.total || 0 },
    ];
    // 近 7 天上报数量（按晨检）
    const dailyReports = await Promise.all(Array.from({ length: 7 }).map(async (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
      const s = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      const sNext = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();
      const cntRes = await this.morning.list({ start: s, end: sNext, page: 1, pageSize: 100000 });
      return { day: s.slice(5, 10), count: cntRes.total };
    }));
    // 投诉待处理 Top（学校）
    const topWarnings: any[] = [];
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
  @Public()
  async schools() {
    try {
      const rows = await this.schoolsRepo.listAll();
      return rows.map((r) => ({ id: this.numId(r.id), name: r.name }));
    } catch {
      // Fallback to local list if DB not ready
      return [
        { id: 1, name: '示例一中' },
        { id: 2, name: '示例二小' },
        { id: 3, name: '示例三幼' },
        { id: 4, name: '示例四小' },
        { id: 5, name: '示例五中' },
      ];
    }
  }

  // System management: schools config
  @Get('schools/config')
  @Perm('school:R')
  async schoolsConfig() {
    const rows = await this.schoolsRepo.listAll(true);
    return rows.map((r) => ({ id: this.numId(r.id), name: r.name, enabled: !!r.enabled }));
  }
  @Post('schools/config')
  @Perm('config:S')
  async createSchool(@Body() b: { name: string; enabled?: boolean }) {
    if (!b?.name || String(b.name).trim() === '') {
      return { ok: false, message: 'name required' };
    }
    try {
      const name = b.name.trim();
      // Idempotent: if same name exists, return existing id (and optionally update enabled)
      const exist = await this.schoolsRepo.findByName(name);
      if (exist) {
        if (typeof b.enabled === 'boolean') {
          await this.schoolsRepo.update(exist.id, { enabled: b.enabled });
        }
        return { ok: true, id: exist.id, existed: true } as any;
      }
      const id = await this.schoolsRepo.insert(name, b.enabled ?? true);
      return { ok: true, id };
    } catch (e: any) {
      const msg = String(e?.message || 'insert failed');
      if (e?.code === 'ER_DUP_ENTRY' || /Duplicate entry/i.test(msg)) {
        // Try resolve by lookup (race or pre-existing)
        const exist = await this.schoolsRepo.findByName(String(b?.name || '').trim());
        if (exist) return { ok: true, id: exist.id, existed: true } as any;
        return { ok: false, status: 409, message: 'duplicate name or id' } as any;
      }
      return { ok: false, status: 500, message: msg } as any;
    }
  }
  @Patch('schools/config')
  @Perm('config:S')
  async updateSchool(@Query('id', ParseIntPipe) id: number, @Body() b: { name?: string; enabled?: boolean }) {
    if (!id) return { ok: false, message: 'id required' } as any;
    await this.schoolsRepo.update(id, b);
    return { ok: true };
  }
  @Post('schools/config/delete')
  @Perm('config:S')
  async deleteSchool(@Body() body: { id: number }) {
    if (!body?.id) return { ok: false, message: 'id required' } as any;
    await this.schoolsRepo.update(body.id, { enabled: false });
    return { ok: true };
  }

  @Get('schools/stats')
  @Public()
  async schoolStats() {
    const base = await this.localSchools();
    return base.map((s) => {
      const online = Math.floor(Math.random() * 4) + 2;
      const offline = Math.floor(Math.random() * 2);
      return { ...s, online, offline };
    });
  }

  @Get('schools/1/cameras')
  cams1() { return this._cameras('示例一中'); }
  @Get('schools/2/cameras')
  cams2() { return this._cameras('示例二小'); }
  @Get('schools/3/cameras')
  cams3() { return this._cameras('示例三幼'); }
  @Get('schools/4/cameras')
  cams4() { return this._cameras('示例四小'); }
  @Get('schools/5/cameras')
  cams5() { return this._cameras('示例五中'); }

  // Generic fallback for any school id: use DB name if available, else map common ids to demo names
  @Get('schools/:id/cameras')
  async camsAny(@Param('id') id: string) {
    // Try DB
    try {
      const list = await this.localSchools();
      const sid = this.numId(id);
      const name = list.find((s) => this.numId(s.id) === sid)?.name;
      if (name) return this._cameras(name);
    } catch {}
    // Fallback mapping
    const map: Record<string, string> = { '1': '示例一中', '2': '示例二小', '3': '示例三幼', '4': '示例四小', '5': '示例五中' };
    const school = map[String(this.numId(id))] || '示例一中';
    return this._cameras(school);
  }

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
      if (rows && rows.length) return rows.map((r) => ({ id: this.numId(r.id), name: r.name }));
    } catch {}
    return [
      { id: 1, name: '示例一中' },
      { id: 2, name: '示例二小' },
      { id: 3, name: '示例三幼' },
      { id: 4, name: '示例四小' },
      { id: 5, name: '示例五中' },
    ];
  }
  // id uses DB auto-increment
}
