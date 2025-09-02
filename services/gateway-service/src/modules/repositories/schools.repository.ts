import { Injectable } from '@nestjs/common';
import { DbService } from '../db.service';

@Injectable()
export class SchoolsRepository {
  constructor(private readonly db: DbService) {}

  async listAll(includeDisabled = false) {
    const where = includeDisabled ? '' : 'where enabled = 1';
    const { rows } = await this.db.query<any>(
      `select id, name, enabled from schools ${where} order by name asc`,
    );
    return rows as Array<{ id: string; name: string; enabled: number }>;
  }

  async insert(id: string, name: string, enabled = true) {
    await this.db.query('insert into schools(id, name, enabled) values(?,?,?)', [
      id,
      name,
      enabled ? 1 : 0,
    ]);
  }

  async update(id: string, patch: { name?: string; enabled?: boolean }) {
    const fields: string[] = [];
    const values: any[] = [];
    if (patch.name !== undefined) { fields.push('name = ?'); values.push(patch.name); }
    if (patch.enabled !== undefined) { fields.push('enabled = ?'); values.push(patch.enabled ? 1 : 0); }
    if (!fields.length) return;
    values.push(id);
    await this.db.query(`update schools set ${fields.join(', ')} where id = ?`, values);
  }
}
