import { Injectable } from '@nestjs/common';
import { DbService } from '../db.service';

@Injectable()
export class PesticideRepository {
  constructor(private readonly db: DbService) {}

  async list(filters: {
    schoolId?: string; q?: string; result?: '合格'|'不合格'; start?: string; end?: string; page: number; pageSize: number;
  }) {
    const where: string[] = [];
    const params: any[] = [];
    if (filters.schoolId) { where.push('school_id = ?'); params.push(filters.schoolId); }
    if (filters.q) { where.push('(sample like ? or device like ?)'); params.push(`%${filters.q}%`, `%${filters.q}%`); }
    if (filters.result) { where.push('result = ?'); params.push(filters.result); }
    if (filters.start) { where.push('at >= ?'); params.push(new Date(filters.start)); }
    if (filters.end) { where.push('at <= ?'); params.push(new Date(filters.end)); }
    const base = `from pesticide_records ${where.length ? 'where ' + where.join(' and ') : ''}`;
    const totalRows = await this.db.query<any>(`select count(1) as c ${base}`, params);
    const total = Number(totalRows.rows[0]?.c || 0);
    const rows = await this.db.query<any>(
      `select id, school_id as schoolId, sample, device, result, image_url as imageUrl, remark, at, source, exception, measure ${base}
       order by at desc limit ? offset ?`,
      [...params, filters.pageSize, (filters.page - 1) * filters.pageSize],
    );
    return { items: rows.rows, total, page: filters.page, pageSize: filters.pageSize };
  }

  async insert(rec: {
    id: string; schoolId: string; sample: string; device: string; result: '合格'|'不合格'; imageUrl?: string; remark?: string; at: string; source: 'manual'|'device'; exception: boolean; measure?: string;
  }) {
    await this.db.query(
      `insert into pesticide_records(id, school_id, sample, device, result, image_url, remark, at, source, exception, measure)
       values(?,?,?,?,?,?,?,?,?,?,?)`,
      [rec.id, rec.schoolId, rec.sample, rec.device, rec.result, rec.imageUrl || null, rec.remark || null, new Date(rec.at), rec.source, rec.exception ? 1 : 0, rec.measure || null],
    );
  }

  async setMeasure(id: string, measure?: string) {
    await this.db.query('update pesticide_records set measure = ? where id = ?', [measure || null, id]);
  }
}

