import { Injectable, OnModuleInit } from '@nestjs/common';
import { DbService } from '../db.service';

export type CanteenRow = {
  id: number;
  schoolId: number;
  name: string;
  address?: string | null;
  manager?: string | null;
  phone?: string | null;
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
           address varchar(255) null,
           manager varchar(128) null,
           phone varchar(32) null,
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
    } catch {}
  }

  async list(schoolId?: number): Promise<CanteenRow[]> {
    const base =
      'select id, school_id as schoolId, name, address, manager, phone, license_no as licenseNo, license_expire_at as licenseExpireAt, license_image_url as licenseImageUrl from canteens';
    const { rows } = schoolId
      ? await this.db.query<any>(base + ' where school_id = ? order by id desc', [schoolId])
      : await this.db.query<any>(base + ' order by id desc');
    return rows as CanteenRow[];
  }

  async create(b: {
    schoolId: number;
    name: string;
    address?: string;
    licenseExpireAt?: string;
    licenseNo?: string;
    licenseImageUrl?: string;
  }): Promise<number> {
    const { insertId } = await this.db.query(
      `insert into canteens(school_id, name, address, license_no, license_expire_at, license_image_url)
       values(?,?,?,?,?,?)`,
      [
        b.schoolId,
        b.name,
        b.address || null,
        b.licenseNo || null,
        b.licenseExpireAt || null,
        b.licenseImageUrl || null,
      ],
    );
    return Number(insertId || 0);
  }
}
