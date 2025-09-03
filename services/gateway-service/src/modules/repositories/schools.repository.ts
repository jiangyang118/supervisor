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
    // Normalize id to number in case DB column remains VARCHAR temporarily
    return (rows as Array<{ id: any; name: string; enabled: number }>).map((r) => ({
      id: typeof r.id === 'number' ? r.id : Number(String(r.id).replace(/\D/g, '')),
      name: r.name,
      enabled: r.enabled,
    }));
  }

  async insert(name: string, enabled = true): Promise<number> {
    const res = await this.db.query('insert into schools(name, enabled) values(?,?)', [
      name,
      enabled ? 1 : 0,
    ]);
    return res.insertId || 0;
  }

  async findByName(name: string): Promise<{ id: number; name: string; enabled: number } | null> {
    const { rows } = await this.db.query<any>('select id, name, enabled from schools where name = ? limit 1', [name]);
    if (!rows || !rows[0]) return null;
    const r = rows[0];
    const id = typeof r.id === 'number' ? r.id : Number(String(r.id).replace(/\D/g, ''));
    return { id, name: r.name, enabled: r.enabled };
  }

  async update(id: number, patch: { name?: string; enabled?: boolean }) {
    const fields: string[] = [];
    const values: any[] = [];
    if (patch.name !== undefined) { fields.push('name = ?'); values.push(patch.name); }
    if (patch.enabled !== undefined) { fields.push('enabled = ?'); values.push(patch.enabled ? 1 : 0); }
    if (!fields.length) return;
    values.push(id);
    await this.db.query(`update schools set ${fields.join(', ')} where id = ?`, values);
  }
}
