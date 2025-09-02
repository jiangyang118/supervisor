import { Controller, Get } from '@nestjs/common';
import { DbService } from './db.service';

@Controller('health')
export class DbHealthController {
  constructor(private readonly db: DbService) {}

  @Get('db')
  async health() {
    try {
      await this.db.query('select 1');
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'DB not configured or unreachable' };
    }
  }
}

