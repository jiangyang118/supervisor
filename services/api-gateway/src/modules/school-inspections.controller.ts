import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { InspectionsService, InspectStatus, InspectType } from './inspections.service';

@Controller('school/inspections')
export class SchoolInspectionsController {
  constructor(private readonly svc: InspectionsService) {}

  @Get('tasks')
  list(
    @Query('schoolId') schoolId?: string,
    @Query('assignee') assignee?: string,
    @Query('status') status?: InspectStatus,
    @Query('type') type?: InspectType,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ) {
    return this.svc.listTasks({
      schoolId: schoolId || 'sch-001',
      assignee,
      status,
      type,
      start,
      end,
      page,
      pageSize,
    });
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

  @Get('config')
  config() {
    return this.svc.listConfig();
  }
}
