import { Injectable } from '@nestjs/common';
import { DbService } from '../db.service';

export type SchoolMCRow = {
  id: string;
  school_id: string;
  staff: string;
  temp: number;
  result: '正常' | '异常';
  at: string;
  source: 'manual' | 'device';
  reported: number;
  measure?: string | null;
};

@Injectable()
export class SchoolMorningChecksRepository {
  constructor(private readonly db: DbService) {}

  async insert(rec: {
    id: string; schoolId: string; staff: string; temp: number; result: '正常'|'异常'; at: string; source: 'manual'|'device'; reported: boolean; measure?: string;
  }) {
    await this.db.query(
      `insert ignore into school_morning_checks(
        id, school_id, staff, temp, result, at, source, reported, measure
      ) values (?,?,?,?,?,?,?,?,?)`,
      [rec.id, rec.schoolId, rec.staff, rec.temp, rec.result, new Date(rec.at), rec.source, rec.reported ? 1 : 0, rec.measure || null]
    );
  }

  async setMeasure(id: string, measure?: string) {
    await this.db.query('update school_morning_checks set measure = ? where id = ?', [measure || null, id]);
  }

  async remove(id: string) {
    await this.db.query('delete from school_morning_checks where id = ?', [id]);
  }

  async list(params: {
    schoolId: string;
    staff?: string;
    result?: '正常' | '异常';
    start?: string;
    end?: string;
    page: number;
    pageSize: number;
  }): Promise<{ items: SchoolMCRow[]; total: number }>{
    const where: string[] = ['school_id = ?'];
    const args: any[] = [params.schoolId];
    if (params.staff) {
      where.push('staff like ?');
      args.push(`%${params.staff}%`);
    }
    if (params.result) {
      where.push('result = ?');
      args.push(params.result);
    }
    if (params.start) {
      where.push('at >= ?');
      args.push(new Date(params.start));
    }
    if (params.end) {
      where.push('at <= ?');
      args.push(new Date(params.end));
    }
    const whereSql = where.length ? `where ${where.join(' and ')}` : '';
    const { rows: countRows } = await this.db.query<{ total: number }>(
      `select count(*) as total from school_morning_checks ${whereSql}`,
      args,
    );
    const total: number = Number(countRows?.[0]?.total || 0);
    const limit = params.pageSize;
    const offset = (params.page - 1) * params.pageSize;
    const { rows } = await this.db.query<SchoolMCRow>(
      `select id, school_id, staff, temp, result, at, source, reported, measure
       from school_morning_checks ${whereSql}
       order by at desc
       limit ? offset ?`,
      [...args, limit, offset],
    );
    return { items: rows, total };
  }
}
