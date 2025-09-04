import { Injectable } from '@nestjs/common';
import { DbService } from '../db.service';

export type StaffRow = {
  id: number;
  schoolId: number;
  name: string;
  jobTitle?: string | null;
  phone?: string | null;
  healthCertNo?: string | null;
  enabled: number; // 0/1
  createdAt: string;
};

@Injectable()
export class StaffRepository {
  constructor(private readonly db: DbService) {}

  async search(params: { schoolId: number; q?: string; page: number; pageSize: number }) {
    const where: string[] = ['school_id = ?'];
    const args: any[] = [params.schoolId];
    if (params.q) {
      where.push('(name like ? or phone like ? or job_title like ? or health_cert_no like ?)');
      const like = `%${params.q}%`;
      args.push(like, like, like, like);
    }
    const whereSql = `where ${where.join(' and ')}`;
    const cnt = await this.db.query<any>(`select count(1) as c from school_staff ${whereSql}`, args);
    const total = Number(cnt.rows[0]?.c || 0);
    const limit = params.pageSize;
    const offset = (params.page - 1) * params.pageSize;
    const { rows } = await this.db.query<any>(
      `select id, school_id as schoolId, name, job_title as jobTitle, phone, health_cert_no as healthCertNo, enabled, created_at as createdAt
       from school_staff ${whereSql} order by created_at desc limit ? offset ?`,
      [...args, limit, offset],
    );
    const items: StaffRow[] = (rows as any[]).map((r) => ({
      ...r,
      id: Number(r.id),
      schoolId: Number(r.schoolId),
      enabled: Number(r.enabled),
    }));
    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  async insertOne(r: Omit<StaffRow, 'id' | 'enabled' | 'createdAt'> & { enabled?: number }) {
    const res = await this.db.query(
      `insert into school_staff(school_id, name, job_title, phone, health_cert_no, enabled)
       values(?,?,?,?,?,?)`,
      [r.schoolId, r.name, r.jobTitle || null, r.phone || null, r.healthCertNo || null, r.enabled ?? 1],
    );
    return res.insertId || 0;
  }

  async bulkInsert(rows: Array<Omit<StaffRow, 'id' | 'createdAt'>>) {
    if (!rows.length) return 0;
    const values: any[] = [];
    const placeholders = rows
      .map((r) => {
        values.push(r.schoolId, r.name, r.jobTitle || null, r.phone || null, r.healthCertNo || null, r.enabled ?? 1);
        return '(?,?,?,?,?,?)';
      })
      .join(',');
    const sql = `insert into school_staff(school_id, name, job_title, phone, health_cert_no, enabled) values ${placeholders}`;
    const res = await this.db.query(sql, values);
    return res.affectedRows || rows.length;
  }

  async update(id: number, patch: Partial<Omit<StaffRow, 'id' | 'schoolId' | 'createdAt'>>) {
    const sets: string[] = [];
    const args: any[] = [];
    if (patch.name !== undefined) { sets.push('name = ?'); args.push(patch.name); }
    if (patch.jobTitle !== undefined) { sets.push('job_title = ?'); args.push(patch.jobTitle); }
    if (patch.phone !== undefined) { sets.push('phone = ?'); args.push(patch.phone); }
    if (patch.healthCertNo !== undefined) { sets.push('health_cert_no = ?'); args.push(patch.healthCertNo); }
    if (patch.enabled !== undefined) { sets.push('enabled = ?'); args.push(patch.enabled ? 1 : 0); }
    if (!sets.length) return { ok: true } as any;
    await this.db.query(`update school_staff set ${sets.join(', ')} where id = ?`, [...args, id]);
    return { ok: true } as any;
  }

  async remove(id: number) {
    await this.db.query('delete from school_staff where id = ?', [id]);
    return { ok: true } as any;
  }
}
