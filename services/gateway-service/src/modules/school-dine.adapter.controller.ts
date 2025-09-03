import { Controller, Get, Query, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DineService, Meal } from './dine.service';
import { MealTypeEnum, MealTypeLabel } from '../enums/meal-type.enum';

function mealFromKey(key?: string): Meal | undefined {
  if (!key) return undefined;
  const upper = String(key).toUpperCase();
  if (!(upper in MealTypeEnum)) return undefined;
  const code = (MealTypeEnum as any)[upper] as number | undefined;
  if (!code) return undefined;
  const label = (MealTypeLabel as any)[code] as string | undefined;
  if (label === '早餐' || label === '午餐' || label === '晚餐') return label as Meal;
  return undefined;
}

// Adapter to support legacy/frontend path `/api/school/dine/*`
@Controller('api/school/dine')
export class DineApiAdapterController {
  constructor(private readonly svc: DineService) {}

  @Get('records')
  list(
    @Query('schoolId') schoolId?: string,
    // In adapter, `meal` carries enum key like BREAKFAST/LUNCH/DINNER
    @Query('meal') meal?: string,
    @Query('exception') exception?: 'true' | 'false',
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    const mapped = mealFromKey(meal) || (meal as any);
    return this.svc.list({ schoolId, meal: mapped as Meal, exception, start, end, page, pageSize });
  }

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.svc.stream();
  }
}
