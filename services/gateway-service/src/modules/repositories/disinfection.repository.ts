import { Injectable } from '@nestjs/common';
import { DbService } from '../db.service';

export type DisinfectionRow = {
  id: number;
  schoolId: number;
  method: string;
  duration: number;
  items: string;
  imageUrl?: string | null;
  at: string;
  source: 'manual' | 'device';
  exception: number; // 0/1
  exceptionReason?: string | null;
  measure?: string | null;
};

@Injectable()
export class DisinfectionRepository {
  constructor(private readonly db: DbService) {}

  async insert(r: Omit<DisinfectionRow, 'id' | 'exception'> & { exception?: number }) {
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

  async updateMeasure(id: number, measure?: string) {
    await this.db.query('update disinfection_records set measure = ? where id = ?', [measure || null, id]);
  }

  async search(params: {
    schoolId: number | string;
    method?: string;
    exception?: boolean;
    start?: string;
    end?: string;
    page: number;
    pageSize: number;
  }): Promise<{ items: DisinfectionRow[]; total: number; page: number; pageSize: number }>{
    const where: string[] = ['school_id = ?'];
    const args: any[] = [params.schoolId];
    if (params.method) { where.push('method = ?'); args.push(params.method); }
    if (typeof params.exception === 'boolean') { where.push('exception = ?'); args.push(params.exception ? 1 : 0); }
    if (params.start) { where.push('at >= ?'); args.push(new Date(params.start)); }
    if (params.end) { where.push('at <= ?'); args.push(new Date(params.end)); }
    const whereSql = `where ${where.join(' and ')}`;
    const cnt = await this.db.query<any>(`select count(1) as c from disinfection_records ${whereSql}`, args);
    const total = Number(cnt.rows[0]?.c || 0);
    const limit = params.pageSize;
    const offset = (params.page - 1) * params.pageSize;
    const { rows } = await this.db.query<any>(
      `select id, school_id as schoolId, method, duration_minutes as duration, items, image_url as imageUrl, at, source, exception, exception_reason as exceptionReason, measure
       from disinfection_records ${whereSql} order by at desc limit ? offset ?`,
      [...args, limit, offset],
    );
    return { items: rows as DisinfectionRow[], total, page: params.page, pageSize: params.pageSize };
  }
}

