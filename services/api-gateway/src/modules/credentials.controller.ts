import { Controller, Get, Post, Patch, Body, Query, Param, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CredentialsService, EntityType } from './credentials.service';

@Controller('school/credentials')
export class CredentialsController {
  constructor(private readonly svc: CredentialsService) {}

  // Canteens
  @Get('canteens') listCanteens(){ return this.svc.listCanteens(); }
  @Post('canteens') createCanteen(@Body() b: { name: string; address?: string; licenseExpireAt: string }){ return this.svc.createCanteen(b); }

  // Workers
  @Get('workers') listWorkers(){ return this.svc.listWorkers(); }
  @Post('workers') createWorker(@Body() b: { name: string; role?: string; healthCertExpireAt: string }){ return this.svc.createWorker(b); }

  // Suppliers
  @Get('suppliers') listSuppliers(){ return this.svc.listSuppliers(); }
  @Post('suppliers') createSupplier(@Body() b: { name: string; phone?: string; licenseExpireAt: string }){ return this.svc.createSupplier(b); }

  // Exceptions and measures
  @Get('exceptions') listExceptions(@Query('type') type?: EntityType){ return this.svc.listExceptions({ type }); }
  @Patch('exceptions/:id/measure') setMeasure(@Param('id') id: string, @Body() b: { measure: string }){ return this.svc.setMeasure(id, b.measure); }

  @Sse('stream') stream(): Observable<MessageEvent> { return this.svc.stream(); }
}

