import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  Sse,
  MessageEvent,
  ParseIntPipe,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { MorningCheckService, MCResult } from './morning-check.service';

@Controller('school/morning-checks')
export class MorningCheckController {
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
    return this.svc.list({
      schoolId: schoolId !== undefined && schoolId !== null && schoolId !== '' ? Number(schoolId) : undefined,
      staff,
      result,
      start,
      end,
      page,
      pageSize,
    });
  }

  @Post()
  create(
    @Body() body: { schoolId?: number; staff: string; temp: number; source?: 'manual' | 'device' },
  ) {
    return this.svc.create(body);
  }

  @Post('device/callback')
  deviceCallback(@Body() body: { schoolId?: number; staff: string; temp: number }) {
    return this.svc.deviceCallback(body);
  }

  @Patch(':id/measure')
  setMeasure(@Param('id', ParseIntPipe) id: number, @Body() body: { measure: string }) {
    return this.svc.setMeasure(id, body.measure);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }

  @Sse('stream')
  sse(): Observable<MessageEvent> {
    return this.svc.stream();
  }
}
