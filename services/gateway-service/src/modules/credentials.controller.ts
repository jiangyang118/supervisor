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
import { CredentialsService, EntityType } from './credentials.service';

@Controller('school/credentials')
export class CredentialsController {
  constructor(private readonly svc: CredentialsService) {}

  // Canteens
  @Get('canteens') listCanteens(@Query('schoolId') schoolId?: string) {
    return this.svc.listCanteens({ schoolId });
  }
  @Post('canteens') createCanteen(
    @Body() b: { name: string; address?: string; licenseExpireAt: string },
  ) {
    return this.svc.createCanteen(b);
  }

  // Workers
  @Get('workers') listWorkers(@Query('schoolId') schoolId?: string) {
    return this.svc.listWorkers({ schoolId });
  }
  @Post('workers') createWorker(
    @Body() b: { name: string; role?: string; healthCertExpireAt: string },
  ) {
    return this.svc.createWorker(b);
  }

  // Suppliers
  @Get('suppliers') listSuppliers(@Query('schoolId') schoolId?: string) {
    return this.svc.listSuppliers({ schoolId });
  }
  @Post('suppliers') createSupplier(
    @Body() b: { name: string; phone?: string; licenseExpireAt: string },
  ) {
    return this.svc.createSupplier(b);
  }

  // Exceptions and measures
  @Get('exceptions') listExceptions(
    @Query('type') type?: EntityType,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.svc.listExceptions({ type, schoolId });
  }
  @Patch('exceptions/:id/measure') setMeasure(
    @Param('id') id: string,
    @Body() b: { measure: string },
  ) {
    return this.svc.setMeasure(id, b.measure);
  }

  @Sse('stream') stream(): Observable<MessageEvent> {
    return this.svc.stream();
  }
}
