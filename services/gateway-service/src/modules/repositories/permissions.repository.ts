import { Injectable } from '@nestjs/common';
import { DbService } from '../db.service';

@Injectable()
export class PermissionsRepository {
  constructor(private readonly db: DbService) {}

  async list(): Promise<Array<{ key: string; label: string }>> {
    const { rows } = await this.db.query<any>('select `key`, label from permissions order by `key` asc');
    return rows as Array<{ key: string; label: string }>;
  }
}

