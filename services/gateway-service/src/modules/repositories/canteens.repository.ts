import { Injectable, OnModuleInit } from '@nestjs/common';
import { DbService } from '../db.service';

export type CanteenRow = {
  id: number;
  schoolId: number;
  name: string;
  code?: string | null;
  address?: string | null;
  manager?: string | null;
  phone?: string | null;
  enabled?: number | null;
  licenseNo?: string | null;
  licenseExpireAt?: string | null;
  licenseImageUrl?: string | null;
};

@Injectable()
export class CanteensRepository implements OnModuleInit {
  constructor(private readonly db: DbService) {}

  async onModuleInit() {
    try {
      // Create master table if missing (best effort, for demo/dev without migrations)
      await this.db.query(
        `create table if not exists canteens (
           id int primary key auto_increment,
           school_id int not null,
           name varchar(255) not null,
           code varchar(64) null,
           address varchar(255) null,
           manager varchar(128) null,
           phone varchar(32) null,
            enabled tinyint not null default 1,
           license_no varchar(128) null,
           license_expire_at datetime null,
           license_image_url varchar(1024) null,
           created_at datetime not null default current_timestamp,
           key idx_canteens_school (school_id),
           key idx_canteens_name (name)
         )`
      );
      // Align legacy columns if existed without manager/phone
      const { rows } = await this.db.query<any>(
        'select column_name as name from information_schema.columns where table_schema = database() and table_name = ?',[ 'canteens' ],
      );
      const cols = new Set((rows || []).map((r: any) => (r.name || r.COLUMN_NAME || '').toString().toLowerCase()));
      if (!cols.has('manager')) { try { await this.db.query('alter table canteens add column manager varchar(128) null'); } catch {} }
      if (!cols.has('phone')) { try { await this.db.query('alter table canteens add column phone varchar(32) null'); } catch {} }
      if (!cols.has('code')) { try { await this.db.query('alter table canteens add column code varchar(64) null'); } catch {} }
      if (!cols.has('enabled')) { try { await this.db.query('alter table canteens add column enabled tinyint not null default 1'); } catch {} }
    } catch {}
  }

  async list(schoolId?: number, enabled?: boolean | 'all'): Promise<CanteenRow[]> {
    const base =
      'select id, school_id as schoolId, name, code, address, manager, phone, enabled, license_no as licenseNo, license_expire_at as licenseExpireAt, license_image_url as licenseImageUrl from canteens';
    const where: string[] = [];
    const args: any[] = [];
    if (schoolId !== undefined && schoolId !== null) { where.push('school_id = ?'); args.push(schoolId); }
    if (enabled !== 'all' && typeof enabled !== 'undefined') { where.push('enabled = ?'); args.push(enabled ? 1 : 0); }
    const sql = [base, where.length ? 'where ' + where.join(' and ') : '', 'order by id desc'].join(' ');
    const { rows } = await this.db.query<any>(sql, args);
    return rows as CanteenRow[];
  }

  async create(b: {
    schoolId: number;
    name: string;
    code?: string;
    address?: string;
    manager?: string;
    phone?: string;
    enabled?: boolean;
    licenseExpireAt?: string;
    licenseNo?: string;
    licenseImageUrl?: string;
  }): Promise<number> {
    const { insertId } = await this.db.query(
      `insert into canteens(school_id, name, code, address, manager, phone, enabled, license_no, license_expire_at, license_image_url)
       values(?,?,?,?,?,?,?,?,?,?)`,
      [
        b.schoolId,
        b.name,
        b.code || null,
        b.address || null,
        b.manager || null,
        b.phone || null,
        (b.enabled ?? true) ? 1 : 0,
        b.licenseNo || null,
        b.licenseExpireAt || null,
        b.licenseImageUrl || null,
      ],
    );
    return Number(insertId || 0);
  }
}
