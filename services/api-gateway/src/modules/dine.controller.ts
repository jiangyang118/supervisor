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
import { DineService, Meal } from './dine.service';

@Controller('school/dine')
export class DineController {
  constructor(private readonly svc: DineService) {}

  @Get('records')
  list(
    @Query('schoolId') schoolId?: string,
    @Query('meal') meal?: Meal,
    @Query('exception') exception?: 'true' | 'false',
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.svc.list({ schoolId, meal, exception, start, end, page, pageSize });
  }

  @Post('records')
  create(
    @Body()
    body: {
      schoolId?: string;
      meal: Meal;
      people: string[];
      imageUrl?: string;
      comment?: string;
    },
  ) {
    return this.svc.create(body);
  }

  @Post('camera/callback')
  camera(
    @Body()
    body: {
      schoolId?: string;
      meal: Meal;
      people: string[];
      imageUrl: string;
      comment?: string;
    },
  ) {
    return this.svc.cameraCallback(body);
  }

  @Patch('records/:id/measure')
  setMeasure(@Param('id') id: string, @Body() body: { measure: string }) {
    return this.svc.setMeasure(id, body.measure);
  }

  // QR
  @Post('qr/create')
  createQr(@Body() body: { schoolId?: string; meal: Meal }) {
    return this.svc.createQr(body);
  }

  @Post('qr/submit')
  submitQr(@Body() body: { token: string; people: string[]; imageUrl?: string; comment?: string }) {
    return this.svc.submitQr(body);
  }

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.svc.stream();
  }
}
