import { Body, Controller, Headers, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiKeyGuard } from '../api-key.guard';
import { HeaderValidationInterceptor } from '../header-validation.interceptor';
import { TransformResponseInterceptor } from '../transform-response.interceptor';
import { TrustivsListService } from '../service/list.service';
import { CameraService } from '../camera.service';

@UseGuards(ApiKeyGuard)
@UseInterceptors(HeaderValidationInterceptor, TransformResponseInterceptor)
@Controller()
export class TrustivsListController {
  constructor(
    private readonly svc: TrustivsListService,
    private readonly camera: CameraService,
  ) {}

  @Post('gatewayGBS/openApi/getCompanyList')
  async getCompanyList(@Body() body: any, @Headers() headers: Record<string, string>) {
    const data = await this.svc.getCompanyList(body, headers);
    return { code: '1', message: 'OK', data };
  }

  @Post('gatewayGBS/openApi/getDeviceListByCompany')
  async getDeviceListByCompany(@Body() body: any, @Headers() headers: Record<string, string>) {
    const data = await this.svc.getDeviceListByCompany(body, headers);
    return { code: '1', message: 'OK', data };
  }

  // Removed legacy POST getCameraByCompany; use GET route in CameraController instead.

  @Post('gatewayGBS/openApi/getChannelByDevice')
  async getChannelByDevice(@Body() body: any, @Headers() headers: Record<string, string>) {
    const data = await this.svc.getChannelByDevice(body, headers);
    return { code: '1', message: 'OK', data };
  }
}
