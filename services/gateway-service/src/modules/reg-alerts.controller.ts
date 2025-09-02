import { Controller, Get, Query, Sse, MessageEvent, Post, Body } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { DevicesService } from './devices.service';
import { PesticideService } from './pesticide.service';
import { MorningCheckService } from './morning-check.service';
import { PublicFeedbackService } from './public-feedback.service';
import { Observable, Subject } from 'rxjs';

type AlertType =
  | '证件过期'
  | '食材过期'
  | '行为预警'
  | '设备离线'
  | '设备预警'
  | '农残预警'
  | '上报预警'
  | '投诉预警';

@Controller('reg/alerts')
export class RegAlertsController {
  private events$ = new Subject<MessageEvent>();
  private config = {
    enabled: true,
    channels: { sms: true, app: true },
    rules: [
      {
        code: '行为预警',
        name: 'AI 行为',
        enabled: true,
        window: { start: '08:00', end: '18:00' },
        recipients: ['监管群'],
        scope: 'all' as const,
      },
    ],
  };

  constructor(
    private readonly certs: CertificatesService,
    private readonly devices: DevicesService,
    private readonly pesticide: PesticideService,
    private readonly morning: MorningCheckService,
    private readonly feedback: PublicFeedbackService,
  ) {}

  private schools() {
    return [
      { id: 'sch-001', name: '示例一中' },
      { id: 'sch-002', name: '示例二小' },
      { id: 'sch-003', name: '示例三幼' },
      { id: 'sch-004', name: '示例四小' },
      { id: 'sch-005', name: '示例五中' },
    ];
  }

  @Get('summary')
  async summary(@Query('start') start?: string, @Query('end') end?: string) {
    const schools = this.schools();
    // 证件过期
    const certExpired = (await this.certs.list({ status: '过期' })).length;
    // 食材过期（演示占位，真实接入入库保质期后实现）
    const foodExpired = 0;
    // 行为预警（AI OPEN）
    const aiOpen = (global as any).DataStore?.aiEvents
      ? (global as any).DataStore.aiEvents.filter((e: any) => e.status === 'OPEN').length
      : 0;
    // 设备离线
    const offline = this.devices.list({}).filter((d) => d.status === 'OFFLINE').length;
    // 设备预警（温控超标等）
    const devAlerts = this.devices
      .list({})
      .filter(
        (d) =>
          d.metrics && typeof (d.metrics as any).temp === 'number' && (d.metrics as any).temp > 8,
      ).length;
    // 农残不合格
    let pesticideBad = 0;
    for (const s of schools) {
      const res = await this.pesticide.list({ schoolId: s.id, result: '不合格', page: 1, pageSize: 100000 });
      pesticideBad += res.items.length;
    }
    // 上报预警（以晨检为例：今天无上报）
    const today = new Date();
    const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    let noReport = 0;
    for (const s of schools) {
      const res = await this.morning.list({ schoolId: s.id, start: dayStart, page: 1, pageSize: 1 });
      noReport += res.total === 0 ? 1 : 0;
    }
    // 投诉待处理
    const pendingFeedback = (await this.feedback.list({
      status: '待处理',
      page: 1,
      pageSize: 100000,
    })).total;

    return {
      stats: [
        { type: '证件过期', count: certExpired },
        { type: '食材过期', count: foodExpired },
        { type: '行为预警', count: aiOpen },
        { type: '设备离线', count: offline },
        { type: '设备预警', count: devAlerts },
        { type: '农残预警', count: pesticideBad },
        { type: '上报预警', count: noReport },
        { type: '投诉预警', count: pendingFeedback },
      ],
    };
  }

