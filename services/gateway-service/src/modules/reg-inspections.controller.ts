import { Body, Controller, Get, Post, Patch, Param, Query } from '@nestjs/common';
import { InspectionsService, InspectStatus, InspectType } from './inspections.service';

@Controller('reg/inspections')
export class RegInspectionsController {
  constructor(private readonly svc: InspectionsService) {}

  private schools() {
    return [
      { id: 'sch-001', name: '示例一中' },
      { id: 'sch-002', name: '示例二小' },
      { id: 'sch-003', name: '示例三幼' },
      { id: 'sch-004', name: '示例四小' },
      { id: 'sch-005', name: '示例五中' },
    ];
  }

  @Get('tasks')
  listTasks(
    @Query('type') type?: InspectType,
    @Query('status') status?: InspectStatus,
    @Query('schoolId') schoolId?: string,
    @Query('assignee') assignee?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ) {
    const res = this.svc.listTasks({
      type,
      status,
      schoolId,
      assignee,
      start,
      end,
      page,
      pageSize,
    });
    const items = res.items.map((t) => ({
      ...t,
      schoolName: this.schools().find((s) => s.id === t.schoolId)?.name || t.schoolId,
    }));
    return { ...res, items };
  }

  @Post('tasks')
  createTask(
    @Body()
    b: {
      type: InspectType;
      schoolId: string;
      assignee?: string;
      grid?: string;
      content: string;
    },
  ) {
    const schoolName = this.schools().find((s) => s.id === b.schoolId)?.name;
    return this.svc.createTask({ ...b, schoolName });
  }

  @Patch('tasks/:id')
  updateTask(@Param('id') id: string, @Body() patch: any) {
    return this.svc.updateTask(id, patch);
  }

  @Post('tasks/:id/submit')
  submit(
    @Param('id') id: string,
    @Body()
    body: {
      passed: boolean;
      items: Array<{ item: string; ok: boolean; remark?: string; penaltyType?: string }>;
      summary?: string;
    },
  ) {
    return this.svc.submitResult(id, body);
  }

  @Post('tasks/random')
  random(
    @Body()
    b: {
      item: string;
      inspectorCount?: number;
      schoolIds?: string[];
      schoolCount?: number;
    },
  ) {
    return this.svc.createRandomTasks({
      item: b.item,
      inspectorCount: b.inspectorCount,
      schoolIds: b.schoolIds,
      schoolCount: b.schoolCount,
      candidates: { inspectors: this.svc.listInspectors(), schools: this.schools() },
    });
  }

  @Get('tasks/export.csv')
  exportTasksCsv(
    @Query('type') type?: InspectType,
    @Query('status') status?: InspectStatus,
    @Query('schoolId') schoolId?: string,
    @Query('assignee') assignee?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { items } = this.listTasks(type, status, schoolId, assignee, start, end, '1', '100000');
    const headers = [
      'id',
      'type',
      'schoolId',
      'schoolName',
      'assignee',
      'grid',
      'content',
      'status',
      'createdAt',
      'completedAt',
    ];
    const rows = (items as any[]).map((t) => [
      t.id,
      t.type,
      t.schoolId,
      t.schoolName || '',
      t.assignee || '',
      t.grid || '',
      t.content,
      t.status,
      t.createdAt,
      t.completedAt || '',
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return { csv };
  }

  // Inspectors and grid
  @Get('inspectors') listInspectors() {
    return this.svc.listInspectors();
  }
  @Post('inspectors') createInspector(
    @Body() b: { name: string; region?: string; mobile?: string; grids?: string[] },
  ) {
    return this.svc.createInspector(b);
  }
  @Patch('inspectors/:id') updateInspector(@Param('id') id: string, @Body() patch: any) {
    return this.svc.updateInspector(id, patch);
  }
  @Post('inspectors/:id/delete') deleteInspector(@Param('id') id: string) {
    return this.svc.deleteInspector(id);
  }

  // Config
  @Get('config') getConfig() {
    return this.svc.listConfig();
  }
  @Post('config/items') addItem(@Body() b: { name: string }) {
    return this.svc.addConfigItem('items', b.name);
  }
  @Post('config/penalties') addPenalty(@Body() b: { name: string }) {
    return this.svc.addConfigItem('penalties', b.name);
  }
  @Post('config/publications') addPublication(@Body() b: { name: string }) {
    return this.svc.addConfigItem('publications', b.name);
  }
  @Post('config/items/remove') removeItem(@Body() b: { name: string }) {
    return this.svc.removeConfigItem('items', b.name);
  }
  @Post('config/penalties/remove') removePenalty(@Body() b: { name: string }) {
    return this.svc.removeConfigItem('penalties', b.name);
  }
  @Post('config/publications/remove') removePublication(@Body() b: { name: string }) {
    return this.svc.removeConfigItem('publications', b.name);
  }
}
