import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { DbService } from '../db.service';

export type CanteenLicenseRow = {
  id: number;
  schoolId: number;
  canteenId: number;
  type: string; // '营业执照' | '食品经营许可证'
  number?: string | null;
  authority?: string | null;
  permitItems?: string | null;
  expireAt?: string | null; // ISO
  imageUrl?: string | null;
};

@Injectable()
export class CanteenLicensesRepository implements OnModuleInit {
  constructor(private readonly db: DbService) {}

  async onModuleInit() {
    try {
      await this.db.query(
        `create table if not exists canteen_qualifications (
           id int primary key auto_increment,
           canteen_id int not null,
           qtype varchar(64) not null,
           number varchar(128) null,
           authority varchar(255) null,
           permit_items varchar(255) null,
           expire_at datetime null,
           image_url varchar(1024) null,
           created_at datetime not null default current_timestamp,
           key idx_cq_canteen (canteen_id),
           key idx_cq_expire (expire_at)
         )`
      );
      // Align legacy schemas: add missing columns when table exists without them
      const { rows } = await this.db.query<any>(
        'select column_name as name from information_schema.columns where table_schema = database() and table_name = ?',
        ['canteen_qualifications'],
      );
      const cols = new Set((rows || []).map((r: any) => String(r.name || r.COLUMN_NAME || '').toLowerCase()));
      const add = async (sql: string) => { try { await this.db.query(sql); } catch {} };
      if (!cols.has('qtype')) await add('alter table canteen_qualifications add column qtype varchar(64) not null default "营业执照"');
      if (!cols.has('number')) await add('alter table canteen_qualifications add column number varchar(128) null');
      if (!cols.has('authority')) await add('alter table canteen_qualifications add column authority varchar(255) null');
      if (!cols.has('permit_items')) await add('alter table canteen_qualifications add column permit_items varchar(255) null');
      if (!cols.has('expire_at')) await add('alter table canteen_qualifications add column expire_at datetime null');
      if (!cols.has('image_url')) await add('alter table canteen_qualifications add column image_url varchar(1024) null');
    } catch {}
  }

  async list(params: { schoolId?: number; canteenId?: number }) {
    const where: string[] = [];
    const args: any[] = [];
    let sql = `select q.id, c.school_id as schoolId, q.canteen_id as canteenId, q.qtype as type, q.number,
      q.authority, q.permit_items as permitItems, q.expire_at as expireAt, q.image_url as imageUrl
      from canteen_qualifications q join canteens c on c.id = q.canteen_id`;
    if (params.schoolId) { where.push('c.school_id = ?'); args.push(params.schoolId); }
    if (params.canteenId) { where.push('q.canteen_id = ?'); args.push(params.canteenId); }
    if (where.length) sql += ' where ' + where.join(' and ');
    sql += ' order by q.expire_at asc';
    const { rows } = await this.db.query<any>(sql, args);
    return rows as CanteenLicenseRow[];
  }

  async insert(row: { canteenId: number; type: string; number?: string; authority?: string; permitItems?: string; expireAt?: string; imageUrl?: string }) {
    if (!row?.canteenId || !row?.type) throw new BadRequestException('canteenId/type required');
    const res = await this.db.query(
      `insert into canteen_qualifications(canteen_id, qtype, number, authority, permit_items, expire_at, image_url)
       values(?,?,?,?,?,?,?)`,
      [row.canteenId, row.type, row.number || null, row.authority || null, row.permitItems || null, row.expireAt ? new Date(row.expireAt) : null, row.imageUrl || null],
    );
    return res.insertId || 0;
  }

  async update(id: number, patch: Partial<{ number: string; authority: string; permitItems: string; expireAt: string; imageUrl: string; type: string }>) {
    if (!id || !Number.isFinite(Number(id))) throw new BadRequestException('id required');
    const sets: string[] = [];
    const args: any[] = [];
    const map: Record<string, string> = { number: 'number', authority: 'authority', permitItems: 'permit_items', imageUrl: 'image_url', type: 'qtype' };
    for (const k of Object.keys(patch)) {
      if (k === 'expireAt') { sets.push('expire_at = ?'); args.push((patch as any).expireAt ? new Date((patch as any).expireAt) : null); continue; }
      const col = map[k];
      if (!col) continue;
      sets.push(`${col} = ?`);
      args.push((patch as any)[k]);
    }
    if (!sets.length) return { ok: true } as any;
    args.push(id);
    await this.db.query(`update canteen_qualifications set ${sets.join(', ')} where id = ?`, args);
    return { ok: true } as any;
  }

  async remove(id: number) {
    await this.db.query('delete from canteen_qualifications where id = ?', [id]);
    return { ok: true } as any;
  }
}
