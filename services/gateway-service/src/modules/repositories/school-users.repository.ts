import { Injectable } from '@nestjs/common';
import { DbService } from '../db.service';

@Injectable()
export class SchoolUsersRepository {
  constructor(private readonly db: DbService) {}
  private userCols: Set<string> | null = null;

  private async ensureUserCols() {
    if (this.userCols) return this.userCols;
    try {
      const { rows } = await this.db.query<any>(
        `select column_name as c from information_schema.columns where table_schema = database() and table_name = 'users'`,
      );
      this.userCols = new Set((rows || []).map((r: any) => String(r.c)));
    } catch {
      this.userCols = new Set<string>();
    }
    return this.userCols;
  }

  async ensureSchema() {
    await this.db.query(
      'create table if not exists school_users(user_id int not null, school_id int not null, unique key uk_user_school(user_id, school_id))',
    );
  }

  async bind(userId: number, schoolId: number) {
    await this.ensureSchema();
    await this.db.query('insert ignore into school_users(user_id, school_id) values(?,?)', [userId, schoolId]);
  }

  async listSchools(userId: number): Promise<number[]> {
    await this.ensureSchema();
    const { rows } = await this.db.query<any>('select school_id as sid from school_users where user_id = ?', [userId]);
    return (rows || []).map((r: any) => Number(r.sid));
  }

  async listAccounts(params: { schoolId?: number; q?: string }) {
    try {
      await this.ensureSchema();
      const cols = await this.ensureUserCols();
      const hasPhone = cols.has('phone');
      const hasRemark = cols.has('remark');
      const where: string[] = [];
      const args: any[] = [];
      where.push('su.user_id = u.id');
      where.push('su.school_id = s.id');
      if (params.schoolId && Number.isFinite(Number(params.schoolId))) {
        where.push('su.school_id = ?');
        args.push(Number(params.schoolId));
      }
      if (params.q && String(params.q).trim()) {
        const kw = `%${String(params.q).trim()}%`;
        if (hasPhone) {
          where.push('(u.username like ? or u.display_name like ? or coalesce(u.phone, "") like ?)');
          args.push(kw, kw, kw);
        } else {
          where.push('(u.username like ? or u.display_name like ?)');
          args.push(kw, kw);
        }
      }
      const selectPhone = hasPhone ? 'u.phone' : 'null as phone';
      const selectRemark = hasRemark ? 'u.remark' : 'null as remark';
      const groupExtras: string[] = [];
      if (hasPhone) groupExtras.push('u.phone');
      if (hasRemark) groupExtras.push('u.remark');
      const sql = `
        select u.id, u.username, u.display_name as displayName, u.enabled,
               ${selectPhone}, ${selectRemark},
               s.id as schoolId, s.name as schoolName,
               group_concat(r.name separator ',') as roles
          from school_users su
          join users u on su.user_id = u.id
          join schools s on su.school_id = s.id
          left join user_roles ur on ur.user_id = u.id
          left join roles r on r.id = ur.role_id
         ${where.length ? 'where ' + where.join(' and ') : ''}
         group by u.id, u.username, u.display_name, u.enabled${groupExtras.length ? ', ' + groupExtras.join(', ') : ''}, s.id, s.name
         order by u.id desc`;
      const { rows } = await this.db.query<any>(sql, args);
      return (rows || []).map((r: any) => ({
        id: Number(r.id),
        username: r.username,
        displayName: r.displayName,
        enabled: !!Number(r.enabled),
        phone: r.phone || undefined,
        remark: r.remark || undefined,
        schoolId: Number(r.schoolId),
        schoolName: r.schoolName,
        roles: r.roles ? String(r.roles).split(',').filter(Boolean) : [],
      }));
    } catch (e: any) {
      const msg = String(e?.message || '');
      // If tables are missing or DB not ready, return empty list instead of 500
      if (/doesn't exist|unknown table|no such table|ER_NO_SUCH_TABLE/i.test(msg)) return [];
      throw e;
    }
  }

  async unbindAll(userId: number) {
    await this.ensureSchema();
    await this.db.query('delete from school_users where user_id = ?', [userId]);
  }
}
