import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  ping() {
    return { ok: true, service: 'api-gateway', time: new Date().toISOString() };
  }
}
