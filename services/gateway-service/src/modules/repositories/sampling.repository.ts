import { Injectable } from '@nestjs/common';
import { DbService } from '../db.service';

export type SampleRow = {
  id: string;
  schoolId: string;
  sample: string;
  weight: number;
  imageUrl?: string | null;
  duration: number;
  by: string;
  cabinet?: string | null;
  at: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CLEARED';
  source: 'manual' | 'device';
  exception?: number;
  exceptionReason?: string | null;
  measure?: string | null;
};

export type CleanupRow = {
  id: string;
  schoolId: string;
  sampleId?: string | null;
  sample: string;
  weight: number;
  imageUrl?: string | null;
  method: string;
  by: string;
  at: string;
  source: 'manual' | 'cabinet';
};

@Injectable()
export class SamplingRepository {
  constructor(private readonly db: DbService) {}

  async insertSample(r: SampleRow) {
    await this.db.query(
      `insert into sampling_records(
         id, school_id, sample, weight, image_url, duration_hours, by_who, cabinet, at, status, source, exception, exception_reason, measure
       ) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        r.id,
        r.schoolId,
        r.sample,
        r.weight,
        r.imageUrl || null,
        r.duration,
        r.by,
        r.cabinet || null,
        new Date(r.at),
        r.status,
        r.source,
        r.exception ? 1 : 0,
        r.exceptionReason || null,
        r.measure || null,
      ],
    );
  }

  async updateSampleMeasure(id: string, measure?: string) {
    await this.db.query('update sampling_records set measure = ? where id = ?', [measure || null, id]);
  }

  async markSampleCleared(id: string) {
    await this.db.query('update sampling_records set status = ? where id = ?', ['CLEARED', id]);
  }

  async searchSamples(params: {
    schoolId: string;
    sample?: string;
    status?: 'ACTIVE' | 'EXPIRED' | 'CLEARED';
    exception?: boolean;
    start?: string;
    end?: string;
    page: number;
    pageSize: number;
  }): Promise<{ items: SampleRow[]; total: number; page: number; pageSize: number }>{
    const where: string[] = ['school_id = ?'];
    const args: any[] = [params.schoolId];
    if (params.sample) { where.push('sample like ?'); args.push(`%${params.sample}%`); }
    if (params.status) { where.push('status = ?'); args.push(params.status); }
    if (typeof params.exception === 'boolean') { where.push('exception = ?'); args.push(params.exception ? 1 : 0); }
    if (params.start) { where.push('at >= ?'); args.push(new Date(params.start)); }
    if (params.end) { where.push('at <= ?'); args.push(new Date(params.end)); }
    const whereSql = `where ${where.join(' and ')}`;
    const cnt = await this.db.query<any>(`select count(1) as c from sampling_records ${whereSql}`, args);
    const total = Number(cnt.rows[0]?.c || 0);
    const limit = params.pageSize;
    const offset = (params.page - 1) * params.pageSize;
    const { rows } = await this.db.query<any>(
      `select id, school_id as schoolId, sample, weight, image_url as imageUrl, duration_hours as duration, by_who as \`by\`, cabinet, at, status, source, exception, exception_reason as exceptionReason, measure
         from sampling_records ${whereSql}
         order by at desc
         limit ? offset ?`,
      [...args, limit, offset],
    );
    return { items: rows as SampleRow[], total, page: params.page, pageSize: params.pageSize };
  }

  async insertCleanup(r: CleanupRow) {
    await this.db.query(
      `insert into sampling_cleanups(
         id, school_id, sample_id, sample, weight, image_url, method, by_who, at, source
       ) values (?,?,?,?,?,?,?,?,?,?)`,
      [
        r.id,
        r.schoolId,
        r.sampleId || null,
        r.sample,
        r.weight,
        r.imageUrl || null,
        r.method,
        r.by,
        new Date(r.at),
        r.source,
      ],
    );
  }

  async listCleanups(params: { schoolId: string; page: number; pageSize: number }) {
    const whereSql = 'where school_id = ?';
    const cnt = await this.db.query<any>(`select count(1) as c from sampling_cleanups ${whereSql}`, [params.schoolId]);
    const total = Number(cnt.rows[0]?.c || 0);
    const limit = params.pageSize;
    const offset = (params.page - 1) * params.pageSize;
    const { rows } = await this.db.query<any>(
      `select id, school_id as schoolId, sample_id as sampleId, sample, weight, image_url as imageUrl, method, by_who as \`by\`, at, source
       from sampling_cleanups ${whereSql} order by at desc limit ? offset ?`,
      [params.schoolId, limit, offset],
    );
    return { items: rows as CleanupRow[], total, page: params.page, pageSize: params.pageSize };
  }
}
