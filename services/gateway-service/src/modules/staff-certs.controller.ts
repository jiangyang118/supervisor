import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { StaffCertsService } from './staff-certs.service';

@Controller('school/staff-certs')
export class StaffCertsController {
  constructor(private readonly svc: StaffCertsService) {}

  @Get()
  list(
    @Query('schoolId') schoolId?: string,
    @Query('staffId') staffId?: string,
    @Query('q') q?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.svc.list({ schoolId, staffId, q, page, pageSize });
  }

  @Post()
  create(
    @Body() b: { schoolId?: number | string; staffId?: number | string; certNo?: string; startAt?: string; endAt?: string; imageUrl?: string },
  ) {
    return this.svc.create(b);
  }

  @Patch()
  update(
    @Query('id') id: string,
    @Body() b: { certNo?: string; startAt?: string; endAt?: string; imageUrl?: string },
  ) {
    return this.svc.update(id, b);
  }

  @Post('delete')
  delete(@Body() b: { id: string }) {
    return this.svc.delete(b.id);
  }
}

