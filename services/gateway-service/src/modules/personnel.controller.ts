import { Body, Controller, Get, Post, Patch, Query, BadRequestException } from '@nestjs/common';
import { PersonnelRepository } from './repositories/personnel.repository';

@Controller('school/personnel')
export class PersonnelController {
  constructor(private readonly repo: PersonnelRepository) {}

  @Get()
  async list(
    @Query('schoolId') schoolId?: string,
    @Query('name') name?: string,
    @Query('phone') phone?: string,
    @Query('canteenId') canteenId?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    const sid = schoolId && String(schoolId).trim() !== '' ? Number(schoolId) : 1;
    const cid = canteenId && String(canteenId).trim() !== '' ? Number(canteenId) : undefined;
    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.max(1, parseInt(pageSize, 10) || 20);
    const res = await this.repo.list({ schoolId: sid, name, phone, canteenId: cid as any, page: p, pageSize: ps });
    const now = Date.now();
    const in30 = now + 30 * 24 * 3600 * 1000;
    const items = (res.items || []).map((r: any) => {
      const exp = r.healthCertExpireAt ? Date.parse(r.healthCertExpireAt) : NaN;
      let status = '有效';
      if (Number.isFinite(exp)) {
        if (exp < now) status = '过期';
        else if (exp <= in30) status = '临期';
      }
      return { ...r, status };
    });
    return { ...res, items };
  }

  @Post()
  async create(
    @Body()
    b: {
      schoolId?: number; canteenId?: number; name: string; gender?: '男'|'女'; phone?: string; jobTitle?: string;
      healthCertNo?: string; healthCertAuthority?: string; healthCertIssueAt?: string; healthCertExpireAt?: string;
      healthCertFrontUrl?: string; healthCertBackUrl?: string; enabled?: boolean;
    },
  ) {
    if (!b?.name) throw new BadRequestException('name required');
    if (!b?.healthCertFrontUrl || !b?.healthCertBackUrl) throw new BadRequestException('health cert images required');
    const sid = b.schoolId && Number.isFinite(Number(b.schoolId)) ? Number(b.schoolId) : 1;
    const id = await this.repo.insert({
      schoolId: sid,
      canteenId: b.canteenId,
      name: b.name,
      gender: b.gender as any,
      phone: b.phone,
      jobTitle: b.jobTitle,
      healthCertNo: b.healthCertNo,
      healthCertAuthority: b.healthCertAuthority,
      healthCertIssueAt: b.healthCertIssueAt,
      healthCertExpireAt: b.healthCertExpireAt,
      healthCertFrontUrl: b.healthCertFrontUrl,
      healthCertBackUrl: b.healthCertBackUrl,
      enabled: b.enabled ? 1 : 1,
      createdAt: '' as any,
      updatedAt: '' as any,
    } as any);
    return { id };
  }

  @Patch()
  async update(
    @Query('id') id?: string,
    @Body() b?: Partial<{
      canteenId?: number; name?: string; gender?: '男'|'女'; phone?: string; jobTitle?: string;
      healthCertNo?: string; healthCertAuthority?: string; healthCertIssueAt?: string; healthCertExpireAt?: string;
      healthCertFrontUrl?: string; healthCertBackUrl?: string; enabled?: boolean;
    }>,
  ) {
    if (!id || !Number.isFinite(Number(id))) throw new BadRequestException('id required');
    await this.repo.update(Number(id), b || {});
    return { ok: true } as any;
  }

  @Post('delete')
  async remove(@Body() body: { id?: number }) {
    if (!body?.id) throw new BadRequestException('id required');
    await this.repo.remove(Number(body.id));
    return { ok: true } as any;
  }

  @Get('detail')
  async detail(@Query('id') id?: string) {
    if (!id || !Number.isFinite(Number(id))) throw new BadRequestException('id required');
    return this.repo.getById(Number(id));
  }
}
