import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FoodWasteService, WasteSource } from './food-waste.service';
import { JwtGuard } from './jwt.guard';
import { PermissionGuard } from './permission.guard';
import { Perm } from './perm.decorator';

@Controller('reg/food-waste')
@UseGuards(JwtGuard, PermissionGuard)
export class RegFoodWasteController {
  constructor(private readonly svc: FoodWasteService) {}

  private schools() {
    return [
      { id: 'sch-001', name: '示例一中' },
      { id: 'sch-002', name: '示例二小' },
      { id: 'sch-003', name: '示例三幼' },
      { id: 'sch-004', name: '示例四小' },
      { id: 'sch-005', name: '示例五中' },
    ];
  }

  @Get('ranking')
  @Perm('food_waste:R')
  ranking(
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('metric') metric: 'weight' | 'amount' = 'weight',
  ) {
    // get all records in range
    const { items } = this.svc.listRecords({ start, end, page: 1, pageSize: 100000 });
    const agg = new Map<
      string,
      { schoolId: string; school: string; weightKg: number; amountYuan: number }
    >();
    for (const r of items) {
      const id = r.schoolId;
      const name = this.schools().find((s) => s.id === id)?.name || id;
      const cur = agg.get(id) || { schoolId: id, school: name, weightKg: 0, amountYuan: 0 };
      cur.weightKg += r.weightKg;
      cur.amountYuan += r.amountYuan;
      agg.set(id, cur);
    }
    const arr = Array.from(agg.values());
    arr.sort((a, b) =>
      metric === 'amount' ? b.amountYuan - a.amountYuan : b.weightKg - a.weightKg,
    );
    return arr;
  }

  @Get('details')
  @Perm('food_waste:R')
  details(
    @Query('schoolId') schoolId?: string,
    @Query('source') source?: WasteSource,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ) {
    const res = this.svc.listRecords({ schoolId, source, start, end, page, pageSize });
    const items = res.items.map((r) => ({
      id: r.id,
      date: r.date,
      schoolId: r.schoolId,
      school: this.schools().find((s) => s.id === r.schoolId)?.name || r.schoolId,
      source: r.source,
      itemType: r.itemType,
      itemName: r.itemName,
      weightKg: r.weightKg,
      amountYuan: r.amountYuan,
      reason: r.reason || '',
      meal: r.meal || '',
    }));
    return { ...res, items };
  }

  @Get('details/export.csv')
  @Perm('food_waste:EX')
  exportDetails(
    @Query('schoolId') schoolId?: string,
    @Query('source') source?: WasteSource,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { items } = this.details(schoolId, source, start, end, '1', '100000');
    const headers = [
      'date',
      'schoolId',
      'school',
      'source',
      'itemType',
      'itemName',
      'weightKg',
      'amountYuan',
      'reason',
      'meal',
    ];
    const rows = (items as any[]).map((r) => [
      r.date,
      r.schoolId,
      r.school,
      r.source,
      r.itemType,
      r.itemName,
      r.weightKg,
      r.amountYuan,
      r.reason,
      r.meal,
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return { csv };
  }

  @Get('ranking/export.csv')
  @Perm('food_waste:EX')
  exportRanking(
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('metric') metric: 'weight' | 'amount' = 'weight',
  ) {
    const rows = this.ranking(start, end, metric as any) as any[];
    const headers = ['schoolId', 'school', 'weightKg', 'amountYuan'];
    const data = rows.map((r) => [r.schoolId, r.school, r.weightKg, r.amountYuan]);
    const csv = [
      headers.join(','),
      ...data.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return { csv };
  }

  @Get('summary')
  @Perm('food_waste:R')
  summary(
    @Query('schoolId') schoolId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { items } = this.svc.listRecords({ schoolId, start, end, page: 1, pageSize: 100000 });
    const bySource = new Map<string, { source: string; weightKg: number; amountYuan: number }>();
    const byReason = new Map<string, { reason: string; weightKg: number; amountYuan: number }>();
    let totalWeight = 0;
    let totalAmount = 0;
    for (const r of items) {
      totalWeight += r.weightKg;
      totalAmount += r.amountYuan;
      const s = bySource.get(r.source) || { source: r.source, weightKg: 0, amountYuan: 0 };
      s.weightKg += r.weightKg;
      s.amountYuan += r.amountYuan;
      bySource.set(r.source, s);
      if (r.reason) {
        const m = byReason.get(r.reason) || { reason: r.reason, weightKg: 0, amountYuan: 0 };
        m.weightKg += r.weightKg;
        m.amountYuan += r.amountYuan;
        byReason.set(r.reason, m);
      }
    }
    return {
      total: { weightKg: totalWeight, amountYuan: totalAmount },
      bySource: Array.from(bySource.values()),
      byReason: Array.from(byReason.values()),
    };
  }

  @Get('trend')
  @Perm('food_waste:R')
  trend(
    @Query('schoolId') schoolId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('bucket') bucket: 'day' | 'week' | 'month' = 'day',
  ) {
    const { items } = this.svc.listRecords({ schoolId, start, end, page: 1, pageSize: 100000 });
    function keyOf(dateIso: string) {
      const d = new Date(dateIso);
      if (bucket === 'day') return d.toISOString().slice(0, 10);
      if (bucket === 'week') {
        const onejan = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil(
          (((d as any) - (onejan as any)) / 86400000 + onejan.getDay() + 1) / 7,
        );
        return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
      }
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    const map = new Map<string, { period: string; weightKg: number; amountYuan: number }>();
    for (const r of items) {
      const k = keyOf(r.date);
      const cur = map.get(k) || { period: k, weightKg: 0, amountYuan: 0 };
      cur.weightKg += r.weightKg;
      cur.amountYuan += r.amountYuan;
      map.set(k, cur);
    }
    return Array.from(map.values()).sort((a, b) => (a.period < b.period ? -1 : 1));
  }
}
