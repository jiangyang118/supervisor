import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { DbService } from '../db.service';

export type WasteCategory = string;

@Injectable()
export class WasteRepository {
  constructor(private readonly db: DbService) {}

  // Categories
  async listCategories(enabledOnly = true) {
    const where = enabledOnly ? 'where enabled = 1' : '';
    const { rows } = await this.db.query<any>(
      `select id, name, enabled from waste_categories ${where} order by name asc`,
    );
    return rows.map((r) => ({ id: r.id as string, name: r.name as string, enabled: !!r.enabled }));
  }

  async createCategory(id: string, name: string) {
    try {
      await this.db.query(
        'insert into waste_categories(id, name, enabled) values(?,?,1)',
        [id, name],
      );
      return { id, name, enabled: true };
    } catch (e: any) {
      if (e?.code === 'ER_DUP_ENTRY' || e?.errno === 1062) {
        throw new HttpException('Category already exists', HttpStatus.CONFLICT);
      }
      throw e;
    }
  }

  async setCategoryEnabled(id: string, enabled: boolean) {
    const { rows } = await this.db.query<any>('update waste_categories set enabled = ? where id = ?', [enabled ? 1 : 0, id]);
    return rows;
  }

  async deleteCategory(id: string) {
    await this.db.query('delete from waste_categories where id = ?', [id]);
  }

  // Records
  async countRecords(filters: { schoolId?: string; category?: string; start?: string; end?: string }) {
    const where: string[] = [];
    const params: any[] = [];
    if (filters.schoolId) { where.push('school_id = ?'); params.push(filters.schoolId); }
    if (filters.category) { where.push('category = ?'); params.push(filters.category); }
    if (filters.start) { where.push('date >= ?'); params.push(filters.start); }
    if (filters.end) { where.push('date <= ?'); params.push(filters.end); }
    const sql = `select count(1) as c from waste_records ${where.length ? 'where ' + where.join(' and ') : ''}`;
    const { rows } = await this.db.query<any>(sql, params);
    return Number(rows[0]?.c || 0);
  }

  async listRecords(filters: {
    schoolId?: string;
    category?: string;
    start?: string;
    end?: string;
    page: number;
    pageSize: number;
  }) {
    const where: string[] = [];
    const params: any[] = [];
    if (filters.schoolId) { where.push('school_id = ?'); params.push(filters.schoolId); }
    if (filters.category) { where.push('category = ?'); params.push(filters.category); }
    if (filters.start) { where.push('date >= ?'); params.push(filters.start); }
    if (filters.end) { where.push('date <= ?'); params.push(filters.end); }
    const sql = `select id, school_id as schoolId, date, category, amount, buyer, person, created_at as createdAt
                 from waste_records ${where.length ? 'where ' + where.join(' and ') : ''}
                 order by created_at desc limit ? offset ?`;
    params.push(filters.pageSize, (filters.page - 1) * filters.pageSize);
    const { rows } = await this.db.query<any>(sql, params);
    return rows as any[];
  }

  async insertRecord(rec: {
    id: string;
    schoolId: string;
    date: string;
    category: string;
    amount: number;
    buyer: string;
    person: string;
    createdAt: string;
  }) {
    await this.db.query(
      `insert into waste_records(id, school_id, date, category, amount, buyer, person, created_at)
       values(?,?,?,?,?,?,?,?)`,
      [rec.id, rec.schoolId, rec.date, rec.category, rec.amount, rec.buyer, rec.person, new Date(rec.createdAt)],
    );
  }

  async getRecordById(id: string) {
    const { rows } = await this.db.query<any>(
      `select id, school_id as schoolId, date, category, amount, buyer, person, created_at as createdAt
       from waste_records where id = ? limit 1`,
      [id],
    );
    return rows[0] || null;
  }
}
