import { Injectable, OnModuleInit } from '@nestjs/common';
import { DbService } from '../db.service';

@Injectable()
export class HygieneRepository implements OnModuleInit {
  constructor(private readonly db: DbService) {}

  async onModuleInit() {
    // Best-effort: create tables if not exist to avoid 500 in demo/dev without migrations
    await this.ensureSchema();
  }

  private async ensureSchema() {
    try {
      await this.db.query(
        `create table if not exists hygiene_inspections(
           id int primary key auto_increment,
           school_id int not null,
           date datetime not null,
           result varchar(8) not null,
           created_by varchar(128) not null,
           remark varchar(255) null,
           key idx_hygiene_school_date (school_id, date),
           key idx_hygiene_result_date (result, date)
         )`,
      );
    } catch {}
    try {
      await this.db.query(
        `create table if not exists asset_maintenance(
           id int primary key auto_increment,
           school_id int not null,
           asset varchar(255) not null,
           date datetime not null,
           action varchar(255) not null,
           created_by varchar(128) not null,
           key idx_asset_school_date (school_id, date)
         )`,
      );
    } catch {}
  }

  async listInspections(filters: {
    schoolId?: number;
    result?: '合格' | '不合格';
    start?: string;
    end?: string;
    page: number;
    pageSize: number;
  }) {
    const where: string[] = [];
    const params: any[] = [];
    if (filters.schoolId !== undefined && filters.schoolId !== null) { where.push('school_id = ?'); params.push(filters.schoolId); }
    if (filters.result) { where.push('result = ?'); params.push(filters.result); }
    if (filters.start) { where.push('date >= ?'); params.push(new Date(filters.start)); }
    if (filters.end) { where.push('date <= ?'); params.push(new Date(filters.end)); }
    const base = `from hygiene_inspections ${where.length ? 'where ' + where.join(' and ') : ''}`;
    try {
      const totalRows = await this.db.query<any>(`select count(1) as c ${base}`, params);
      const total = Number(totalRows.rows[0]?.c || 0);
      const rows = await this.db.query<any>(
        `select id, school_id as schoolId, date, result, created_by as \`by\`, remark ${base}
         order by date desc limit ? offset ?`,
        [...params, filters.pageSize, (filters.page - 1) * filters.pageSize],
      );
      const items = (rows.rows as any[]).map((r) => ({
        ...r,
        id: Number(r.id),
        schoolId: Number(r.schoolId),
      }));
      return { items, total, page: filters.page, pageSize: filters.pageSize };
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (/no such table|doesn't exist|ER_NO_SUCH_TABLE/i.test(msg)) {
        // Table missing: return empty set instead of 500
        return { items: [], total: 0, page: filters.page, pageSize: filters.pageSize };
      }
      throw e;
    }
  }

  async insertInspection(rec: { schoolId: number; date: string; result: '合格'|'不合格'; by: string; remark?: string }): Promise<number> {
    try {
      const res = await this.db.query(
        'insert into hygiene_inspections(school_id, date, result, created_by, remark) values(?,?,?,?,?)',
        [rec.schoolId, new Date(rec.date), rec.result, rec.by, rec.remark || null],
      );
      return res.insertId || 0;
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (/no such table|doesn't exist|ER_NO_SUCH_TABLE/i.test(msg)) {
        // attempt to create then retry once
        await this.ensureSchema();
        const res = await this.db.query(
          'insert into hygiene_inspections(school_id, date, result, created_by, remark) values(?,?,?,?,?)',
          [rec.schoolId, new Date(rec.date), rec.result, rec.by, rec.remark || null],
        );
        return res.insertId || 0;
      }
      throw e;
    }
  }

  async listAssets(filters: {
    schoolId?: number; asset?: string; start?: string; end?: string; page: number; pageSize: number;
  }) {
    const where: string[] = [];
    const params: any[] = [];
    if (filters.schoolId !== undefined && filters.schoolId !== null) { where.push('school_id = ?'); params.push(filters.schoolId); }
    if (filters.asset) { where.push('asset like ?'); params.push(`%${filters.asset}%`); }
    if (filters.start) { where.push('date >= ?'); params.push(new Date(filters.start)); }
    if (filters.end) { where.push('date <= ?'); params.push(new Date(filters.end)); }
    const base = `from asset_maintenance ${where.length ? 'where ' + where.join(' and ') : ''}`;
    try {
      const totalRows = await this.db.query<any>(`select count(1) as c ${base}`, params);
      const total = Number(totalRows.rows[0]?.c || 0);
      const rows = await this.db.query<any>(
        `select id, school_id as schoolId, asset, date, action, created_by as \`by\` ${base}
         order by date desc limit ? offset ?`,
        [...params, filters.pageSize, (filters.page - 1) * filters.pageSize],
      );
      const items = (rows.rows as any[]).map((r) => ({
        ...r,
        id: Number(r.id),
        schoolId: Number(r.schoolId),
      }));
      return { items, total, page: filters.page, pageSize: filters.pageSize };
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (/no such table|doesn't exist|ER_NO_SUCH_TABLE/i.test(msg)) {
        return { items: [], total: 0, page: filters.page, pageSize: filters.pageSize };
      }
      throw e;
    }
  }

  async insertAsset(rec: { schoolId: number; asset: string; date: string; action: string; by: string }): Promise<number> {
    try {
      const res = await this.db.query(
        'insert into asset_maintenance(school_id, asset, date, action, created_by) values(?,?,?,?,?)',
        [rec.schoolId, rec.asset, new Date(rec.date), rec.action, rec.by],
      );
      return res.insertId || 0;
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (/no such table|doesn't exist|ER_NO_SUCH_TABLE/i.test(msg)) {
        await this.ensureSchema();
        const res = await this.db.query(
          'insert into asset_maintenance(school_id, asset, date, action, created_by) values(?,?,?,?,?)',
          [rec.schoolId, rec.asset, new Date(rec.date), rec.action, rec.by],
        );
        return res.insertId || 0;
      }
      throw e;
    }
  }
}
