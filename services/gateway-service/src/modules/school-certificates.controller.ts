import { Body, Controller, Get, Post, Patch, Query, BadRequestException } from '@nestjs/common';
import { CertificatesService } from './certificates.service';

@Controller('school/certificates')
export class SchoolCertificatesController {
  constructor(private readonly svc: CertificatesService) {}

  @Get()
  async list(
    @Query('schoolId') schoolId?: string,
    @Query('owner') owner?: string,
    @Query('type') type?: string,
    @Query('status') status?: '有效' | '过期',
  ) {
    return this.svc.list({ schoolId, owner, type, status });
  }

  @Post()
  async create(
    @Body() b: { schoolId?: number | string; owner: string; type: string; number: string; expireAt: string },
  ) {
    return this.svc.create(b);
  }

  @Patch()
  async update(
    @Query('id') id?: string,
    @Body() b?: { owner?: string; type?: string; number?: string; expireAt?: string },
  ) {
    if (!id) throw new BadRequestException('id required');
    return this.svc.update(id, b || {});
  }

  @Post('delete')
  async remove(@Body() body: { id?: number | string }) {
    if (!body?.id) throw new BadRequestException('id required');
    return this.svc.delete(body.id);
  }

  @Get('export.csv')
  async exportCsv(
    @Query('schoolId') schoolId?: string,
    @Query('owner') owner?: string,
    @Query('type') type?: string,
    @Query('status') status?: '有效' | '过期',
  ) {
    const rows: any[] = await this.svc.list({ schoolId, owner, type, status });
    const headers = ['ID', '学校ID', '主体', '类型', '证件号', '到期时间', '状态'];
    const csv = [headers.join(',')]
      .concat(
        (rows || []).map((r) =>
          [r.id, r.schoolId, r.owner, r.type, r.number, r.expireAt, r.status].map((v) => {
            const s = String(v ?? '');
            const needsQuote = /[",\r\n]/.test(s);
            return needsQuote ? `"${s.replace(/"/g, '""')}"` : s;
          }).join(','),
        ),
      )
      .join('\n');
    return { csv };
  }
}
