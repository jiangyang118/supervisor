import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SamplingService } from './sampling.service';
import { DisinfectionService } from './disinfection.service';
import { DineService } from './dine.service';
import { WasteService } from './waste.service';
import { JwtGuard } from './jwt.guard';
import { PermissionGuard } from './permission.guard';
import { Perm } from './perm.decorator';

@Controller('reg/ledgers')
@UseGuards(JwtGuard, PermissionGuard)
export class RegLedgersController {
  constructor(
    private readonly sampling: SamplingService,
    private readonly disinfection: DisinfectionService,
    private readonly dine: DineService,
    private readonly waste: WasteService,
  ) {}

  private numId(id: string | number | undefined) {
    if (typeof id === 'number') return id;
    if (!id) return undefined;
    const n = Number(String(id).replace(/\D/g, ''));
    return Number.isFinite(n) ? n : undefined;
  }
  private schools() {
    return [
      { id: 'sch-001', name: '示例一中' },
      { id: 'sch-002', name: '示例二小' },
      { id: 'sch-003', name: '示例三幼' },
      { id: 'sch-004', name: '示例四小' },
      { id: 'sch-005', name: '示例五中' },
    ];
  }


  @Get('sampling')
  @Perm('food_safety:R')
  async samplingList(
    @Query('schoolId') schoolId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ) {
    const schools = schoolId ? [{ id: schoolId }] : this.schools();
    const items = (
      await Promise.all(
        schools.map(async (s) => {
          const res = await this.sampling.listSamples({ schoolId: s.id, start, end, page: 1, pageSize: 100000 });
          return res.items.map((r: any) => ({
            id: r.id,
            schoolId: r.schoolId,
            school: this.schools().find((x) => x.id === r.schoolId)?.name || r.schoolId,
            sample: r.sample,
            weight: r.weight,
            duration: r.duration,
            at: r.at,
          }));
        })
      )
    ).flat();
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const ps = Math.max(parseInt(pageSize, 10) || 50, 1);
    const total = items.length;
    const paged = items.sort((a, b) => (a.at < b.at ? 1 : -1)).slice((p - 1) * ps, p * ps);
    return { items: paged, total, page: p, pageSize: ps };
  }

  @Get('disinfection')
  @Perm('food_safety:R')
  async disinfectionList(
    @Query('schoolId') schoolId?: string,
    @Query('method') method?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ) {
    const schools = schoolId ? [{ id: schoolId }] : this.schools();
    const items = (
      await Promise.all(
        schools.map(async (s) => {
          const res = await this.disinfection.list({ schoolId: s.id, method: method as any, start, end, page: 1, pageSize: 100000 });
          return res.items.map((r: any) => ({
            id: r.id,
            schoolId: r.schoolId,
            school: this.schools().find((x) => x.id === r.schoolId)?.name || r.schoolId,
            method: r.method,
            duration: r.duration,
            items: r.items,
            status: r.exception ? '异常' : '正常',
            at: r.at,
          }));
        })
      )
    ).flat();
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const ps = Math.max(parseInt(pageSize, 10) || 50, 1);
    const total = items.length;
    const paged = items.sort((a, b) => (a.at < b.at ? 1 : -1)).slice((p - 1) * ps, p * ps);
    return { items: paged, total, page: p, pageSize: ps };
  }

  @Get('dine')
  @Perm('food_safety:R')
  async dineList(
    @Query('schoolId') schoolId?: string,
    @Query('meal') meal?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ) {
    const schools = schoolId ? [{ id: schoolId }] : this.schools();
    const items = (
      await Promise.all(
        schools.map(async (s) => {
          const res = await this.dine.list({ schoolId: s.id, meal: meal as any, start, end, page: 1, pageSize: 100000 });
          return res.items.map((r: any) => ({
            id: r.id,
            schoolId: r.schoolId,
            school: this.schools().find((x) => x.id === r.schoolId)?.name || r.schoolId,
            meal: r.meal,
            people: (r.people || []).join(','),
            comment: r.comment || '',
            at: r.at,
          }));
        })
      )
    ).flat();
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const ps = Math.max(parseInt(pageSize, 10) || 50, 1);
    const total = items.length;
    const paged = items.sort((a, b) => (a.at < b.at ? 1 : -1)).slice((p - 1) * ps, p * ps);
    return { items: paged, total, page: p, pageSize: ps };
  }

  @Get('waste')
  @Perm('waste:R')
  async wasteList(
    @Query('schoolId') schoolId?: string,
    @Query('category') category?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ) {
    const schools = schoolId ? [{ id: schoolId }] : this.schools();
    const items = (
      await Promise.all(
        schools.map(async (s) => {
          const catNum = category !== undefined && category !== null && String(category).trim() !== '' ? Number(category) : undefined;
          const res = await this.waste.list({ schoolId: this.numId(s.id), category: catNum, start, end, page: '1', pageSize: '100000' });
          return res.items.map((r: any) => ({
            id: r.id,
            schoolId: r.schoolId,
            school: this.schools().find((x) => this.numId(x.id) === r.schoolId)?.name || r.schoolId,
            date: r.date,
            category: r.category,
            amount: r.amount,
            buyer: r.buyer,
            person: r.person,
          }));
        })
      )
    ).flat();
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const ps = Math.max(parseInt(pageSize, 10) || 50, 1);
    const total = items.length;
    const paged = items.sort((a, b) => (a.date < b.date ? 1 : -1)).slice((p - 1) * ps, p * ps);
    return { items: paged, total, page: p, pageSize: ps };
  }
}
