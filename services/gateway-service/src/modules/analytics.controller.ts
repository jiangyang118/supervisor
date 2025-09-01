import { Controller, Get, Query, Sse, MessageEvent } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Observable } from 'rxjs';

@Controller('school/analytics')
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  @Get('dashboard') dashboard(@Query('schoolId') schoolId?: string) {
    return this.svc.dashboard({ schoolId });
  }

  @Get('food-index') foodIndex(@Query('schoolId') schoolId?: string) {
    return this.svc.foodIndex({ schoolId });
  }

  @Sse('stream') stream(): Observable<MessageEvent> {
    return this.svc.stream();
  }
}
