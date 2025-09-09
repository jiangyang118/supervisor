import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SamplingService } from './sampling.service';
import { DisinfectionService } from './disinfection.service';
import { DineService } from './dine.service';
import { WasteService } from './waste.service';
import { TrainingService } from './training.service';
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
    private readonly training: TrainingService,
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

  // Training Courses (by school)
  @Get('training')
  @Perm('training:R')
  trainingCourses(
    @Query('schoolId') schoolId?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ) {
    const schools = schoolId ? [{ id: schoolId }] : this.schools();
    const items = schools.flatMap((s) =>
      this.training.listCourses({ schoolId: s.id }).map((c) => ({
        id: c.id,
        schoolId: c.schoolId,
        school: this.schools().find((x) => x.id === c.schoolId)?.name || c.schoolId,
        title: c.title,
        status: c.status,
        createdAt: c.createdAt,
      })),
    );
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const ps = Math.max(parseInt(pageSize, 10) || 50, 1);
    const total = items.length;
    const paged = items
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice((p - 1) * ps, p * ps);
    return { items: paged, total, page: p, pageSize: ps };
  }

  // Exams (by school)
  @Get('exams')
  @Perm('training:R')
  trainingExams(
    @Query('schoolId') schoolId?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ) {
    const schools = schoolId ? [{ id: schoolId }] : this.schools();
    const items = schools.flatMap((s) => {
      const courseMap = new Map(
        this.training.listCourses({ schoolId: s.id }).map((c) => [c.id, c.title] as const),
      );
      return this.training.listExams({ schoolId: s.id }).map((e) => ({
        id: e.id,
        schoolId: e.schoolId || s.id,
        school:
          this.schools().find((x) => x.id === (e.schoolId || s.id))?.name || e.schoolId || s.id,
        title: e.title,
        courseId: e.courseId || '',
        courseTitle: (e.courseId && courseMap.get(e.courseId)) || '',
        passScore: e.passScore,
        status: e.status,
        createdAt: e.createdAt,
      }));
    });
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const ps = Math.max(parseInt(pageSize, 10) || 50, 1);
    const total = items.length;
    const paged = items
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice((p - 1) * ps, p * ps);
    return { items: paged, total, page: p, pageSize: ps };
  }

  @Get('training/export.csv')
  @Perm('training:EX')
  exportTrainingCsv(@Query('schoolId') schoolId?: string) {
    const { items } = this.trainingCourses(schoolId, '1', '100000');
    const headers = ['id', 'schoolId', 'school', 'title', 'status', 'createdAt'];
    const rows = items.map((r: any) => [
      r.id,
      r.schoolId,
      r.school,
      r.title,
      r.status,
      r.createdAt,
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return { csv };
  }

  @Get('exams/export.csv')
  @Perm('training:EX')
  exportExamsCsv(@Query('schoolId') schoolId?: string) {
    const { items } = this.trainingExams(schoolId, '1', '100000');
    const headers = ['id', 'schoolId', 'school', 'title', 'passScore', 'status', 'createdAt'];
    const rows = items.map((r: any) => [
      r.id,
      r.schoolId,
      r.school,
      r.title,
      r.passScore,
      r.status,
      r.createdAt,
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return { csv };
  }

  // Results (by school)
  @Get('results')
  @Perm('training:R')
  resultsList(
    @Query('schoolId') schoolId?: string,
    @Query('examId') examId?: string,
    @Query('user') user?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ) {
    const schools = schoolId ? [{ id: schoolId }] : this.schools();
    const items = schools.flatMap((s) =>
      this.training.listResults({ schoolId: s.id, examId, user }).map((r) => ({
        id: r.id,
        schoolId: r.schoolId || s.id,
        school:
          this.schools().find((x) => x.id === (r.schoolId || s.id))?.name || r.schoolId || s.id,
        examId: r.examId,
        user: r.user,
        score: r.score,
        passed: r.passed ? '合格' : '不合格',
        submittedAt: r.submittedAt,
      })),
    );
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const ps = Math.max(parseInt(pageSize, 10) || 50, 1);
    const total = items.length;
    const paged = items
      .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))
      .slice((p - 1) * ps, p * ps);
    return { items: paged, total, page: p, pageSize: ps };
  }

  @Get('results/export.csv')
  @Perm('training:EX')
  resultsExportCsv(
    @Query('schoolId') schoolId?: string,
    @Query('examId') examId?: string,
    @Query('user') user?: string,
  ) {
    const { items } = this.resultsList(schoolId, examId, user, '1', '100000');
    const headers = [
      'id',
      'schoolId',
      'school',
      'examId',
      'user',
      'score',
      'passed',
      'submittedAt',
    ];
    const rows = items.map((r: any) => [
      r.id,
      r.schoolId,
      r.school,
      r.examId,
      r.user,
      r.score,
      r.passed,
      r.submittedAt,
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return { csv };
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
          const res = await this.waste.list({ schoolId: this.numId(s.id), category, start, end, page: '1', pageSize: '100000' });
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
