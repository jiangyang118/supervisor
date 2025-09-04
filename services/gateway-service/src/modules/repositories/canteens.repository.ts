import { Injectable } from '@nestjs/common';
import { DbService } from '../db.service';

export type CanteenRow = {
  id: number;
  schoolId: number;
  name: string;
  address?: string | null;
  licenseNo?: string | null;
  licenseExpireAt?: string | null;
  licenseImageUrl?: string | null;
};

@Injectable()
export class CanteensRepository {
  constructor(private readonly db: DbService) {}

  async list(schoolId?: number): Promise<CanteenRow[]> {
    const base =
      'select id, school_id as schoolId, name, address, license_no as licenseNo, license_expire_at as licenseExpireAt, license_image_url as licenseImageUrl from canteens';
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

