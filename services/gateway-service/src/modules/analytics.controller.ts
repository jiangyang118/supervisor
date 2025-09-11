import { Controller, Get, Query, Sse, MessageEvent, Post, Body } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Observable } from 'rxjs';

@Controller('school/analytics')
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  @Get('dashboard') dashboard(@Query('schoolId') schoolId?: string) {
    return this.svc.dashboard({ schoolId });
  }

  @Get('alerts') alerts(
    @Query('schoolId') schoolId?: string,
    @Query('type') type?: string,
    @Query('status') status?: '未处理' | '已处理',
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('canteenId') canteenId?: string,
  ) {
    return this.svc.alertsOverview({ schoolId, type, status, start, end, canteenId });
  }

  @Post('alerts/handle')
  handleAlert(@Body() b: { id: string; type: string; measure?: string; status?: '未处理' | '已处理' }) {
    return this.svc.handleAlert(b);
  }

  @Sse('stream') stream(): Observable<MessageEvent> {
    return this.svc.stream();
  }
}
