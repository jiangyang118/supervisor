import { Controller, Get, Post, Body, Query, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { HygieneService, InspectResult } from './hygiene.service';

@Controller('school')
export class HygieneController {
  constructor(private readonly svc: HygieneService) {}

  @Get('hygiene/inspections')
  listInspections(
    @Query('schoolId') schoolId?: string,
    @Query('result') result?: InspectResult,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.svc.listInspections({ schoolId, result, start, end, page, pageSize });
  }

  @Post('hygiene/inspections')
  createInspection(
    @Body()
    body: {
      schoolId?: string;
      date?: string;
      result: InspectResult;
      by: string;
      remark?: string;
    },
  ) {
    return this.svc.createInspection(body);
  }

  @Get('assets/maintenance')
  listAssets(
    @Query('schoolId') schoolId?: string,
    @Query('asset') asset?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.svc.listAssets({ schoolId, asset, start, end, page, pageSize });
  }

  @Post('assets/maintenance')
  createAsset(
    @Body() body: { schoolId?: string; asset: string; date?: string; action: string; by: string },
  ) {
    return this.svc.createAsset(body);
  }

  @Sse('hygiene/stream')
  stream(): Observable<MessageEvent> {
    return this.svc.stream();
  }
}
