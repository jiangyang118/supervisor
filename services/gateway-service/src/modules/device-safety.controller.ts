import { Body, Controller, Get, Post, Patch, Param, Query } from '@nestjs/common';
import { DeviceSafetyService } from './device-safety.service';

@Controller('school/device-safety')
export class DeviceSafetyController {
  constructor(private readonly svc: DeviceSafetyService) {}

  @Get()
  list(
    @Query('schoolId') schoolId?: string,
    @Query('canteenId') canteenId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.svc.list({ schoolId, canteenId, start, end, page, pageSize });
  }

  @Post()
  create(
    @Body()
    body: {
      schoolId?: number | string;
      canteenId?: number | string;
      deviceName: string;
      items: string[];
      result: '正常' | '异常';
      description?: string;
      measures?: string;
      handler?: string;
      imageUrl?: string;
      signatureData?: string;
      checkDate: string;
    },
  ) {
    return this.svc.create(body);
  }

  @Get('detail')
  detail(@Query('id') id: string) {
    return this.svc.detail(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      canteenId?: number | string | null;
      deviceName?: string;
      items?: string[];
      result?: '正常' | '异常';
      description?: string | null;
      measures?: string | null;
      handler?: string | null;
      imageUrl?: string | null;
      signatureData?: string | null;
      checkDate?: string;
    },
  ) {
    return this.svc.update(id, body as any);
  }
}
