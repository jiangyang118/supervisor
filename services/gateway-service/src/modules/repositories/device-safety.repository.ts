import { Injectable, OnModuleInit } from '@nestjs/common';
import { DbService } from '../db.service';

export type DeviceSafetyRow = {
  id: number;
  schoolId: number;
  canteenId?: number | null;
  deviceName: string;
  items: string; // comma separated
  result: '正常' | '异常';
  description?: string | null;
  measures?: string | null;
  handler?: string | null;
  imageUrl?: string | null;
  signatureData?: string | null; // base64 data URL
  checkDate: string; // datetime
  createdAt: string; // datetime
};

@Injectable()
export class DeviceSafetyRepository implements OnModuleInit {
  constructor(private readonly db: DbService) {}

  async onModuleInit() {
    try {
      await this.db.query(
        `create table if not exists device_safety_checks (
           id int primary key auto_increment,
           school_id int not null,
           canteen_id int null,
           device_name varchar(128) not null,
           items varchar(512) not null,
           result varchar(8) not null,
           description varchar(1024) null,
           measures varchar(1024) null,
           handler varchar(128) null,
           image_url varchar(512) null,
           signature_data text null,
           check_date datetime not null,
           created_at datetime not null,
           key idx_ds_school_date (school_id, check_date)
         )`,
      );
    } catch {}
  }

  async insert(r: Omit<DeviceSafetyRow, 'id' | 'createdAt'>) {
    const sql = `insert into device_safety_checks(
      school_id, canteen_id, device_name, items, result, description, measures, handler, image_url, signature_data, check_date, created_at
    ) values (?,?,?,?,?,?,?,?,?,?,?,?)`;
    const args = [
      r.schoolId,
      r.canteenId ?? null,
      r.deviceName,
      r.items,
      r.result,
      r.description ?? null,
      r.measures ?? null,
      r.handler ?? null,
      r.imageUrl ?? null,
      r.signatureData ?? null,
      new Date(r.checkDate),
      new Date(),
    ];
    const res = await this.db.query(sql, args);
    return res.insertId || 0;
  }

  async getById(id: number): Promise<DeviceSafetyRow | null> {
    const { rows } = await this.db.query<any>(
      `select id, school_id as schoolId, canteen_id as canteenId, device_name as deviceName, items, result, description, measures, handler, image_url as imageUrl, signature_data as signatureData, check_date as checkDate, created_at as createdAt from device_safety_checks where id = ? limit 1`,
      [id],
    );
    return rows?.[0] || null;
  }

  async search(params: { schoolId: number; canteenId?: number; start?: string; end?: string; page: number; pageSize: number }) {
    const where: string[] = ['school_id = ?'];
    const args: any[] = [params.schoolId];
    if (params.canteenId) { where.push('canteen_id = ?'); args.push(params.canteenId); }
    if (params.start) { where.push('check_date >= ?'); args.push(new Date(params.start)); }
    if (params.end) { where.push('check_date <= ?'); args.push(new Date(params.end)); }
    const whereSql = `where ${where.join(' and ')}`;
    const cnt = await this.db.query<any>(`select count(1) as c from device_safety_checks ${whereSql}`, args);
    const total = Number(cnt.rows?.[0]?.c || 0);
    const { rows } = await this.db.query<any>(
      `select id, school_id as schoolId, canteen_id as canteenId, device_name as deviceName, items, result, description, measures, handler, image_url as imageUrl, signature_data as signatureData, check_date as checkDate, created_at as createdAt
       from device_safety_checks ${whereSql} order by check_date desc limit ? offset ?`,
      [...args, params.pageSize, (params.page - 1) * params.pageSize],
    );
    return { items: rows as DeviceSafetyRow[], total, page: params.page, pageSize: params.pageSize };
  }

  async update(
    id: number,
    r: Partial<{
      canteenId?: number | null;
      deviceName: string;
      items: string; // comma separated
      result: '正常' | '异常';
      description?: string | null;
      measures?: string | null;
      handler?: string | null;
      imageUrl?: string | null;
      signatureData?: string | null;
      checkDate: string; // datetime
    }>,
  ) {
    const fields: string[] = [];
    const args: any[] = [];
    if (r.canteenId !== undefined) { fields.push('canteen_id = ?'); args.push(r.canteenId ?? null); }
    if (r.deviceName !== undefined) { fields.push('device_name = ?'); args.push(r.deviceName); }
    if (r.items !== undefined) { fields.push('items = ?'); args.push(r.items); }
    if (r.result !== undefined) { fields.push('result = ?'); args.push(r.result); }
    if (r.description !== undefined) { fields.push('description = ?'); args.push(r.description ?? null); }
    if (r.measures !== undefined) { fields.push('measures = ?'); args.push(r.measures ?? null); }
    if (r.handler !== undefined) { fields.push('handler = ?'); args.push(r.handler ?? null); }
    if (r.imageUrl !== undefined) { fields.push('image_url = ?'); args.push(r.imageUrl ?? null); }
    if (r.signatureData !== undefined) { fields.push('signature_data = ?'); args.push(r.signatureData ?? null); }
    if (r.checkDate !== undefined) { fields.push('check_date = ?'); args.push(new Date(r.checkDate)); }
    if (fields.length === 0) return { affectedRows: 0 } as any;
    const sql = `update device_safety_checks set ${fields.join(', ')} where id = ?`;
    const res = await this.db.query(sql, [...args, id]);
    return res;
  }
}
