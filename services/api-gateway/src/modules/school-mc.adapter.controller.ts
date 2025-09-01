import { Controller, Get, Query, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { MorningCheckService, MCResult } from './morning-check.service';

// Adapter to support legacy/frontend path `/api/school/morning-checks` and `/api/school/morning-checks/stream`
@Controller('api/school/morning-checks')
export class MorningCheckApiAdapterController {
  constructor(private readonly svc: MorningCheckService) {}

  @Get()
  list(
    @Query('schoolId') schoolId?: string,
    @Query('staff') staff?: string,
    @Query('result') result?: MCResult,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.svc.list({ schoolId, staff, result, start, end, page, pageSize });
  }

  @Sse('stream')
  sse(): Observable<MessageEvent> {
    return this.svc.stream();
  }
}

