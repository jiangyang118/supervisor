import { Controller, Get, Query, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DineService, Meal } from './dine.service';

// Adapter to support legacy/frontend path `/api/school/dine/*`
@Controller('api/school/dine')
export class DineApiAdapterController {
  constructor(private readonly svc: DineService) {}

  @Get('records')
  list(
    @Query('schoolId') schoolId?: string,
    @Query('meal') meal?: Meal,
    @Query('exception') exception?: 'true' | 'false',
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.svc.list({ schoolId, meal, exception, start, end, page, pageSize });
  }

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.svc.stream();
  }
}

