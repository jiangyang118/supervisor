import { Injectable, HttpException, HttpStatus, OnModuleInit } from '@nestjs/common';
import { DbService } from '../db.service';

export type WasteCategory = number;

@Injectable()
export class WasteRepository implements OnModuleInit {
  constructor(private readonly db: DbService) {}

  async onModuleInit() {
    await this.ensureSchema();
  }

  private async ensureSchema() {
    try {
      await this.db.query(
        `create table if not exists waste_categories (
           id int not null primary key auto_increment,
           name varchar(255) not null,
           enabled tinyint not null default 1,
           created_at datetime not null default current_timestamp,
           unique key uk_waste_categories_name(name)
         )`,
      );
    } catch {}
    try {
      await this.db.query(
        `create table if not exists waste_records (
           id int not null primary key auto_increment,
           school_id int not null,
           canteen_id int null,
           date date not null,
           category varchar(255) not null,
           amount decimal(18,3) not null default 0,
           buyer varchar(255) not null,
           person varchar(255) not null,
           created_at datetime not null default current_timestamp,
           key idx_waste_records_school_date (school_id, date),
           key idx_waste_canteen (canteen_id),
           key idx_waste_records_created_at (created_at)
         )`,
      );
      // Align legacy table: add missing columns if needed
      const { rows } = await this.db.query<any>(
        'select column_name as name from information_schema.columns where table_schema = database() and table_name = ?',
        ['waste_records'],
      );
      const cols = new Set((rows || []).map((r: any) => String(r.name || r.COLUMN_NAME || '').toLowerCase()));
      if (!cols.has('canteen_id')) {
        try { await this.db.query('alter table waste_records add column canteen_id int null after school_id'); } catch {}
      }
    } catch {}
  }

  // Categories
  async listCategories(enabledOnly = true) {
    const where = enabledOnly ? 'where enabled = 1' : '';
    const { rows } = await this.db.query<any>(
      `select id, name, enabled from waste_categories ${where} order by name asc`,
    );
    return rows.map((r) => ({ id: Number(r.id), name: r.name as string, enabled: !!r.enabled }));
  }

  async createCategory(name: string) {
    try {
      const res = await this.db.query(
        'insert into waste_categories(name, enabled) values(?,1)',
        [name],
      );
      const id = res.insertId || 0;
      return { id, name, enabled: true };
    } catch (e: any) {
      if (e?.code === 'ER_DUP_ENTRY' || e?.errno === 1062) {
        throw new HttpException('Category already exists', HttpStatus.CONFLICT);
      }
      throw e;
    }
  }

  async setCategoryEnabled(id: number, enabled: boolean) {
    const { rows } = await this.db.query<any>('update waste_categories set enabled = ? where id = ?', [enabled ? 1 : 0, id]);
    return rows;
  }

  async deleteCategory(id: number) {
    await this.db.query('delete from waste_categories where id = ?', [id]);
  }

  // Records
  async countRecords(filters: { schoolId?: number; canteenId?: number; category?: number; start?: string; end?: string }) {
    const where: string[] = [];
    const params: any[] = [];
    if (filters.schoolId !== undefined && filters.schoolId !== null) { where.push('r.school_id = ?'); params.push(filters.schoolId); }
    if (filters.canteenId !== undefined && filters.canteenId !== null) { where.push('r.canteen_id = ?'); params.push(filters.canteenId); }
    if (filters.category) { where.push('r.category = ?'); params.push(filters.category); }
    if (filters.start) { where.push('r.`date` >= ?'); params.push(filters.start); }
    if (filters.end) { where.push('r.`date` <= ?'); params.push(filters.end); }
    const sql = `select count(1) as c from waste_records r ${where.length ? 'where ' + where.join(' and ') : ''}`;
    try {
      const { rows } = await this.db.query<any>(sql, params);
      return Number(rows[0]?.c || 0);
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (/unknown column 'r\.canteen_id'|ER_BAD_FIELD_ERROR/i.test(msg)) {
        // retry without canteen_id condition
        const where2 = where.filter((w) => !/canteen_id/.test(w));
        const params2 = params.filter((_v, i) => !/canteen_id/.test(where[i] || ''));
        const { rows } = await this.db.query<any>(`select count(1) as c from waste_records r ${where2.length ? 'where ' + where2.join(' and ') : ''}`, params2);
        return Number(rows[0]?.c || 0);
      }
      throw e;
    }
  }

