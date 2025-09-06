import { Controller, Get, Headers, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { CameraService } from './camera.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from './api-key.guard';
import { HeaderValidationInterceptor } from './header-validation.interceptor';
import { TransformResponseInterceptor } from './transform-response.interceptor';

@ApiTags('TrustIVS.Camera')
@UseGuards(ApiKeyGuard)
@UseInterceptors(HeaderValidationInterceptor, TransformResponseInterceptor)
@Controller('gatewayGBS/openApi')
export class CameraController {
  constructor(private readonly svc: CameraService) {}

  @Get('getCameraByCompany')
  @ApiOperation({ summary: '按公司获取摄像头（内部POST优先，含405回退）' })
  async getCameraByCompany(
    @Query('pageNum') pageNum?: string,
    @Query('pageSize') pageSize?: string,
    @Headers() _headers?: Record<string, string>,
  ) {
    // headers 已由拦截器注入 time/uuid/token 校验。内部调用时由 TrustivsConfigService 注入。
    const pn = Number(pageNum || '1') || 1;
    const ps = Number(pageSize || '10') || 10;
    const resp = await this.svc.getCameraByCompany({ pageNum: pn, pageSize: ps });
    return resp;
  }
}
