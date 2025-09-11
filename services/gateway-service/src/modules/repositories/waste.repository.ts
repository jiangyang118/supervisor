import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { DbService } from '../db.service';

export type WasteCategory = number;

@Injectable()
export class WasteRepository {
  constructor(private readonly db: DbService) {}

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
    const { rows } = await this.db.query<any>(sql, params);
    return Number(rows[0]?.c || 0);
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
    const { rows } = await this.db.query<any>(sql, params);
    return (rows as any[]).map((r) => ({
      ...r,
      id: Number(r.id),
      schoolId: Number(r.schoolId),
      amount: Number(r.amount),
    }));
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
    const res = await this.db.query(
      `insert into waste_records(school_id, canteen_id, date, category, amount, buyer, person, created_at)
       values(?,?,?,?,?,?,?,?)`,
      [rec.schoolId, rec.canteenId || null, rec.date, rec.category, rec.amount, rec.buyer, rec.person, new Date(rec.createdAt)],
    );
    return res.insertId || 0;
  }

  async getRecordById(id: number) {
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
  }

  async deleteRecord(id: number) {
    const { affectedRows } = await this.db.query('delete from waste_records where id = ?', [id]);
    return affectedRows || 0;
  }
}
