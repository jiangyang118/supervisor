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
      canteenId?: number;
      method: DisinfectionMethod;
      duration: number;
      items: string;
      temperature?: number;
      responsible?: string;
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
      canteenId?: number;
      method: DisinfectionMethod;
      duration: number;
      items: string;
      temperature?: number;
      responsible?: string;
      imageUrl?: string;
    },
  ) {
    return this.svc.deviceCallback(body as any);
  }

  @Patch('records/:id/measure')
  setMeasure(@Param('id') id: string, @Body() body: { measure: string }) {
    return this.svc.setMeasure(id, body.measure);
  }

  @Get('records/:id')
  detail(@Param('id') id: string) {
    return this.svc.getDetail(id);
  }

  @Post('records/import')
  async import(@Body() body: any) {
    // Accept either { items: [...] } JSON array or raw CSV text with header: canteenId,method,duration,temperature,items,responsible,imageUrl
    if (Array.isArray(body?.items)) return this.svc.import(body.items);
    if (typeof body === 'string') {
      const lines = (body as string).split(/\r?\n/).filter((l) => l.trim());
      const [header, ...rest] = lines;
      const cols = header.split(',').map((s) => s.trim());
      const items = rest.map((line) => {
        const vals = line.split(',').map((s) => s.replace(/^"|"$/g, '').replace(/""/g, '"'));
        const obj: any = {};
        cols.forEach((c, i) => (obj[c] = vals[i]));
        return obj;
      });
      return this.svc.import(items as any[]);
    }
    return { count: 0 } as any;
  }

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.svc.stream();
  }
}
