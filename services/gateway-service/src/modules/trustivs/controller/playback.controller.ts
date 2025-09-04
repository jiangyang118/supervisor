import { Controller, Get, Headers, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiKeyGuard } from '../api-key.guard';
import { HeaderValidationInterceptor } from '../header-validation.interceptor';
import { TransformResponseInterceptor } from '../transform-response.interceptor';
import { TrustivsPlaybackService } from '../service/playback.service';

@UseGuards(ApiKeyGuard)
@UseInterceptors(HeaderValidationInterceptor, TransformResponseInterceptor)
@Controller()
export class TrustivsPlaybackController {
  constructor(private readonly svc: TrustivsPlaybackService) {}

  @Get('gatewayGBS/openApi/getBackUrl')
  async getBackUrl(@Query() q: any, @Headers() headers: Record<string, string>) {
    const data = await this.svc.getBackUrl(q, headers);
    return { code: '1', message: 'OK', data };
  }

  @Get('gatewayGBS/openApi/getDownloadUrl')
  async getDownloadUrl(@Query() q: any, @Headers() headers: Record<string, string>) {
    const data = await this.svc.getDownloadUrl(q, headers);
    return { code: '1', message: 'OK', data };
  }
}

