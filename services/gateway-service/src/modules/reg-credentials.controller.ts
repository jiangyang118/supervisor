import { Controller, Get, Patch, Query, Body, UseGuards } from '@nestjs/common';
import { CredentialsService, EntityType } from './credentials.service';
import { JwtGuard } from './jwt.guard';
import { PermissionGuard } from './permission.guard';
import { Perm } from './perm.decorator';

@Controller('reg/credentials')
@UseGuards(JwtGuard, PermissionGuard)
export class RegCredentialsController {
  constructor(private readonly svc: CredentialsService) {}

  @Get('canteens')
  @Perm('credentials:R')
  canteens(@Query('schoolId') schoolId?: string) {
    return this.svc.listCanteens({ schoolId });
  }
  @Get('workers')
  @Perm('credentials:R')
  workers(@Query('schoolId') schoolId?: string) {
    return this.svc.listWorkers({ schoolId });
  }
  @Get('suppliers')
  @Perm('credentials:R')
  suppliers(@Query('schoolId') schoolId?: string) {
    return this.svc.listSuppliers({ schoolId });
  }
  @Get('exceptions') exceptions(
    @Perm('credentials:R')
    @Query('type') type?: EntityType,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.svc.listExceptions({ type, schoolId });
  }
  @Patch('exceptions/measure')
  @Perm('credentials:U')
  setMeasure(@Query('id') id: string, @Body() b: { measure: string }) {
    return this.svc.setMeasure(id, b.measure);
  }
  @Get('export.csv') exportCsv(
    @Perm('credentials:EX')
    @Query('target') target: 'canteens' | 'workers' | 'suppliers' | 'exceptions' = 'exceptions',
    @Query('type') type?: EntityType,
    @Query('schoolId') schoolId?: string,
  ) {
    let rows: any[] = [];
    if (target === 'canteens') rows = this.svc.listCanteens({ schoolId }) as any;
    else if (target === 'workers') rows = this.svc.listWorkers({ schoolId }) as any;
    else if (target === 'suppliers') rows = this.svc.listSuppliers({ schoolId }) as any;
    else rows = this.svc.listExceptions({ type, schoolId }) as any;
    const csv = this.toCsv(target, rows);
    return { csv };
  }

  private toCsv(target: string, rows: any[]) {
    const enc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    if (target === 'canteens') {
      const header = ['学校ID', '名称', '地址', '许可证到期'];
      return [
        '\ufeff' + header.join(','),
        ...rows.map((r) =>
          [enc(r.schoolId), enc(r.name), enc(r.address || ''), enc(r.licenseExpireAt)].join(','),
        ),
      ].join('\n');
    }
    if (target === 'workers') {
      const header = ['学校ID', '姓名', '岗位', '健康证到期'];
      return [
        '\ufeff' + header.join(','),
        ...rows.map((r) =>
          [enc(r.schoolId), enc(r.name), enc(r.role || ''), enc(r.healthCertExpireAt)].join(','),
        ),
      ].join('\n');
    }
    if (target === 'suppliers') {
      const header = ['学校ID', '名称', '电话', '营业执照到期'];
      return [
        '\ufeff' + header.join(','),
        ...rows.map((r) =>
          [enc(r.schoolId), enc(r.name), enc(r.phone || ''), enc(r.licenseExpireAt)].join(','),
        ),
      ].join('\n');
    }
    // exceptions
    const header = ['学校ID', '类型', '主体', '证件类型', '到期', '处理措施', '记录时间'];
    return [
      '\ufeff' + header.join(','),
      ...rows.map((r) =>
        [
          enc(r.schoolId),
          enc(r.type),
          enc(r.entityName),
          enc(r.certificateType),
          enc(r.expireAt),
          enc(r.measure || ''),
          enc(r.createdAt),
        ].join(','),
      ),
    ].join('\n');
  }
}
