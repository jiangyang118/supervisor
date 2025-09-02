import { Injectable } from '@nestjs/common';
import { DbService } from '../db.service';

@Injectable()
export class CertificatesRepository {
  constructor(private readonly db: DbService) {}

  async insert(rec: { id: string; owner: string; type: string; number: string; expireAt: string; deleted?: boolean }) {
    await this.db.query(
      'insert ignore into certificates(id, owner, type, number, expire_at, deleted) values(?,?,?,?,?,?)',
      [rec.id, rec.owner, rec.type, rec.number, rec.expireAt, rec.deleted ? 1 : 0]
    );
  }

  async update(id: string, patch: Partial<{ owner: string; type: string; number: string; expireAt: string; deleted: boolean }>) {
    const fields: string[] = [];
    const values: any[] = [];
    const map: Record<string, string> = { owner: 'owner', type: 'type', number: 'number', expireAt: 'expire_at', deleted: 'deleted' };
    for (const k of Object.keys(patch)) {
      const col = map[k]; if (!col) continue;
      fields.push(`${col} = ?`);
      let v: any = (patch as any)[k];
      if (k === 'deleted') v = v ? 1 : 0;
      values.push(v);
    }
    if (!fields.length) return;
    values.push(id);
    await this.db.query(`update certificates set ${fields.join(', ')} where id = ?`, values);
  }
}

