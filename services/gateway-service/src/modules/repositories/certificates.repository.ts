import { Injectable, OnModuleInit } from '@nestjs/common';
import { DbService } from '../db.service';

@Injectable()
export class CertificatesRepository implements OnModuleInit {
  constructor(private readonly db: DbService) {}

  async onModuleInit() {
    try {
      await this.db.query(
        `create table if not exists certificates (
           id int primary key auto_increment,
           school_id int not null,
           owner varchar(255) not null,
           type varchar(128) not null,
           number varchar(255) not null,
           expire_at datetime not null,
           deleted tinyint not null default 0,
           key idx_cert_school (school_id),
           key idx_cert_expire (expire_at)
         )`
      );
      // Align legacy schema: add missing columns if table existed without them
      const { rows } = await this.db.query<any>(
        'select column_name as name from information_schema.columns where table_schema = database() and table_name = ?',[
          'certificates',
        ],
      );
      const cols = new Set((rows || []).map((r: any) => (r.name || r.COLUMN_NAME || '').toString().toLowerCase()));
      if (!cols.has('school_id')) {
        try { await this.db.query('alter table certificates add column school_id int not null default 1'); } catch {}
      }
      if (!cols.has('deleted')) {
        try { await this.db.query('alter table certificates add column deleted tinyint not null default 0'); } catch {}
      }
      if (!cols.has('expire_at')) {
        try { await this.db.query('alter table certificates add column expire_at datetime null'); } catch {}
      }
      // Ensure types
      try {
        await this.db.query(
          'alter table certificates modify column id int not null auto_increment, modify column school_id int not null',
        );
      } catch {}
    } catch {
      // best effort; real migrations handle structure in normal deployments
    }
  }

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