  async listRecords(filters: { schoolId?: number; canteenId?: number; category?: number; start?: string; end?: string; page: number; pageSize: number; }) {
    const where: string[] = [];
    const params: any[] = [];
    if (filters.schoolId !== undefined && filters.schoolId !== null) { where.push('r.school_id = ?'); params.push(filters.schoolId); }
    if (filters.canteenId !== undefined && filters.canteenId !== null) { where.push('r.canteen_id = ?'); params.push(filters.canteenId); }
    if (filters.category) { where.push('r.category = ?'); params.push(filters.category); }
    if (filters.start) { where.push('r.`date` >= ?'); params.push(filters.start); }
    if (filters.end) { where.push('r.`date` <= ?'); params.push(filters.end); }
    const sql = `select r.id, r.school_id as schoolId, r.canteen_id as canteenId, r.date, r.category, r.amount, r.buyer, r.person, r.created_at as createdAt,
                        c.name as canteenName
                 from waste_records r left join canteens c on c.id = r.canteen_id
                 ${where.length ? 'where ' + where.join(' and ') : ''}
                 order by r.created_at desc limit ? offset ?`;
    params.push(filters.pageSize, (filters.page - 1) * filters.pageSize);
    try {
      const { rows } = await this.db.query<any>(sql, params);
      return (rows as any[]).map((r) => ({
        ...r,
        id: Number(r.id),
        schoolId: Number(r.schoolId),
        amount: Number(r.amount),
      }));
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (/unknown column 'r\.canteen_id'|unknown column 'c\.id'|ER_BAD_FIELD_ERROR/i.test(msg)) {
        const where2 = where.filter((w) => !/canteen_id/.test(w));
        const params2 = params.filter((_v, i) => !/canteen_id/.test(where[i] || ''));
        const { rows } = await this.db.query<any>(
          `select r.id, r.school_id as schoolId, r.date, r.category, r.amount, r.buyer, r.person, r.created_at as createdAt
             from waste_records r ${where2.length ? 'where ' + where2.join(' and ') : ''}
             order by r.created_at desc limit ? offset ?`,
          params2,
        );
        return (rows as any[]).map((r) => ({ ...r, id: Number(r.id), schoolId: Number(r.schoolId), amount: Number(r.amount), canteenId: null, canteenName: null }));
      }
      throw e;
    }
  }

  async insertRecord(rec: {
    schoolId: number;
    canteenId?: number | null;
    date: string;
    category: string;
    amount: number;
    buyer: string;
    person: string;
    createdAt: string;
  }): Promise<number> {
    try {
      const res = await this.db.query(
        `insert into waste_records(school_id, canteen_id, date, category, amount, buyer, person, created_at)
         values(?,?,?,?,?,?,?,?)`,
        [rec.schoolId, rec.canteenId || null, rec.date, rec.category, rec.amount, rec.buyer, rec.person, new Date(rec.createdAt)],
      );
      return res.insertId || 0;
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (/unknown column 'canteen_id'|ER_BAD_FIELD_ERROR/i.test(msg)) {
        const res = await this.db.query(
          `insert into waste_records(school_id, date, category, amount, buyer, person, created_at)
           values(?,?,?,?,?,?,?)`,
          [rec.schoolId, rec.date, rec.category, rec.amount, rec.buyer, rec.person, new Date(rec.createdAt)],
        );
        return res.insertId || 0;
      }
      throw e;
    }
  }

  async getRecordById(id: number) {
    try {
      const { rows } = await this.db.query<any>(
        `select r.id, r.school_id as schoolId, r.canteen_id as canteenId, r.date, r.category, r.amount, r.buyer, r.person, r.created_at as createdAt,
                c.name as canteenName
         from waste_records r left join canteens c on c.id = r.canteen_id where r.id = ? limit 1`,
        [id],
      );
      const row = rows[0] || null;
      return row
        ? { ...row, id: Number(row.id), schoolId: Number(row.schoolId), amount: Number(row.amount) }
        : null;
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (/unknown column 'r\.canteen_id'|unknown column 'c\.id'|ER_BAD_FIELD_ERROR/i.test(msg)) {
        const { rows } = await this.db.query<any>(
          `select r.id, r.school_id as schoolId, r.date, r.category, r.amount, r.buyer, r.person, r.created_at as createdAt
             from waste_records r where r.id = ? limit 1`,
          [id],
        );
        const row = rows[0] || null;
        return row ? { ...row, id: Number(row.id), schoolId: Number(row.schoolId), amount: Number(row.amount), canteenId: null, canteenName: null } : null;
      }
      throw e;
    }
  }

  async deleteRecord(id: number) {
    const { affectedRows } = await this.db.query('delete from waste_records where id = ?', [id]);
    return affectedRows || 0;
  }
}
