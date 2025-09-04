import { Body, Controller, Get, Post, Patch, Query } from '@nestjs/common';
import { RiskService, ReportStatus, TaskStatus } from './risk.service';

@Controller('school/risk')
export class RiskController {
  constructor(private readonly svc: RiskService) {}

  // Catalog
  @Get('catalog') catalog() {
    return this.svc.listCatalog();
  }
  @Post('catalog') createCatalog(
    @Body() b: { category?: string; title: string; level: any; desc?: string },
  ) {
    return this.svc.createCatalog(b as any);
  }
  @Patch('catalog') updateCatalog(@Query('id') id: string, @Body() b: any) {
    return this.svc.updateCatalog(id, b);
  }
  @Post('catalog/delete') deleteCatalog(@Body() b: { id: string }) {
    return this.svc.deleteCatalog(b.id);
  }

  @Get('catalog/export.csv') catalogExportCsv() {
    const items = this.svc.listCatalog();
    const headers = ['id', 'category', 'title', 'level', 'desc'];
    const rows = items.map((c: any) => [c.id, c.category || '', c.title, c.level, c.desc || '']);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return { csv };
  }

  // Reports
  @Get('reports') reports(
    @Query('status') status?: ReportStatus,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('location') location?: string,
    @Query('object') object?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    return this.svc.listReports({ status, start, end, location, object, page, pageSize });
  }
  @Post('reports') createReport(
    @Body()
    b: {
      schoolId?: string;
      location: string;
      object: string;
      desc: string;
      images?: string[];
      riskId?: string;
    },
  ) {
    return this.svc.createReport(b);
  }
  @Get('reports/detail') reportDetail(@Query('id') id: string) {
    return this.svc.getReport(id);
  }
  @Patch('reports/status') setReportStatus(
    @Query('id') id: string,
    @Body() b: { status: ReportStatus; measures?: string; rectifiedBy?: string },
  ) {
    return this.svc.setReportStatus(id, b.status, b);
  }

  @Get('reports/export.csv') reportsExport(
    @Query('status') status?: ReportStatus,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('location') location?: string,
    @Query('object') object?: string,
  ) {
    const { items } = this.svc.listReports({
      status,
      start,
      end,
      location,
      object,
      page: 1,
      pageSize: 100000,
    });
    const headers = [
      'id',
      'at',
      'location',
      'object',
      'desc',
      'status',
      'measures',
      'rectifiedBy',
      'rectifiedAt',
    ];
    const rows = items.map((r: any) => [
      r.id,
      r.at,
      r.location,
      r.object,
      r.desc,
      r.status,
      r.measures || '',
      r.rectifiedBy || '',
      r.rectifiedAt || '',
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return { csv };
  }

  // Tasks
  @Get('tasks') tasks(
    @Query('schoolId') schoolId?: string,
    @Query('assignee') assignee?: string,
    @Query('status') status?: TaskStatus,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.svc.listTasks({ schoolId, assignee, status, start, end });
  }
  @Post('tasks') createTask(
    @Body()
    b: {
      schoolId?: string | number;
      assignee: string;
      location: string;
      object: string;
      riskId?: string;
      dueAt?: string;
      note?: string;
    },
  ) {
    return this.svc.createTask(b);
  }
  @Get('tasks/detail') taskDetail(@Query('id') id: string) {
    return this.svc.getTask(id);
  }
  @Patch('tasks/status') setTaskStatus(@Query('id') id: string, @Body() b: { status: TaskStatus }) {
    return this.svc.setTaskStatus(id, b.status);
  }
  @Post('tasks/submit') submitTask(@Body() b: { id: string; result: string; images?: string[] }) {
    return this.svc.submitTask(b.id, { result: b.result, images: b.images });
  }

  @Get('tasks/export.csv') tasksExport(
    @Query('schoolId') schoolId?: string,
    @Query('assignee') assignee?: string,
    @Query('status') status?: TaskStatus,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const items = this.svc.listTasks({ schoolId, assignee, status, start, end });
    const headers = [
      'id',
      'schoolId',
      'assignee',
      'location',
      'object',
      'riskId',
      'dueAt',
      'note',
      'status',
      'result',
      'createdAt',
    ];
    const rows = items.map((t: any) => [
      t.id,
      t.schoolId || '',
      t.assignee,
      t.location,
      t.object,
      t.riskId || '',
      t.dueAt || '',
      t.note || '',
      t.status,
      t.result || '',
      t.createdAt,
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return { csv };
  }
}
