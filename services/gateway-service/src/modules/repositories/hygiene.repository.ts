import { Injectable } from '@nestjs/common';
import { DbService } from '../db.service';

@Injectable()
export class HygieneRepository {
  constructor(private readonly db: DbService) {}

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
  }

  async insertInspection(rec: { schoolId: number; date: string; result: '合格'|'不合格'; by: string; remark?: string }): Promise<number> {
    const res = await this.db.query(
      'insert into hygiene_inspections(school_id, date, result, created_by, remark) values(?,?,?,?,?)',
      [rec.schoolId, new Date(rec.date), rec.result, rec.by, rec.remark || null],
    );
    return res.insertId || 0;
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
  }

  async insertAsset(rec: { schoolId: number; asset: string; date: string; action: string; by: string }): Promise<number> {
    const res = await this.db.query(
      'insert into asset_maintenance(school_id, asset, date, action, created_by) values(?,?,?,?,?)',
      [rec.schoolId, rec.asset, new Date(rec.date), rec.action, rec.by],
    );
    return res.insertId || 0;
  }
}
