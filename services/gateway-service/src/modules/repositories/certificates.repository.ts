import { Injectable } from '@nestjs/common';
import { DbService } from '../db.service';

@Injectable()
export class CertificatesRepository {
  constructor(private readonly db: DbService) {}

  async insert(rec: { schoolId: number; owner: string; type: string; number: string; expireAt: string; deleted?: boolean }) {
    const res = await this.db.query(
      'insert into certificates(school_id, owner, type, number, expire_at, deleted) values(?,?,?,?,?,?)',
      [rec.schoolId, rec.owner, rec.type, rec.number, new Date(rec.expireAt), rec.deleted ? 1 : 0]
    );
    return res.insertId || 0;
  }

  async update(id: number | string, patch: Partial<{ owner: string; type: string; number: string; expireAt: string; deleted: boolean }>) {
    const fields: string[] = [];
    const values: any[] = [];
    const map: Record<string, string> = { owner: 'owner', type: 'type', number: 'number', expireAt: 'expire_at', deleted: 'deleted' };
    for (const k of Object.keys(patch)) {
      const col = map[k]; if (!col) continue;
      fields.push(`${col} = ?`);
      let v: any = (patch as any)[k];
      if (k === 'deleted') v = v ? 1 : 0;
      if (k === 'expireAt') v = new Date(v);
      values.push(v);
    }
    if (!fields.length) return;
    values.push(id);
    await this.db.query(`update certificates set ${fields.join(', ')} where id = ?`, values);
  }

  async list(params?: { schoolId?: number | string; owner?: string; type?: string; includeDeleted?: boolean }) {
    const where: string[] = [];
    const values: any[] = [];
    if (params?.schoolId !== undefined && params?.schoolId !== null) { where.push('school_id = ?'); values.push(params.schoolId); }
    if (params?.owner) { where.push('owner like ?'); values.push(`%${params.owner}%`); }
    if (params?.type) { where.push('type = ?'); values.push(params.type); }
    if (!params?.includeDeleted) { where.push('deleted = 0'); }
    const sql = `select id, owner, type, number, expire_at as expireAt, deleted from certificates ${where.length ? 'where ' + where.join(' and ') : ''} order by expire_at asc`;
    const { rows } = await this.db.query<any>(sql, values);
    return rows as Array<{ id: number; owner: string; type: string; number: string; expireAt: string; deleted: number }>;
  }
}
