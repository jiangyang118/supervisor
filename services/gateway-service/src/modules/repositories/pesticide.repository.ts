import { Injectable, OnModuleInit } from '@nestjs/common';
import { DbService } from '../db.service';

@Injectable()
export class PesticideRepository implements OnModuleInit {
  constructor(private readonly db: DbService) {}

  async onModuleInit() {
    try {
      await this.db.query(
        `create table if not exists pesticide_records (
           id int primary key auto_increment,
           school_id int not null,
           sample varchar(255) not null,
           device varchar(128) not null,
           result varchar(8) not null,
           image_url varchar(255) null,
           remark varchar(255) null,
           at datetime not null,
           source varchar(16) not null,
           exception tinyint not null default 0,
           measure varchar(255) null,
           key idx_pest_school_at (school_id, at),
           key idx_pest_result_at (result, at)
         )`,
      );
      // Align types if older BIGINT schema exists
      await this.db.query(
        'alter table pesticide_records modify column id int not null auto_increment, modify column school_id int not null',
      );
    } catch {
      // best effort; real migrations handle structure in normal deployments
    }
  }

  async list(filters: {
    schoolId?: number; q?: string; result?: '合格'|'不合格'; start?: string; end?: string; page: number; pageSize: number;
  }) {
    const where: string[] = [];
    const params: any[] = [];
    if (filters.schoolId !== undefined && filters.schoolId !== null) { where.push('school_id = ?'); params.push(filters.schoolId); }
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
    schoolId: number; sample: string; device: string; result: '合格'|'不合格'; imageUrl?: string; remark?: string; at: string; source: 'manual'|'device'; exception: boolean; measure?: string;
  }): Promise<number> {
    const res = await this.db.query(
      `insert into pesticide_records(school_id, sample, device, result, image_url, remark, at, source, exception, measure)
       values(?,?,?,?,?,?,?,?,?,?)`,
      [rec.schoolId, rec.sample, rec.device, rec.result, rec.imageUrl || null, rec.remark || null, new Date(rec.at), rec.source, rec.exception ? 1 : 0, rec.measure || null],
    );
    return res.insertId || 0;
  }

  async setMeasure(id: number, measure?: string) {
    await this.db.query('update pesticide_records set measure = ? where id = ?', [measure || null, id]);
  }
}
