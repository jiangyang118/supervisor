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
import { DisinfectionService, DisinfectionMethod } from './disinfection.service';

@Controller('school/disinfection')
export class DisinfectionController {
  constructor(private readonly svc: DisinfectionService) {}

  @Get('records')
  list(
    @Query('schoolId') schoolId?: string,
    @Query('method') method?: DisinfectionMethod,
    @Query('exception') exception?: 'true' | 'false',
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.svc.list({ schoolId, method, exception, start, end, page, pageSize });
  }

  @Post('records')
  create(
    @Body()
    body: {
      schoolId?: string;
      method: DisinfectionMethod;
      duration: number;
      items: string;
      imageUrl?: string;
    },
  ) {
    return this.svc.create(body);
  }

  @Post('device/callback')
  device(
    @Body()
    body: {
      schoolId?: string;
      method: DisinfectionMethod;
      duration: number;
      items: string;
      imageUrl?: string;
    },
  ) {
    return this.svc.deviceCallback(body);
  }

  @Patch('records/:id/measure')
  setMeasure(@Param('id') id: string, @Body() body: { measure: string }) {
    return this.svc.setMeasure(id, body.measure);
  }

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.svc.stream();
  }
}
