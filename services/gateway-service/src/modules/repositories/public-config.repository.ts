import { Injectable } from '@nestjs/common';
import { DbService } from '../db.service';

export type PublicConfigRow = {
  schoolId: number;
  live: boolean;
  rating: boolean;
  orgCert: boolean;
  staffCert: boolean;
  level: boolean;
  trace: boolean;
  menu: boolean;
  updatedAt: string;
};

@Injectable()
export class PublicConfigRepository {
  constructor(private readonly db: DbService) {}

  async ensureDefault(schoolId: number) {
    await this.db.query(
      `insert ignore into public_config(school_id, live, rating, org_cert, staff_cert, level, \`trace\`, menu)
       values(?,1,1,1,1,1,1,1)`,
      [schoolId],
    );
  }

  async get(schoolId: number): Promise<PublicConfigRow | null> {
    const { rows } = await this.db.query<any>(
      `select school_id as schoolId, live, rating, org_cert as orgCert, staff_cert as staffCert,
              level, \`trace\` as \`trace\`, menu, updated_at as updatedAt
         from public_config where school_id = ? limit 1`,
      [schoolId],
    );
    if (!rows || !rows[0]) return null;
    const r = rows[0];
    return {
      schoolId: Number(r.schoolId),
      live: !!r.live,
      rating: !!r.rating,
      orgCert: !!r.orgCert,
      staffCert: !!r.staffCert,
      level: !!r.level,
      trace: !!r.trace,
      menu: !!r.menu,
      updatedAt: r.updatedAt,
    };
  }

  async update(schoolId: number, patch: Partial<Omit<PublicConfigRow, 'schoolId' | 'updatedAt'>>) {
    const sets: string[] = [];
    const args: any[] = [];
    const map: Record<string, string> = {
      live: 'live',
      rating: 'rating',
      orgCert: 'org_cert',
      staffCert: 'staff_cert',
      level: 'level',
      trace: 'trace',
      menu: 'menu',
    } as any;
    for (const k of Object.keys(patch)) {
      const col = map[k];
      if (!col) continue;
      sets.push(`${col} = ?`);
      args.push((patch as any)[k] ? 1 : 0);
    }
    sets.push('updated_at = current_timestamp');
    await this.db.query(`update public_config set ${sets.join(', ')} where school_id = ?`, [...args, schoolId]);
  }

  async insertAudit(schoolId: number, byUser?: string, changes?: any) {
    await this.db.query(
      `insert into public_config_audit(school_id, by_user, changes_json) values(?,?,?)`,
      [schoolId, byUser || null, changes ? JSON.stringify(changes) : null],
    );
  }

  async listAudit(schoolId: number) {
    const { rows } = await this.db.query<any>(
      `select id, school_id as schoolId, by_user as by, at, changes_json as changes from public_config_audit where school_id = ? order by at desc`,
      [schoolId],
    );
    return rows;
  }
}

