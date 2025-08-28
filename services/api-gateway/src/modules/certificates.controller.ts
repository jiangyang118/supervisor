import { Body, Controller, Get, Post, Patch, Query } from '@nestjs/common';
import { CertificatesService } from './certificates.service';

@Controller('school/certificates')
export class CertificatesController {
  constructor(private readonly svc: CertificatesService) {}

  @Get()
  list(
    @Query('owner') owner?: string,
    @Query('type') type?: string,
    @Query('status') status?: '有效' | '过期',
  ) {
    return this.svc.list({ owner, type, status });
  }

  @Post()
  create(@Body() b: { owner: string; type: string; number: string; expireAt: string }) {
    return this.svc.create(b);
  }

  @Patch()
  update(
    @Query('id') id: string,
    @Body() b: { owner?: string; type?: string; number?: string; expireAt?: string },
  ) {
    return this.svc.update(id, b);
  }

  @Post('delete')
  delete(@Body() b: { id: string }) {
    return this.svc.delete(b.id);
  }

  @Get('export.csv')
  exportCsv(
    @Query('owner') owner?: string,
    @Query('type') type?: string,
    @Query('status') status?: '有效' | '过期',
  ) {
    const items = this.svc.list({ owner, type, status });
    const headers = ['id', 'owner', 'type', 'number', 'expireAt', 'status'];
    const rows = items.map((r: any) => [r.id, r.owner, r.type, r.number, r.expireAt, r.status]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return { csv };
  }
}
