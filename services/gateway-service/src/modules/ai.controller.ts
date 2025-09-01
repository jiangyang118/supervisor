import { Controller, Get, Post, Body, Query, Patch, BadRequestException } from '@nestjs/common';
import { DataStore, AIEvent } from './data.store';

@Controller()
export class AIController {
  private types = [
    { code: 'NO_MASK', label: '未戴口罩' },
    { code: 'NO_HAT', label: '未戴帽' },
    { code: 'NO_UNIFORM', label: '未穿工作服' },
    { code: 'NO_GLOVES', label: '未戴手套' },
    { code: 'PHONE_CALL', label: '打电话' },
    { code: 'SMOKING', label: '吸烟' },
    { code: 'FIRE', label: '烟火' },
    { code: 'RODENT', label: '鼠患' },
  ] as const;
  private tasks: Array<{
    id: string;
    name: string;
    items: string[];
    method: string;
    period?: { start?: string; end?: string };
    schools: string[];
    status: '待处理' | '进行中' | '已完成';
    createdAt: string;
  }> = [];
  private bcLogs: Array<{
    id: string;
    school: string;
    camera: string;
    text: string;
    status: string;
    at: string;
  }> = [];
  private seq = 1;
  private id(prefix: string) {
    return `${prefix}-${String(this.seq++).padStart(4, '0')}`;
  }
  private schoolList() {
    return [
      { id: 'sch-001', name: '示例一中' },
      { id: 'sch-002', name: '示例二小' },
      { id: 'sch-003', name: '示例三幼' },
      { id: 'sch-004', name: '示例四小' },
      { id: 'sch-005', name: '示例五中' },
    ];
  }
  private schoolNameOf(id?: string) {
    if (!id) return '';
    return this.schoolList().find((s) => s.id === id)?.name || id;
  }

  // 基础元数据
  @Get('reg/ai/methods')
  methods() {
    return ['AI自动巡查', '人工视频巡查', '现场抽检'];
  }
  @Get('reg/ai/schools')
  aiSchools() {
    const base = this.schoolList();
    return base.map((s) => ({
      ...s,
      linked:
        DataStore.aiEvents.some((e) => e.schoolId === s.id) ||
        (DataStore.devices || []).some(
          (d: any) => d.schoolId === s.id && d.type.includes('摄像头'),
        ),
    }));
  }

  @Get('school/ai/types')
  listTypes() {
    return this.types;
  }

  // 学校端查询本校事件（含筛选+分页）
  @Get('school/ai/events')
  schoolEvents(
    @Query('schoolId') schoolId?: string,
    @Query('type') type?: string,
    @Query('status') status?: 'OPEN' | 'ACK' | 'CLOSED',
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const sid = schoolId || 'sch-001';
    let items = DataStore.aiEvents.filter((e) => e.schoolId === sid);

    const typeMap = new Map(this.types.map((t) => [t.code, t.label] as const));
    const revType = new Map(this.types.map((t) => [t.label, t.code] as const));
    if (type) {
      // 支持 code 或 label
      const tcode = (typeMap.has(type as any) ? type : revType.get(type as any)) as any;
      if (tcode) items = items.filter((e) => revType.get(e.type as any) === tcode);
    }
    if (status) items = items.filter((e) => e.status === status);
    if (start) {
      const s = new Date(start).getTime();
      items = items.filter((e) => new Date(e.detectedAt).getTime() >= s);
    }
    if (end) {
      const t = new Date(end).getTime();
      items = items.filter((e) => new Date(e.detectedAt).getTime() <= t);
    }

    const p = Math.max(1, parseInt(String(page), 10) || 1);
    const ps = Math.max(1, parseInt(String(pageSize), 10) || 20);
    const total = items.length;
    const paged = items.slice((p - 1) * ps, p * ps).map((e) => ({
      id: e.id,
      typeCode: revType.get(e.type as any) || 'UNKNOWN',
      typeLabel: e.type,
      camera: e.cameraId ? `通道 ${e.cameraId}` : '未记录',
      snapshot: e.snapshotUrl || '',
      at: e.detectedAt,
      status: e.status,
      measure: e.measure || '',
    }));
    return { items: paged, total, page: p, pageSize: ps };
  }

