import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PublicConfigService } from './public-config.service';

@Controller('school/public/config')
export class PublicConfigController {
  constructor(private readonly svc: PublicConfigService) {}

  @Get()
  get(@Query('schoolId') schoolId?: string) {
    return this.svc.get(schoolId);
  }

  @Post()
  update(
    @Body()
    b: Partial<{
      live: boolean;
      rating: boolean;
      orgCert: boolean;
      staffCert: boolean;
      level: boolean;
      trace: boolean;
      menu: boolean;
    }> & { updatedBy?: string },
  ) {
    const { updatedBy, ...partial } = b as any;
    return this.svc.update(partial, updatedBy);
  }

  @Get('audit')
  audit() {
    return this.svc.listAudit();
  }
}
