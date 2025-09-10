import { Injectable } from '@nestjs/common';
import { DbService } from '../db.service';

export type PersonnelRow = {
  id: number;
  schoolId: number;
  canteenId?: number | null;
  name: string;
  gender?: '男' | '女' | null;
  phone?: string | null;
  jobTitle?: string | null;
  healthCertNo?: string | null;
  healthCertAuthority?: string | null;
  healthCertIssueAt?: string | null;
  healthCertExpireAt?: string | null;
  healthCertFrontUrl?: string | null;
  healthCertBackUrl?: string | null;
  enabled: number;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class PersonnelRepository {
  constructor(private readonly db: DbService) {}

  async list(params: { schoolId: number; name?: string; phone?: string; canteenId?: number; page: number; pageSize: number }) {
    const where: string[] = ['p.school_id = ?'];
    const args: any[] = [params.schoolId];
    if (params.name) { where.push('p.name like ?'); args.push(`%${params.name}%`); }
    if (params.phone) { where.push('p.phone like ?'); args.push(`%${params.phone}%`); }
    if (params.canteenId) { where.push('p.canteen_id = ?'); args.push(params.canteenId); }
    const base = `from school_personnel p left join canteens c on c.id = p.canteen_id ${where.length ? 'where ' + where.join(' and ') : ''}`;
    const cnt = await this.db.query<any>(`select count(1) as c ${base}`, args);
    const total = Number(cnt.rows?.[0]?.c || 0);
    const { rows } = await this.db.query<any>(
      `select p.id, p.school_id as schoolId, p.canteen_id as canteenId, p.name, p.gender, p.phone, p.job_title as jobTitle,
              p.health_cert_no as healthCertNo, p.health_cert_authority as healthCertAuthority,
              p.health_cert_issue_at as healthCertIssueAt, p.health_cert_expire_at as healthCertExpireAt,
              p.health_cert_front_url as healthCertFrontUrl, p.health_cert_back_url as healthCertBackUrl,
              p.enabled, p.created_at as createdAt, p.updated_at as updatedAt, c.name as canteenName
        ${base} order by coalesce(p.health_cert_expire_at, p.updated_at) asc limit ? offset ?`,
      [...args, params.pageSize, (params.page - 1) * params.pageSize],
    );
    return { items: rows, total, page: params.page, pageSize: params.pageSize };
  }

  async getById(id: number) {
    const { rows } = await this.db.query<any>(
      `select p.id, p.school_id as schoolId, p.canteen_id as canteenId, p.name, p.gender, p.phone, p.job_title as jobTitle,
              p.health_cert_no as healthCertNo, p.health_cert_authority as healthCertAuthority,
              p.health_cert_issue_at as healthCertIssueAt, p.health_cert_expire_at as healthCertExpireAt,
              p.health_cert_front_url as healthCertFrontUrl, p.health_cert_back_url as healthCertBackUrl,
              p.enabled, p.created_at as createdAt, p.updated_at as updatedAt, c.name as canteenName
         from school_personnel p
         left join canteens c on c.id = p.canteen_id
        where p.id = ? limit 1`,
      [id],
    );
    return rows?.[0] || null;
  }

  async insert(row: Omit<PersonnelRow, 'id' | 'createdAt' | 'updatedAt' | 'enabled'> & { enabled?: number }) {
    const res = await this.db.query(
      `insert into school_personnel(
         school_id, canteen_id, name, gender, phone, job_title,
         health_cert_no, health_cert_authority, health_cert_issue_at, health_cert_expire_at,
         health_cert_front_url, health_cert_back_url, enabled
       ) values(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        row.schoolId,
        row.canteenId || null,
        row.name,
        row.gender || null,
        row.phone || null,
        row.jobTitle || null,
        row.healthCertNo || null,
        row.healthCertAuthority || null,
        row.healthCertIssueAt ? new Date(row.healthCertIssueAt) : null,
        row.healthCertExpireAt ? new Date(row.healthCertExpireAt) : null,
        row.healthCertFrontUrl || null,
        row.healthCertBackUrl || null,
        row.enabled ?? 1,
      ],
    );
    return res.insertId || 0;
  }

  async update(id: number, patch: Partial<Omit<PersonnelRow, 'id' | 'createdAt' | 'updatedAt'>>) {
    const sets: string[] = [];
    const args: any[] = [];
    const map: Record<string, string> = {
      schoolId: 'school_id', canteenId: 'canteen_id', name: 'name', gender: 'gender', phone: 'phone', jobTitle: 'job_title',
      healthCertNo: 'health_cert_no', healthCertAuthority: 'health_cert_authority', healthCertFrontUrl: 'health_cert_front_url', healthCertBackUrl: 'health_cert_back_url',
    };
    for (const k of Object.keys(patch)) {
      if (k === 'healthCertIssueAt') { sets.push('health_cert_issue_at = ?'); args.push((patch as any)[k] ? new Date((patch as any)[k]) : null); continue; }
      if (k === 'healthCertExpireAt') { sets.push('health_cert_expire_at = ?'); args.push((patch as any)[k] ? new Date((patch as any)[k]) : null); continue; }
      if (k === 'enabled') { sets.push('enabled = ?'); args.push((patch as any)[k] ? 1 : 0); continue; }
      const col = map[k]; if (!col) continue; sets.push(`${col} = ?`); args.push((patch as any)[k]);
    }
    if (!sets.length) return { ok: true } as any;
    args.push(id);
    await this.db.query(`update school_personnel set ${sets.join(', ')} where id = ?`, args);
    return { ok: true } as any;
  }

  async remove(id: number) {
    await this.db.query('delete from school_personnel where id = ?', [id]);
    return { ok: true } as any;
  }
}
