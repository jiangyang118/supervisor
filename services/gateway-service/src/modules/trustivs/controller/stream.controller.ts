import { Body, Controller, Get, Headers, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiKeyGuard } from '../api-key.guard';
import { HeaderValidationInterceptor } from '../header-validation.interceptor';
import { TransformResponseInterceptor } from '../transform-response.interceptor';
import { TrustivsStreamService } from '../service/stream.service';

@UseGuards(ApiKeyGuard)
@UseInterceptors(HeaderValidationInterceptor, TransformResponseInterceptor)
@Controller()
export class TrustivsStreamController {
  constructor(private readonly svc: TrustivsStreamService) {}

  @Post('gatewayGBS/openApi/getStreamURL')
  async getStreamURL(@Body() body: any, @Headers() headers: Record<string, string>) {
    const data = await this.svc.getStreamURL(body, headers);
    return { code: '1', message: 'OK', data };
  }

  @Get('gatewayGBS/openApi/getSnap')
  async getSnap(@Query() q: any, @Headers() headers: Record<string, string>) {
    const data = await this.svc.getSnap(q, headers);
    return { code: '1', message: 'OK', data };
  }
}

