import { Controller, Get, Res, Query, UseGuards } from '@nestjs/common';
import { JwtGuard } from './jwt.guard';
import { PermissionGuard } from './permission.guard';
import { Perm } from './perm.decorator';
import { MorningCheckService } from './morning-check.service';
import { SamplingService } from './sampling.service';
import { DisinfectionService } from './disinfection.service';
import { DineService } from './dine.service';
import { WasteService } from './waste.service';
import { SchoolsRepository } from './repositories/schools.repository';
// 使用 any 避免本地缺少 @types/express 造成编译失败

@Controller('reg/reports')
@UseGuards(JwtGuard, PermissionGuard)
export class ReportsController {
  constructor(
    private readonly morning: MorningCheckService,
    private readonly sampling: SamplingService,
    private readonly disinfection: DisinfectionService,
    private readonly dine: DineService,
    private readonly waste: WasteService,
    private readonly schoolsRepo: SchoolsRepository,
  ) {}

  private numId(id: string | number | undefined) {
    if (typeof id === 'number') return id;
    if (!id) return undefined;
    const n = Number(String(id).replace(/\D/g, ''));
    return Number.isFinite(n) ? n : undefined;
  }
  private async schoolList(filterId?: number) {
    try {
      const list = await this.schoolsRepo.listAll(true);
      const arr = (list || []).map((s) => ({ id: s.id, name: s.name }));
      return filterId ? arr.filter((s) => s.id === filterId) : arr;
    } catch {
      // DB not configured -> empty list, regulator report will be empty
      return [] as Array<{ id: number; name: string }>;
    }
  }

  private async buildDailyRows(start?: string, end?: string, schoolId?: string) {
    const sid = this.numId(schoolId);
    const schools = await this.schoolList(sid);
    const s = start; const e = end;
    const rows = await Promise.all(
      schools.map(async (sc) => {
        const morningRes = await this.morning.list({ schoolId: String(sc.id), start: s, end: e, page: 1, pageSize: 100000 });
        const samplingRes = await this.sampling.listSamples({ schoolId: String(sc.id), start: s, end: e, page: 1, pageSize: 100000 });
        const disinfectionRes = await this.disinfection.list({ schoolId: String(sc.id), start: s, end: e, page: 1, pageSize: 100000 });
        const dineRes = await this.dine.list({ schoolId: String(sc.id), start: s, end: e, page: 1, pageSize: 100000 });
        const wasteRes = await this.waste.list({ schoolId: sc.id, start: s, end: e, page: '1', pageSize: '100000' });
        return {
          schoolId: sc.id,
          school: sc.name,
          morning: morningRes.total,
          sampling: samplingRes.total,
          disinfection: disinfectionRes.total,
          dine: dineRes.total,
          waste: wasteRes.total,
        };
      }),
    );
    const totalSchools = rows.length;
    const sum = (k: keyof (typeof rows)[number]) => rows.reduce((acc, r) => acc + Number(r[k] || 0), 0);
    const morningReported = rows.filter((r) => r.morning > 0).length;
    const samplingReported = rows.filter((r) => r.sampling > 0).length;
    const disinfectionReported = rows.filter((r) => r.disinfection > 0).length;
    const dineReported = rows.filter((r) => r.dine > 0).length;
    const wasteReported = rows.filter((r) => r.waste > 0).length;
    const summary = {
      schools: totalSchools,
      totals: { morning: sum('morning'), sampling: sum('sampling'), disinfection: sum('disinfection'), dine: sum('dine'), waste: sum('waste') },
      missing: {
        morning: totalSchools - morningReported,
        sampling: totalSchools - samplingReported,
        disinfection: totalSchools - disinfectionReported,
        dine: totalSchools - dineReported,
        waste: totalSchools - wasteReported,
      },
    };
    return { rows, summary };
  }

  @Get('daily')
  @Perm('report:R')
  async daily(
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.buildDailyRows(start, end, schoolId);
  }
  @Get('export')
  @Perm('report:EX')
  async export(
    @Query('format') format = 'csv',
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('schoolId') schoolId?: string,
    @Res() res?: { setHeader: (k: string, v: string) => void; send: (b: unknown) => unknown },
  ) {
    const { rows, summary } = await this.buildDailyRows(start, end, schoolId);
    if (format === 'pdf') {
      const content = Buffer.from(`%PDF-1.4\n% Placeholder daily PDF (implement template rendering as needed)`);
      res!.setHeader('Content-Type', 'application/pdf');
      res!.setHeader('Content-Disposition', 'attachment; filename="daily-report.pdf"');
      return res!.send(content);
    }
    const header = '学校,晨检,留样,消毒,陪餐,废弃物\n';
    const body = rows.map((r) => `${r.school},${r.morning},${r.sampling},${r.disinfection},${r.dine},${r.waste}`).join('\n');
    const footer = `\n合计,${summary.totals.morning},${summary.totals.sampling},${summary.totals.disinfection},${summary.totals.dine},${summary.totals.waste}`;
    const csv = '﻿' + header + body + footer;
    res!.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res!.setHeader('Content-Disposition', 'attachment; filename="daily-report.csv"');
    return res!.send(csv);
  }
}
