import { Body, Controller, Headers, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiKeyGuard } from '../api-key.guard';
import { HeaderValidationInterceptor } from '../header-validation.interceptor';
import { TransformResponseInterceptor } from '../transform-response.interceptor';
import { TrustivsAIService } from '../service/ai.service';

@UseGuards(ApiKeyGuard)
@UseInterceptors(HeaderValidationInterceptor, TransformResponseInterceptor)
@Controller()
export class TrustivsAIController {
  constructor(private readonly svc: TrustivsAIService) {}

  @Post('gatewayGBS/openApi/getAIRecordByCompany')
  async getAIRecordByCompany(@Body() body: any, @Headers() headers: Record<string, string>) {
    const data = await this.svc.getAIRecordByCompany(body, headers);
    return { code: '1', message: 'OK', data };
  }

  @Post('openApi/sendAIRecordByCompany')
  async sendAIRecordByCompany(@Body() body: any, @Headers() headers: Record<string, string>) {
    const res = await this.svc.sendAIRecordByCompany(body, headers);
    return res;
  }
}

