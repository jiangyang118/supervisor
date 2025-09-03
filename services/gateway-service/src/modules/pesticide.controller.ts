import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { ParseIntPipe } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PesticideService, PesticideResult } from './pesticide.service';

@Controller('school/pesticide')
export class PesticideController {
  constructor(private readonly svc: PesticideService) {}

  @Get('records')
  list(
    @Query('schoolId') schoolId?: string,
    @Query('q') q?: string,
    @Query('result') result?: PesticideResult,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.svc.list({ schoolId: schoolId ? Number(schoolId) : undefined, q, result, start, end, page, pageSize });
  }

  @Post('records')
  create(
    @Body()
    body: {
      schoolId?: number;
      sample: string;
      device: string;
      result: PesticideResult;
      imageUrl?: string;
      remark?: string;
    },
  ) {
    return this.svc.create(body);
  }

  @Post('device/callback')
  device(
    @Body()
    body: {
      schoolId?: number;
      sample: string;
      device: string;
      result: PesticideResult;
      imageUrl?: string;
      remark?: string;
    },
  ) {
    return this.svc.deviceCallback(body);
  }

  @Patch('records/:id/measure')
  setMeasure(@Param('id', ParseIntPipe) id: number, @Body() body: { measure: string }) {
    return this.svc.setMeasure(id, body.measure);
  }

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.svc.stream();
  }
}
