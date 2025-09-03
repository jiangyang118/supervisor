import { Injectable } from '@nestjs/common';
import { DbService } from '../db.service';

export type DineRow = {
  id: number;
  schoolId: number;
  mealKey: string; // BREAKFAST/LUNCH/DINNER
  meal: string; // 中文：早餐/午餐/晚餐
  people: string | null; // CSV
  imageUrl?: string | null;
  comment?: string | null;
  at: string; // datetime
  source: 'manual' | 'qr' | 'camera';
  exception: number; // 0/1
  exceptionReason?: string | null;
  measure?: string | null;
};

@Injectable()
export class DineRepository {
  constructor(private readonly db: DbService) {}

  async insert(r: Omit<DineRow, 'id' | 'exception'> & { exception?: number }) {
    const res = await this.db.query(
      `insert into dine_records(
         school_id, meal_key, meal, people, image_url, comment, at, source, exception, exception_reason, measure
       ) values (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        r.schoolId,
        r.mealKey,
        r.meal,
        r.people ?? null,
        r.imageUrl ?? null,
        r.comment ?? null,
        new Date(r.at),
        r.source,
        r.exception ? 1 : 0,
        r.exceptionReason ?? null,
        r.measure ?? null,
      ],
    );
    return res.insertId || 0;
  }

  async updateMeasure(id: number, measure?: string) {
    await this.db.query('update dine_records set measure = ? where id = ?', [measure ?? null, id]);
  }

  async search(params: {
    schoolId: number | string;
    meal?: string; // 中文 label
    mealKey?: string;
    exception?: boolean;
    start?: string;
    end?: string;
    page: number;
    pageSize: number;
  }): Promise<{ items: DineRow[]; total: number; page: number; pageSize: number }>{
    const where: string[] = ['school_id = ?'];
    const args: any[] = [params.schoolId];
    if (params.mealKey) { where.push('meal_key = ?'); args.push(params.mealKey); }
    else if (params.meal) { where.push('meal = ?'); args.push(params.meal); }
    if (typeof params.exception === 'boolean') { where.push('exception = ?'); args.push(params.exception ? 1 : 0); }
    if (params.start) { where.push('at >= ?'); args.push(new Date(params.start)); }
    if (params.end) { where.push('at <= ?'); args.push(new Date(params.end)); }
    const whereSql = `where ${where.join(' and ')}`;
    const cnt = await this.db.query<any>(`select count(1) as c from dine_records ${whereSql}`, args);
    const total = Number(cnt.rows[0]?.c || 0);
    const limit = params.pageSize;
    const offset = (params.page - 1) * params.pageSize;
    const { rows } = await this.db.query<any>(
      `select id, school_id as schoolId, meal_key as mealKey, meal, people, image_url as imageUrl, comment, at, source, exception, exception_reason as exceptionReason, measure
         from dine_records ${whereSql} order by at desc limit ? offset ?`,
      [...args, limit, offset],
    );
    return { items: rows as DineRow[], total, page: params.page, pageSize: params.pageSize };
  }
}

