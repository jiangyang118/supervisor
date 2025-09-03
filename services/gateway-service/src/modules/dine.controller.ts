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
import { DineService, Meal, MEALS } from './dine.service';
import { MealTypeEnum, MealTypeLabel } from '../enums/meal-type.enum';

function mealFromCode(code?: string | number): Meal | undefined {
  if (code === undefined || code === null || code === '' as any) return undefined;
  const n = typeof code === 'number' ? code : parseInt(String(code), 10);
  if (!Number.isFinite(n)) return undefined;
  const label = (MealTypeLabel as any)[n] as string | undefined;
  if (label === '早餐' || label === '午餐' || label === '晚餐') return label as Meal;
  return undefined;
}

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

@Controller('school/dine')
export class DineController {
  constructor(private readonly svc: DineService) {}

  @Get('records')
  list(
    @Query('schoolId') schoolId?: string,
    @Query('meal') meal?: Meal,
    @Query('mealCode') mealCode?: string,
    @Query('mealKey') mealKey?: string,
    @Query('exception') exception?: 'true' | 'false',
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    const mapped = mealFromCode(mealCode) || mealFromKey(mealKey) || meal;
    return this.svc.list({ schoolId, meal: mapped, exception, start, end, page, pageSize });
  }

  // Meals enumeration
  @Get('meals')
  meals() {
    return { items: MEALS } as any;
  }

  // Meals enumeration (key/value)
  @Get('meal-options')
  mealOptions() {
    const items = Object.keys(MealTypeEnum)
      .filter((k) => isNaN(Number(k)))
      .map((k) => {
        const value = (MealTypeEnum as any)[k] as number;
        const label = MealTypeLabel[value as MealTypeEnum];
        return { key: k, value, label };
      });
    return { items } as any;
  }

  @Post('records')
  create(
    @Body()
    body: {
      schoolId?: string;
      meal?: Meal;
      mealCode?: number;
      mealKey?: string;
      people: string[];
      imageUrl?: string;
      comment?: string;
    },
  ) {
    const meal = mealFromCode(body.mealCode) || mealFromKey(body.mealKey) || body.meal;
    return this.svc.create({ ...body, meal: meal as Meal });
  }

  @Post('camera/callback')
  camera(
    @Body()
    body: {
      schoolId?: string;
      meal?: Meal;
      mealCode?: number;
      mealKey?: string;
      people: string[];
      imageUrl: string;
      comment?: string;
    },
  ) {
    const meal = mealFromCode(body.mealCode) || mealFromKey(body.mealKey) || body.meal;
    return this.svc.cameraCallback({ ...body, meal: meal as Meal });
  }

  @Patch('records/:id/measure')
  setMeasure(@Param('id') id: string, @Body() body: { measure: string }) {
    return this.svc.setMeasure(id, body.measure);
  }

  // QR
  @Post('qr/create')
  createQr(@Body() body: { schoolId?: string; meal?: Meal; mealCode?: number; mealKey?: string }) {
    const meal = mealFromCode(body.mealCode) || mealFromKey(body.mealKey) || body.meal || '午餐';
    return this.svc.createQr({ schoolId: body.schoolId, meal: meal as Meal });
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
