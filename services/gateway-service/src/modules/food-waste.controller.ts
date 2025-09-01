import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { FoodWasteService, WasteSource, ItemType } from './food-waste.service';

@Controller('school/food-waste')
export class FoodWasteController {
  constructor(private readonly svc: FoodWasteService) {}

  @Get('records')
  list(
    @Query('schoolId') schoolId?: string,
    @Query('source') source?: WasteSource,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '50',
  ) {
    return this.svc.listRecords({ schoolId, source, start, end, page, pageSize });
  }

  @Post('records')
  create(
    @Body()
    b: {
      schoolId?: string;
      date?: string;
      source: WasteSource;
      itemType: ItemType;
      itemName: string;
      weightKg: number;
      amountYuan: number;
      reason?: string;
    },
  ) {
    return this.svc.createRecord(b);
  }

  @Get('summary')
  summary(
    @Query('schoolId') schoolId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.svc.summary({ schoolId, start, end });
  }

  // Reasons management
  @Get('reasons') reasons() {
    return this.svc.listReasons();
  }
  @Post('reasons') createReason(@Body() b: { name: string }) {
    return this.svc.createReason(b.name);
  }
  @Post('reasons/enable') setReasonEnabled(@Body() b: { id: string; enabled: boolean }) {
    return this.svc.setReasonEnabled(b.id, b.enabled);
  }
  @Post('reasons/delete') deleteReason(@Body() b: { id: string }) {
    return this.svc.deleteReason(b.id);
  }
}
