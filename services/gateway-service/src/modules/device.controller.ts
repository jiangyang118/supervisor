import { Body, Controller, Get, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { DeviceSignGuard } from './device-sign.guard';
import { MorningCheckService } from './morning-check.service';
import { FilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';

@Controller('device')
@UseGuards(DeviceSignGuard)
export class DeviceController {
  constructor(private readonly morning: MorningCheckService) {}

  @Get('morningChecker/employeeList')
  employeeList(@Query('equipmentCode') equipmentCode?: string) {
    const { items } = this.morning.list({ page: 1, pageSize: 100000 });
    const map = new Map<string, any>();
    items.forEach((e: any) => {
      const id = e.staff;
      if (!map.has(id))
        map.set(id, {
          userId: id,
          name: e.staff,
          post: '后厨',
          portraitPhoto: '',
          healthStartTime: '',
          healthEndTime: '',
          healthNumber: '',
          healthUrl: '',
          updateTime: e.at.replace('T', ' '),
        });
    });
    return { success: true, code: 200, data: Array.from(map.values()) };
  }
}