  // 学校端获取事件统计数据
  @Get('school/ai/events/summary')
  schoolEventsSummary(
    @Query('schoolId') schoolId?: string,
    @Query('dim') dim: 'day' | 'week' | 'month' = 'day',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const sid = schoolId || 'sch-001';
    let items = DataStore.aiEvents.filter((e) => e.schoolId === sid);

    // 按时间筛选
    if (start) {
      const s = new Date(start).getTime();
      items = items.filter((e) => new Date(e.detectedAt).getTime() >= s);
    }
    if (end) {
      const t = new Date(end).getTime();
      items = items.filter((e) => new Date(e.detectedAt).getTime() <= t);
    }

    // 按类型分组并统计
    const typeStats: Record<string, number> = {};
    items.forEach((event) => {
      typeStats[event.type] = (typeStats[event.type] || 0) + 1;
    });

    // 转换为需要的格式
    const result = Object.entries(typeStats).map(([type, count]) => ({
      date: this.formatDate(dim),
      type,
      count,
      status: items.filter((e) => e.type === type).some((e) => e.status === 'OPEN')
        ? 'OPEN'
        : 'CLOSED',
    }));

    return result;
  }

  // 学校端导出事件统计数据为CSV
  @Get('school/ai/events/summary/export.csv')
  async schoolEventsSummaryExport(
    @Query('schoolId') schoolId?: string,
    @Query('dim') dim: 'day' | 'week' | 'month' = 'day',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const data = await this.schoolEventsSummary(schoolId, dim, start, end);

    const header = '日期,类型,数量,状态\n';
    const body = data
      .map((row) =>
        [row.date, row.type, row.count, row.status === 'OPEN' ? '未处理' : '已处理']
          .map((v) => String(v).replaceAll('"', '""'))
          .map((v) => (/,|\n|"/.test(v) ? `"${v}"` : `${v}`))
          .join(','),
      )
      .join('\n');

    const csv = '﻿' + header + body;
    return { csv };
  }

  // 格式化日期的辅助方法
  private formatDate(dim: 'day' | 'week' | 'month'): string {
    const now = new Date();
    switch (dim) {
      case 'day':
        return now.toLocaleDateString('zh-CN');
      case 'week':
        const dayOfWeek = now.getDay() || 7;
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + (7 - dayOfWeek));
        return `${startOfWeek.toLocaleDateString('zh-CN')} 至 ${endOfWeek.toLocaleDateString('zh-CN')}`;
      case 'month':
        return `${now.getFullYear()}年${now.getMonth() + 1}月`;
      default:
        return now.toLocaleDateString('zh-CN');
    }
  }

  @Post('school/ai/events/handle')
  handleSchool(@Body() dto: { eventId: string; measure: string }) {
    if (!dto?.eventId) throw new BadRequestException('eventId required');
    const ev = DataStore.aiEvents.find((e) => e.id === dto.eventId);
    if (!ev) throw new BadRequestException('event not found');
    ev.measure = dto.measure || '';
    ev.status = 'CLOSED';
    return { ok: true, id: ev.id, status: ev.status, measure: ev.measure };
  }

  @Patch('school/ai/events/status')
  setStatus(@Query('id') id: string, @Body() b: { status: 'OPEN' | 'ACK' | 'CLOSED' }) {
    const ev = DataStore.aiEvents.find((e) => e.id === id);
    if (!ev) throw new BadRequestException('event not found');
    ev.status = b?.status || ev.status;
    return { ok: true, id: ev.id, status: ev.status };
  }

  // 监管端查询全量事件
  @Get('reg/ai/events')
  regEvents(
    @Query('schoolId') schoolId?: string,
    @Query('type') type?: string,
    @Query('status') status?: 'OPEN' | 'ACK' | 'CLOSED',
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    let items = DataStore.aiEvents.slice();
    const typeMap = new Map(this.types.map((t) => [t.code, t.label] as const));
    const revType = new Map(this.types.map((t) => [t.label, t.code] as const));
    if (schoolId) items = items.filter((e) => e.schoolId === schoolId);
    if (type) {
      const tcode = (typeMap.has(type as any) ? type : revType.get(type as any)) as any;
      if (tcode) items = items.filter((e) => revType.get(e.type as any) === tcode);
    }
    if (status) items = items.filter((e) => e.status === status);
    if (start) {
      const s = new Date(start).getTime();
      items = items.filter((e) => new Date(e.detectedAt).getTime() >= s);
    }
    if (end) {
      const t = new Date(end).getTime();
      items = items.filter((e) => new Date(e.detectedAt).getTime() <= t);
    }
    items = items.sort((a, b) => (a.detectedAt < b.detectedAt ? 1 : -1));
    const p = Math.max(1, parseInt(String(page), 10) || 1);
    const ps = Math.max(1, parseInt(String(pageSize), 10) || 20);
    const total = items.length;
    const paged = items.slice((p - 1) * ps, p * ps).map((e) => ({
      id: e.id,
      schoolId: e.schoolId,
      schoolName: this.schoolNameOf(e.schoolId),
      typeCode: revType.get(e.type as any) || 'UNKNOWN',
      typeLabel: e.type,
      camera: e.cameraId ? `通道 ${e.cameraId}` : '未记录',
      snapshot: e.snapshotUrl || '',
      at: e.detectedAt,
      status: e.status,
      measure: e.measure || '',
    }));
    return { items: paged, total, page: p, pageSize: ps };
  }

  @Get('reg/ai/events/export.csv')
  regEventsExport(
    @Query('schoolId') schoolId?: string,
    @Query('type') type?: string,
    @Query('status') status?: 'OPEN' | 'ACK' | 'CLOSED',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { items } = this.regEvents(
      schoolId,
      type as any,
      status as any,
      start,
      end,
      '1',
      '100000',
    );
    const header = '学校ID,学校名称,类型,通道,快照,时间,状态,处置\n';
    const body = (items as any[])
      .map((r) =>
        [
          r.schoolId,
          r.schoolName,
          r.typeLabel,
          r.camera,
          r.snapshot,
          r.at,
          r.status,
          r.measure || '',
        ]
          .map((v) => String(v).replaceAll('"', '""'))
          .map((v) => (/,|\n|\"/.test(v) ? `"${v}"` : v))
          .join(','),
      )
      .join('\n');
    const csv = '﻿' + header + body;
    return { csv };
  }

  // 监管端巡查任务列表（示例）
  @Get('reg/ai/tasks')
  regTasks(
    @Query('status') status?: '待处理' | '进行中' | '已完成',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    let items = this.tasks.slice();
    if (status) items = items.filter((t) => t.status === status);
    if (start) {
      const s = new Date(start).getTime();
      items = items.filter((t) => new Date(t.createdAt).getTime() >= s);
    }
    if (end) {
      const e = new Date(end).getTime();
      items = items.filter((t) => new Date(t.createdAt).getTime() <= e);
    }
    return items;
  }
  @Post('reg/ai/tasks')
  createTask(
    @Body()
    body: {
      name: string;
      items: string[];
      method: string;
      period?: { start?: string; end?: string };
      schools: string[];
    },
  ) {
    const t = {
      id: this.id('TASK'),
      name: body.name,
      items: body.items || [],
      method: body.method || 'AI自动巡查',
      period: body.period,
      schools: body.schools || [],
      status: '待处理' as const,
      createdAt: new Date().toISOString(),
    };
    this.tasks.unshift(t);
    return t;
  }
  @Patch('reg/ai/tasks/:id')
  updateTask(
    @Query('id') id: string,
    @Body()
    body: Partial<{
      name: string;
      items: string[];
      method: string;
      period: { start?: string; end?: string };
      schools: string[];
      status: '待处理' | '进行中' | '已完成';
    }>,
  ) {
    const idx = this.tasks.findIndex((t) => t.id === id);
    if (idx === -1) throw new BadRequestException('task not found');
    this.tasks[idx] = { ...this.tasks[idx], ...body } as any;
    return this.tasks[idx];
  }
  @Patch('reg/ai/tasks/:id/status')
  setTaskStatus(@Query('id') id: string, @Body() b: { status: '待处理' | '进行中' | '已完成' }) {
    const idx = this.tasks.findIndex((t) => t.id === id);
    if (idx === -1) throw new BadRequestException('task not found');
    this.tasks[idx].status = b?.status || this.tasks[idx].status;
    return this.tasks[idx];
  }

  // 监管端远程喊话（示例）
  @Post('reg/ai/broadcast')
  broadcast(@Body() dto: { school: string; camera: string; text: string }) {
    const rec = {
      id: this.id('BC'),
      school: dto.school,
      camera: dto.camera,
      text: dto.text,
      status: '已发送',
      at: new Date().toISOString(),
    };
    this.bcLogs.unshift(rec);
    return rec;
  }
  @Get('reg/ai/broadcast/logs')
  bcList() {
    return this.bcLogs;
  }

  // 事件接入（示例）：用于联动自动语音告警
  @Post('reg/ai/events/ingest')
  ingest(
    @Body()
    ev: {
      schoolId: string;
      cameraId?: string;
      type: string;
      snapshotUrl?: string;
      detectedAt?: string;
    },
  ) {
    const id = this.id('E');
    const e: AIEvent = {
      id,
      schoolId: ev.schoolId,
      cameraId: ev.cameraId,
      type: ev.type,
      snapshotUrl: ev.snapshotUrl,
      detectedAt: ev.detectedAt || new Date().toISOString(),
      status: 'OPEN',
    };
    DataStore.aiEvents.unshift(e);
    // 违规类型自动语音提醒（示例）
    const violating = new Set(['未戴帽', '未戴口罩', '未穿工作服', '未戴手套', '吸烟', '烟火']);
    if (violating.has(e.type)) {
      const text = `发现${e.type}行为，请立即整改。`;
      this.bcLogs.unshift({
        id: this.id('BC'),
        school: e.schoolId,
        camera: e.cameraId || '',
        text,
        status: '已发送',
        at: new Date().toISOString(),
      });
    }
    return e;
  }
}