  @Get('events')
  async events(
    @Query('type') type?: AlertType,
    @Query('schoolId') schoolId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ) {
    const sid = schoolId;
    let items: any[] = [];
    const schools = this.schools();
    const nameOf = (id?: string) => schools.find((s) => s.id === id)?.name || id;
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const ps = Math.max(parseInt(pageSize, 10) || 50, 1);
    const inRange = (tISO: string) => (!start || tISO >= start) && (!end || tISO <= end);

    const push = (arr: any[]) => {
      items.push(...arr);
    };

    if (!type || type === '证件过期') {
      const certs = (await this.certs.list({ status: '过期' })).map((c: any) => ({
        id: c.id,
        school: '-',
        schoolId: '-',
        kind: '证件过期',
        detail: `${c.owner}:${c.type}已过期`,
        at: c.expireAt,
      }));
      push(certs);
    }
    if (!type || type === '食材过期') {
      // 占位（真实环境从入库保质期/库存有效期生成）
    }
    if (!type || type === '行为预警') {
      const ds = (global as any).DataStore;
      if (ds) {
        push(
          ds.aiEvents
            .filter((e: any) => e.status === 'OPEN')
            .filter((e: any) => !sid || e.schoolId === sid)
            .filter((e: any) => inRange(e.detectedAt))
            .map((e: any) => ({
              id: e.id,
              schoolId: e.schoolId,
              school: nameOf(e.schoolId),
              kind: e.type,
              detail: 'AI行为预警',
              at: e.detectedAt,
            })),
        );
      }
    }
    if (!type || type === '设备离线' || type === '设备预警') {
      const devs = this.devices.list({});
      if (!type || type === '设备离线')
        push(
          devs
            .filter((d) => d.status === 'OFFLINE' && (!sid || d.schoolId === sid))
            .map((d) => ({
              id: d.id,
              schoolId: d.schoolId,
              school: nameOf(d.schoolId),
              kind: '设备离线',
              detail: `${d.name}离线`,
              at: d.lastSeen,
            })),
        );
      if (!type || type === '设备预警')
        push(
          devs
            .filter(
              (d) =>
                d.metrics &&
                typeof (d.metrics as any).temp === 'number' &&
                (d.metrics as any).temp > 8 &&
                (!sid || d.schoolId === sid),
            )
            .map((d) => ({
              id: d.id,
              schoolId: d.schoolId,
              school: nameOf(d.schoolId),
              kind: '设备预警',
              detail: `${d.name}温度超标`,
              at: d.lastSeen,
            })),
        );
    }
    if (!type || type === '农残预警') {
      for (const s of schools) {
        if (sid && s.id !== sid) continue;
        const { items: arr } = await this.pesticide.list({
          schoolId: s.id,
          result: '不合格',
          page: 1,
          pageSize: 100000,
        });
        push(
          arr
            .filter((r: any) => inRange(r.at))
            .map((r: any) => ({
              id: r.id,
              schoolId: s.id,
              school: s.name,
              kind: '农残预警',
              detail: `${r.sample}不合格`,
              at: r.at,
            })),
        );
      }
    }
    if (!type || type === '上报预警') {
      const today = new Date();
      const dayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      ).toISOString();
      for (const s of schools) {
        if (sid && s.id !== sid) continue;
        const cRes = await this.morning.list({
          schoolId: s.id,
          start: dayStart,
          page: 1,
          pageSize: 1,
        });
        if (cRes.total === 0)
          push([
            {
              id: `NR-${s.id}`,
              schoolId: s.id,
              school: s.name,
              kind: '未上报',
              detail: '今日晨检未上报',
              at: new Date().toISOString(),
            },
          ]);
      }
    }
    if (!type || type === '投诉预警') {
      const fb = (await this.feedback.list({ status: '待处理', page: 1, pageSize: 100000 })).items;
      push(
        fb
          .filter((r: any) => (!sid || r.schoolId === sid) && inRange(r.at))
          .map((r: any) => ({
            id: r.id,
            schoolId: r.schoolId,
            school: nameOf(r.schoolId),
            kind: '投诉待处理',
            detail: r.content,
            at: r.at,
          })),
      );
    }

    items = items.sort((a, b) => (a.at < b.at ? 1 : -1));
    const total = items.length;
    const paged = items.slice((p - 1) * ps, p * ps);
    return { items: paged, total, page: p, pageSize: ps };
  }

  @Get('events/export.csv')
  async exportCsv(
    @Query('type') type?: AlertType,
    @Query('schoolId') schoolId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { items } = await this.events(type, schoolId, start, end, '1', '100000');
    const headers = ['id', 'schoolId', 'school', 'kind', 'detail', 'at'];
    const rows = (items as any[]).map((r) => [
      r.id,
      r.schoolId || '',
      r.school || '',
      r.kind || '',
      r.detail || '',
      r.at || '',
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return { csv };
  }

  @Get('config')
  getConfig() {
    return this.config;
  }
  @Post('config')
  setConfig(@Body() patch: any) {
    this.config = { ...this.config, ...patch, rules: patch?.rules ?? this.config.rules };
    return this.config;
  }
  @Post('notify')
  notify(@Body() b: { to: string[]; message: string; channel?: 'sms' | 'app' | 'both' }) {
    this.events$.next({ type: 'notify', data: { at: new Date().toISOString(), ...b } as any });
    return { ok: true };
  }

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    setTimeout(() => this.events$.next({ type: 'hello', data: { ok: true } }), 0);
    return this.events$.asObservable();
  }
}
