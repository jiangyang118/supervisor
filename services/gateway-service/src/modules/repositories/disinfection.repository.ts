import { Injectable, OnModuleInit } from '@nestjs/common';
import { DbService } from '../db.service';

export type DisinfectionRow = {
  id: number;
  schoolId: number;
  canteenId?: number | null;
  method: string;
  duration: number;
  items: string;
  temperature?: number | null;
  responsible?: string | null;
  imageUrl?: string | null;
  at: string;
  source: 'manual' | 'device';
  exception: number; // 0/1
  exceptionReason?: string | null;
  measure?: string | null;
};

@Injectable()
export class DisinfectionRepository implements OnModuleInit {
  constructor(private readonly db: DbService) {}

  async onModuleInit() {
    await this.ensureSchema();
  }

  private async ensureSchema() {
    // Create base table and align legacy columns
    try {
      await this.db.query(
        `create table if not exists disinfection_records (
           id int primary key auto_increment,
           school_id int not null,
           canteen_id int null,
           method varchar(16) not null,
           duration_minutes int not null,
           items varchar(255) not null,
           temperature_c decimal(6,2) null,
           responsible varchar(128) null,
           image_url varchar(255) null,
           at datetime not null,
           source varchar(16) not null,
           exception tinyint not null default 0,
           exception_reason varchar(255) null,
           measure varchar(255) null,
           key idx_df_school_at (school_id, at),
           key idx_df_method (method),
           key idx_df_exception (exception)
         )`,
      );
    } catch {}
    try {
      const { rows } = await this.db.query<any>(
        'select column_name as name from information_schema.columns where table_schema = database() and table_name = ?',
        ['disinfection_records'],
      );
      const cols = new Set((rows || []).map((r: any) => String(r.name || r.COLUMN_NAME || '').toLowerCase()));
      const add = async (sql: string) => { try { await this.db.query(sql); } catch {} };
      if (!cols.has('canteen_id')) await add('alter table disinfection_records add column canteen_id int null after school_id');
      if (!cols.has('temperature_c')) await add('alter table disinfection_records add column temperature_c decimal(6,2) null after items');
      if (!cols.has('responsible')) await add('alter table disinfection_records add column responsible varchar(128) null after temperature_c');
    } catch {}
  }

  async insert(r: Omit<DisinfectionRow, 'id' | 'exception'> & { exception?: number }) {
    try {
      const res = await this.db.query(
        `insert into disinfection_records(
           school_id, canteen_id, method, duration_minutes, items, temperature_c, responsible, image_url, at, source, exception, exception_reason, measure
         ) values (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          r.schoolId,
          r.canteenId || null,
          r.method,
          r.duration,
          r.items,
          r.temperature ?? null,
          r.responsible || null,
          r.imageUrl || null,
          new Date(r.at),
          r.source,
          r.exception ? 1 : 0,
          r.exceptionReason || null,
          r.measure || null,
        ],
      );
      return res.insertId || 0;
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (/unknown column 'canteen_id'|ER_BAD_FIELD_ERROR/i.test(msg)) {
        // Fallback for legacy schema without canteen_id/temperature_c/responsible
        const res = await this.db.query(
          `insert into disinfection_records(
             school_id, method, duration_minutes, items, image_url, at, source, exception, exception_reason, measure
           ) values (?,?,?,?,?,?,?,?,?,?)`,
          [
            r.schoolId,
            r.method,
            r.duration,
            r.items,
            r.imageUrl || null,
            new Date(r.at),
            r.source,
            r.exception ? 1 : 0,
            r.exceptionReason || null,
            r.measure || null,
          ],
        );
        return res.insertId || 0;
      }
      throw e;
    }
  }

  async updateMeasure(id: number, measure?: string) {
    await this.db.query('update disinfection_records set measure = ? where id = ?', [measure || null, id]);
  }

  async search(params: {
    schoolId: number | string;
    canteenId?: number;
    method?: string;
    exception?: boolean;
    start?: string;
    end?: string;
    page: number;
    pageSize: number;
  }): Promise<{ items: DisinfectionRow[]; total: number; page: number; pageSize: number }>{
    const where: string[] = ['school_id = ?'];
    const args: any[] = [params.schoolId];
    if (typeof params.canteenId === 'number') { where.push('canteen_id = ?'); args.push(params.canteenId); }
    if (params.method) { where.push('method = ?'); args.push(params.method); }
    if (typeof params.exception === 'boolean') { where.push('exception = ?'); args.push(params.exception ? 1 : 0); }
    if (params.start) { where.push('at >= ?'); args.push(new Date(params.start)); }
    if (params.end) { where.push('at <= ?'); args.push(new Date(params.end)); }
    const whereSql = `where ${where.join(' and ')}`;
    try {
      const cnt = await this.db.query<any>(`select count(1) as c from disinfection_records ${whereSql}`, args);
      const total = Number(cnt.rows[0]?.c || 0);
      const limit = params.pageSize;
      const offset = (params.page - 1) * params.pageSize;
      const { rows } = await this.db.query<any>(
        `select id, school_id as schoolId, canteen_id as canteenId, method, duration_minutes as duration, items, temperature_c as temperature, responsible, image_url as imageUrl, at, source, exception, exception_reason as exceptionReason, measure
         from disinfection_records ${whereSql} order by at desc limit ? offset ?`,
        [...args, limit, offset],
      );
      return { items: rows as DisinfectionRow[], total, page: params.page, pageSize: params.pageSize };
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (/unknown column 'canteen_id'|unknown column 'temperature_c'|unknown column 'responsible'|ER_BAD_FIELD_ERROR/i.test(msg)) {
        const cnt = await this.db.query<any>(`select count(1) as c from disinfection_records where school_id = ?`, [params.schoolId]);
        const total = Number(cnt.rows[0]?.c || 0);
        const limit = params.pageSize;
        const offset = (params.page - 1) * params.pageSize;
        const { rows } = await this.db.query<any>(
          `select id, school_id as schoolId, method, duration_minutes as duration, items, image_url as imageUrl, at, source, exception, exception_reason as exceptionReason, measure
           from disinfection_records where school_id = ? order by at desc limit ? offset ?`,
          [params.schoolId, limit, offset],
        );
        // patch missing fields to null
        const items = (rows as any[]).map((r) => ({ canteenId: null, temperature: null, responsible: null, ...r }));
        return { items: items as any, total, page: params.page, pageSize: params.pageSize };
      }
      throw e;
    }
  }

  async getById(id: number) {
    const { rows } = await this.db.query<any>(
      `select id, school_id as schoolId, canteen_id as canteenId, method, duration_minutes as duration, items, temperature_c as temperature, responsible, image_url as imageUrl, at, source, exception, exception_reason as exceptionReason, measure
         from disinfection_records where id = ? limit 1`,
      [id],
    );
    return rows?.[0] || null;
  }
}
