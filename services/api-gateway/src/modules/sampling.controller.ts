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
import { Observable } from 'rxjs';
import { SamplingService, SampleStatus } from './sampling.service';

@Controller('school/sampling')
export class SamplingController {
  constructor(private readonly svc: SamplingService) {}

  // Records
  @Get('records')
  listRecords(
    @Query('schoolId') schoolId?: string,
    @Query('sample') sample?: string,
    @Query('status') status?: SampleStatus,
    @Query('exception') exception?: 'true' | 'false',
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.svc.listSamples({
      schoolId,
      sample,
      status,
      exception,
      start,
      end,
      page,
      pageSize,
    });
  }

  @Post('records')
  createRecord(
    @Body()
    body: {
      schoolId?: string;
      sample: string;
      weight: number;
      imageUrl?: string;
      duration: number;
      by: string;
      cabinet?: string;
    },
  ) {
    return this.svc.createSample(body);
  }

  @Post('device/callback')
  deviceCallback(
    @Body()
    body: {
      schoolId?: string;
      sample: string;
      weight: number;
      imageUrl?: string;
      duration: number;
      by: string;
      cabinet?: string;
    },
  ) {
    return this.svc.deviceCompleted(body);
  }

  @Patch('records/:id/measure')
  setMeasure(@Param('id') id: string, @Body() body: { measure: string }) {
    return this.svc.setSampleMeasure(id, body.measure);
  }

  // Cleanup
  @Get('cleanup')
  listCleanup(
    @Query('schoolId') schoolId?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    return this.svc.listCleanups({ schoolId, page, pageSize });
  }

  @Post('cleanup')
  createCleanup(
    @Body()
    body: {
      schoolId?: string;
      sampleId?: string;
      sample: string;
      weight: number;
      imageUrl?: string;
      method: string;
      by: string;
    },
  ) {
    return this.svc.createCleanup(body);
  }

  @Post('cabinet/callback')
  cabinetCleanup(
    @Body()
    body: {
      schoolId?: string;
      sampleId?: string;
      sample: string;
      weight: number;
      imageUrl?: string;
      by: string;
    },
  ) {
    return this.svc.cabinetCleanupCallback(body);
  }

  // Stream for realtime events
  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.svc.stream();
  }
}
