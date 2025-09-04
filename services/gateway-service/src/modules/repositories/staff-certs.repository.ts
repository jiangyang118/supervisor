import { Injectable } from '@nestjs/common';
import { DbService } from '../db.service';

export type StaffCertRow = {
  id: number;
  schoolId: number;
  staffId: number;
  certNo?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  staffName?: string;
};

@Injectable()
export class StaffCertsRepository {
  constructor(private readonly db: DbService) {}

  async list(params: {
    schoolId: number;
    staffId?: number;
    q?: string; // search by staff name or cert no
    page: number;
    pageSize: number;
  }) {
    const where: string[] = ['c.school_id = ?'];
    const args: any[] = [params.schoolId];
    if (params.staffId) { where.push('c.staff_id = ?'); args.push(params.staffId); }
    if (params.q) {
      where.push('(s.name like ? or c.cert_no like ?)');
      const like = `%${params.q}%`;
      args.push(like, like);
    }
    const whereSql = `where ${where.join(' and ')}`;
    const cnt = await this.db.query<any>(
      `select count(1) as c from school_staff_certs c left join school_staff s on s.id = c.staff_id ${whereSql}`,
      args,
    );
    const total = Number(cnt.rows[0]?.c || 0);
    const limit = params.pageSize;
    const offset = (params.page - 1) * params.pageSize;
    const { rows } = await this.db.query<any>(
      `select c.id, c.school_id as schoolId, c.staff_id as staffId, c.cert_no as certNo,
              c.start_at as startAt, c.end_at as endAt, c.image_url as imageUrl, c.created_at as createdAt,
              s.name as staffName
         from school_staff_certs c
         left join school_staff s on s.id = c.staff_id
        ${whereSql}
        order by coalesce(c.end_at, c.created_at) asc
        limit ? offset ?`,
      [...args, limit, offset],
    );
    const items: StaffCertRow[] = (rows as any[]).map((r) => ({
      ...r,
      id: Number(r.id),
      schoolId: Number(r.schoolId),
      staffId: Number(r.staffId),
    }));
    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  async insertOne(r: Omit<StaffCertRow, 'id' | 'createdAt' | 'staffName'>) {
    const res = await this.db.query(
      `insert into school_staff_certs(school_id, staff_id, cert_no, start_at, end_at, image_url)
       values(?,?,?,?,?,?)`,
      [r.schoolId, r.staffId, r.certNo || null, r.startAt ? new Date(r.startAt) : null, r.endAt ? new Date(r.endAt) : null, r.imageUrl || null],
    );
    return res.insertId || 0;
  }

  async update(id: number, patch: Partial<Omit<StaffCertRow, 'id' | 'schoolId' | 'staffId' | 'createdAt' | 'staffName'>>) {
    const sets: string[] = [];
    const args: any[] = [];
    if (patch.certNo !== undefined) { sets.push('cert_no = ?'); args.push(patch.certNo); }
    if (patch.startAt !== undefined) { sets.push('start_at = ?'); args.push(patch.startAt ? new Date(patch.startAt) : null); }
    if (patch.endAt !== undefined) { sets.push('end_at = ?'); args.push(patch.endAt ? new Date(patch.endAt) : null); }
    if (patch.imageUrl !== undefined) { sets.push('image_url = ?'); args.push(patch.imageUrl); }
    if (!sets.length) return { ok: true } as any;
    await this.db.query(`update school_staff_certs set ${sets.join(', ')} where id = ?`, [...args, id]);
    return { ok: true } as any;
  }

  async remove(id: number) {
    await this.db.query('delete from school_staff_certs where id = ?', [id]);
    return { ok: true } as any;
  }
}

