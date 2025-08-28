import { Controller, Get, Query } from '@nestjs/common';
import { DevicesService } from './devices.service';

@Controller('school/devices')
export class DevicesController {
  constructor(private readonly svc: DevicesService) {}

  @Get()
  list(
    @Query('schoolId') schoolId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
  ) {
    return this.svc.list({ schoolId, type, status, q });
  }

  @Get('types') types() {
    return this.svc.types();
  }
  @Get('statuses') statuses() {
    return this.svc.statuses();
  }
}
