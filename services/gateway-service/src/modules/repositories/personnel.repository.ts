import { Injectable, OnModuleInit } from '@nestjs/common';
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
export class PersonnelRepository implements OnModuleInit {
  constructor(private readonly db: DbService) {}

  async onModuleInit() {
    await this.ensureSchema();
  }

  private async ensureSchema() {
    try {
      await this.db.query(
        `create table if not exists school_personnel (
          id int primary key auto_increment,
          school_id int not null,
          canteen_id int null,
          name varchar(128) not null,
          gender varchar(8) null,
          phone varchar(32) null,
          job_title varchar(128) null,
          health_cert_no varchar(128) null,
          health_cert_authority varchar(255) null,
          health_cert_issue_at datetime null,
          health_cert_expire_at datetime null,
          health_cert_front_url varchar(1024) null,
          health_cert_back_url varchar(1024) null,
          enabled tinyint not null default 1,
          created_at datetime not null default current_timestamp,
          updated_at datetime not null default current_timestamp on update current_timestamp,
          key idx_personnel_school (school_id),
          key idx_personnel_canteen (canteen_id),
          key idx_personnel_expire (health_cert_expire_at)
        )`
      );
      // Align legacy schemas: add missing columns if table exists without them
      const { rows } = await this.db.query<any>(
        'select column_name as name from information_schema.columns where table_schema = database() and table_name = ?',
        ['school_personnel'],
      );
      const cols = new Set((rows || []).map((r: any) => String(r.name || r.COLUMN_NAME || '').toLowerCase()));
      const add = async (sql: string) => { try { await this.db.query(sql); } catch {} };
      if (!cols.has('canteen_id')) await add('alter table school_personnel add column canteen_id int null');
      if (!cols.has('gender')) await add('alter table school_personnel add column gender varchar(8) null');
      if (!cols.has('phone')) await add('alter table school_personnel add column phone varchar(32) null');
      if (!cols.has('job_title')) await add('alter table school_personnel add column job_title varchar(128) null');
      if (!cols.has('health_cert_no')) await add('alter table school_personnel add column health_cert_no varchar(128) null');
      if (!cols.has('health_cert_authority')) await add('alter table school_personnel add column health_cert_authority varchar(255) null');
      if (!cols.has('health_cert_issue_at')) await add('alter table school_personnel add column health_cert_issue_at datetime null');
      if (!cols.has('health_cert_expire_at')) await add('alter table school_personnel add column health_cert_expire_at datetime null');
      if (!cols.has('health_cert_front_url')) await add('alter table school_personnel add column health_cert_front_url varchar(1024) null');
      if (!cols.has('health_cert_back_url')) await add('alter table school_personnel add column health_cert_back_url varchar(1024) null');
      if (!cols.has('enabled')) await add('alter table school_personnel add column enabled tinyint not null default 1');
      if (!cols.has('created_at')) await add('alter table school_personnel add column created_at datetime not null default current_timestamp');
      if (!cols.has('updated_at')) await add('alter table school_personnel add column updated_at datetime not null default current_timestamp on update current_timestamp');
    } catch {}
  }

  async list(params: { schoolId: number; name?: string; phone?: string; canteenId?: number; page: number; pageSize: number }) {
    const where: string[] = ['p.school_id = ?'];
    const args: any[] = [params.schoolId];
    if (params.name) { where.push('p.name like ?'); args.push(`%${params.name}%`); }
    if (params.phone) { where.push('p.phone like ?'); args.push(`%${params.phone}%`); }
    if (params.canteenId) { where.push('p.canteen_id = ?'); args.push(params.canteenId); }
    const base = `from school_personnel p left join canteens c on c.id = p.canteen_id ${where.length ? 'where ' + where.join(' and ') : ''}`;
    try {
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
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (/no such table|doesn't exist|ER_NO_SUCH_TABLE/i.test(msg)) {
        return { items: [], total: 0, page: params.page, pageSize: params.pageSize };
      }
      throw e;
    }
  }

  async getById(id: number) {
    try {
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
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (/no such table|doesn't exist|ER_NO_SUCH_TABLE/i.test(msg)) return null;
      throw e;
    }
  }

  async insert(row: Omit<PersonnelRow, 'id' | 'createdAt' | 'updatedAt' | 'enabled'> & { enabled?: number }) {
    try {
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
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (/no such table|doesn't exist|ER_NO_SUCH_TABLE/i.test(msg)) {
        await this.ensureSchema();
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
      throw e;
    }
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
    try {
      await this.db.query(`update school_personnel set ${sets.join(', ')} where id = ?`, args);
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (/no such table|doesn't exist|ER_NO_SUCH_TABLE/i.test(msg)) return { ok: false } as any;
      throw e;
    }
    return { ok: true } as any;
  }

  async remove(id: number) {
    try {
      await this.db.query('delete from school_personnel where id = ?', [id]);
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (/no such table|doesn't exist|ER_NO_SUCH_TABLE/i.test(msg)) return { ok: true } as any;
      throw e;
    }
    return { ok: true } as any;
  }
}
