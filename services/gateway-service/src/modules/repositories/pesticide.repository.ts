import { Injectable, OnModuleInit } from '@nestjs/common';
import { DbService } from '../db.service';

@Injectable()
export class PesticideRepository implements OnModuleInit {
  constructor(private readonly db: DbService) {}

  async onModuleInit() {
    try {
      await this.db.query(
        `create table if not exists pesticide_records (
           id int primary key auto_increment,
           school_id int not null,
           canteen_id int null,
           sample varchar(255) not null,
           device varchar(128) not null,
           tester varchar(128) null,
           detect_value decimal(18,3) null,
           result varchar(8) not null,
           image_url varchar(255) null,
           remark varchar(255) null,
           at datetime not null,
           source varchar(16) not null,
           exception tinyint not null default 0,
           measure varchar(255) null,
           key idx_pest_school_at (school_id, at),
           key idx_pest_result_at (result, at)
         )`,
      );
    } catch {}
    // Align legacy schemas: add columns if missing; keep best-effort
    try {
      const { rows } = await this.db.query<any>(
        'select column_name as name from information_schema.columns where table_schema = database() and table_name = ?',
        ['pesticide_records'],
      );
      const cols = new Set((rows || []).map((r: any) => String(r.name || r.COLUMN_NAME || '').toLowerCase()));
      const add = async (sql: string) => { try { await this.db.query(sql); } catch {} };
      if (!cols.has('canteen_id')) await add('alter table pesticide_records add column canteen_id int null after school_id');
      if (!cols.has('tester')) await add('alter table pesticide_records add column tester varchar(128) null after device');
      if (!cols.has('detect_value')) await add('alter table pesticide_records add column detect_value decimal(18,3) null after tester');
      // Normalize types to int where possible (non-breaking)
      try { await this.db.query('alter table pesticide_records modify column id int not null auto_increment'); } catch {}
      try { await this.db.query('alter table pesticide_records modify column school_id int not null'); } catch {}
    } catch {}
  }

  async list(filters: {
    schoolId?: number; canteenId?: number; q?: string; result?: '合格'|'不合格'; start?: string; end?: string; page: number; pageSize: number;
  }) {
    const where: string[] = [];
    const params: any[] = [];
    if (filters.schoolId !== undefined && filters.schoolId !== null) { where.push('school_id = ?'); params.push(filters.schoolId); }
    if (filters.canteenId !== undefined && filters.canteenId !== null) { where.push('canteen_id = ?'); params.push(filters.canteenId); }
    if (filters.q) { where.push('(sample like ? or device like ?)'); params.push(`%${filters.q}%`, `%${filters.q}%`); }
    if (filters.result) { where.push('result = ?'); params.push(filters.result); }
    if (filters.start) { where.push('at >= ?'); params.push(new Date(filters.start)); }
    if (filters.end) { where.push('at <= ?'); params.push(new Date(filters.end)); }
    const base = `from pesticide_records ${where.length ? 'where ' + where.join(' and ') : ''}`;
    try {
      const totalRows = await this.db.query<any>(`select count(1) as c ${base}`, params);
      const total = Number(totalRows.rows[0]?.c || 0);
      const rows = await this.db.query<any>(
        `select id, school_id as schoolId, canteen_id as canteenId, sample, device, tester, detect_value as \`value\`, result, image_url as imageUrl, remark, at, source, exception, measure ${base}
         order by at desc limit ? offset ?`,
        [...params, filters.pageSize, (filters.page - 1) * filters.pageSize],
      );
      return { items: rows.rows, total, page: filters.page, pageSize: filters.pageSize };
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (/unknown column 'canteen_id'|unknown column 'tester'|unknown column 'detect_value'|ER_BAD_FIELD_ERROR/i.test(msg)) {
        const totalRows = await this.db.query<any>(`select count(1) as c from pesticide_records ${where.filter(w=>!w.includes('canteen_id')).join(' and ') || ''}`, params.filter((_v, i)=>!where[i]?.includes?.('canteen_id')));
        const total = Number(totalRows.rows[0]?.c || 0);
        const rows = await this.db.query<any>(
          `select id, school_id as schoolId, sample, device, result, image_url as imageUrl, remark, at, source, exception, measure
             from pesticide_records ${where.filter(w=>!w.includes('canteen_id')).join(' and ') ? 'where ' + where.filter(w=>!w.includes('canteen_id')).join(' and ') : ''}
             order by at desc limit ? offset ?`,
          [...params.filter((_v, i)=>!where[i]?.includes?.('canteen_id')), filters.pageSize, (filters.page - 1) * filters.pageSize],
        );
        const items = (rows.rows as any[]).map(r => ({ canteenId: null, tester: null, value: null, ...r }));
        return { items, total, page: filters.page, pageSize: filters.pageSize };
      }
      throw e;
    }
  }

  async insert(rec: {
    schoolId: number; canteenId?: number; sample: string; device: string; tester?: string; value?: number; result: '合格'|'不合格'; imageUrl?: string; remark?: string; at: string; source: 'manual'|'device'; exception: boolean; measure?: string;
  }): Promise<number> {
    try {
      const res = await this.db.query(
        `insert into pesticide_records(school_id, canteen_id, sample, device, tester, detect_value, result, image_url, remark, at, source, exception, measure)
         values(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [rec.schoolId, rec.canteenId || null, rec.sample, rec.device, rec.tester || null, rec.value ?? null, rec.result, rec.imageUrl || null, rec.remark || null, new Date(rec.at), rec.source, rec.exception ? 1 : 0, rec.measure || null],
      );
      return res.insertId || 0;
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (/unknown column 'canteen_id'|unknown column 'tester'|unknown column 'detect_value'|ER_BAD_FIELD_ERROR/i.test(msg)) {
        const res = await this.db.query(
          `insert into pesticide_records(school_id, sample, device, result, image_url, remark, at, source, exception, measure)
           values(?,?,?,?,?,?,?,?,?,?)`,
          [rec.schoolId, rec.sample, rec.device, rec.result, rec.imageUrl || null, rec.remark || null, new Date(rec.at), rec.source, rec.exception ? 1 : 0, rec.measure || null],
        );
        return res.insertId || 0;
      }
      throw e;
    }
  }

  async setMeasure(id: number, measure?: string) {
    await this.db.query('update pesticide_records set measure = ? where id = ?', [measure || null, id]);
  }
}
