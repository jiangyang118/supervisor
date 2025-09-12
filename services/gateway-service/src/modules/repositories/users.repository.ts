import { Injectable, BadRequestException } from '@nestjs/common';
import { DbService } from '../db.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DbService) {}
  private cols: Set<string> | null = null;
  private async ensureCols() {
    if (this.cols) return this.cols;
    try {
      const { rows } = await this.db.query<any>(
        `select column_name as c from information_schema.columns where table_schema = database() and table_name = 'users'`
      );
      const cols = new Set((rows || []).map((r: any) => String(r.c)));
      // Best-effort schema alignment: add audit columns if missing
      try {
        if (!cols.has('created_by')) {
          await this.db.query('alter table users add column created_by varchar(255) null');
          cols.add('created_by');
        }
      } catch {}
      try {
        if (!cols.has('created_at')) {
          await this.db.query('alter table users add column created_at datetime default current_timestamp');
          cols.add('created_at');
        }
      } catch {}
      try {
        if (!cols.has('updated_at')) {
          await this.db.query('alter table users add column updated_at datetime default current_timestamp on update current_timestamp');
          cols.add('updated_at');
        }
      } catch {}
      this.cols = cols;
    } catch {
      this.cols = new Set<string>();
    }
    return this.cols;
  }

  async listUsers(): Promise<Array<{ id: number; username: string; displayName: string; enabled: number; roles: string[]; phone?: string; remark?: string; createdBy?: string; createdAt?: string; updatedAt?: string }>> {
    const cols = await this.ensureCols();
    const hasPhone = cols.has('phone');
    const hasRemark = cols.has('remark');
    const hasCreatedBy = cols.has('created_by');
    const hasCreated = cols.has('created_at');
    const hasUpdated = cols.has('updated_at');
    const selectExtra = [
      hasPhone ? 'u.phone' : 'null as phone',
      hasRemark ? 'u.remark' : 'null as remark',
      hasCreatedBy ? 'u.created_by as createdBy' : 'null as createdBy',
      hasCreated ? 'date(u.created_at) as createdAt' : 'null as createdAt',
      hasUpdated ? 'date(u.updated_at) as updatedAt' : 'null as updatedAt',
    ];
    const { rows } = await this.db.query<any>(
      `select u.id, u.username, u.display_name as displayName, u.enabled,
              ${selectExtra.join(', ')},
              group_concat(r.name separator ',') as roles
         from users u
         left join user_roles ur on ur.user_id = u.id
         left join roles r on r.id = ur.role_id
        group by u.id, u.username, u.display_name, u.enabled${hasPhone ? ', u.phone' : ''}${hasRemark ? ', u.remark' : ''}${hasCreatedBy ? ', u.created_by' : ''}${hasCreated ? ', u.created_at' : ''}${hasUpdated ? ', u.updated_at' : ''}
        order by u.id desc`);
    return (rows as any[]).map(r => ({
      id: Number(r.id),
      username: r.username,
      displayName: r.displayName,
      enabled: Number(r.enabled),
      roles: r.roles ? String(r.roles).split(',').filter(Boolean) : [],
      phone: r.phone || undefined,
      remark: r.remark || undefined,
      createdBy: r.createdBy || undefined,
      createdAt: r.createdAt || undefined,
      updatedAt: r.updatedAt || undefined,
    }));
  }

  async findByUsername(username: string) {
    const { rows } = await this.db.query<any>('select id, username, display_name as displayName, enabled from users where username = ? limit 1', [username]);
    return rows[0] ? { id: Number(rows[0].id), username: rows[0].username, displayName: rows[0].displayName, enabled: Number(rows[0].enabled) } : null;
  }

  async findById(id: number): Promise<{ id: number; username: string; displayName: string; enabled: number } | null> {
    const { rows } = await this.db.query<any>('select id, username, display_name as displayName, enabled from users where id = ? limit 1', [id]);
    return rows[0]
      ? { id: Number(rows[0].id), username: rows[0].username, displayName: rows[0].displayName, enabled: Number(rows[0].enabled) }
      : null;
  }

  async findWithRolesByUsername(username: string): Promise<
    | { id: number; username: string; displayName: string; enabled: number; roles: string[] }
    | null
  > {
    const { rows } = await this.db.query<any>(
      `select u.id, u.username, u.display_name as displayName, u.enabled,
              group_concat(r.name separator ',') as roles
         from users u
         left join user_roles ur on ur.user_id = u.id
         left join roles r on r.id = ur.role_id
        where u.username = ?
        group by u.id, u.username, u.display_name, u.enabled
        limit 1`,
      [username],
    );
    if (!rows[0]) return null;
    return {
      id: Number(rows[0].id),
      username: rows[0].username,
      displayName: rows[0].displayName,
      enabled: Number(rows[0].enabled),
      roles: rows[0].roles ? String(rows[0].roles).split(',').filter(Boolean) : [],
    };
  }

  async setUserRoles(userId: number, roleNames: string[]) {
    if (!roleNames || !roleNames.length) { await this.db.query('delete from user_roles where user_id = ?', [userId]); return; }
    const { rows: roleRows } = await this.db.query<any>('select id, name from roles where name in (' + (roleNames.map(() => '?').join(',')) + ')', roleNames);
    const roleIds = (roleRows as any[]).map(r => Number(r.id));
    await this.db.query('delete from user_roles where user_id = ?', [userId]);
    if (roleIds.length) {
      const values: any[] = [];
      const placeholders = roleIds.map(rid => { values.push(userId, rid); return '(?,?)'; }).join(',');
      await this.db.query('insert into user_roles(user_id, role_id) values ' + placeholders, values);
    }
  }

  async getCredentialByUsername(username: string): Promise<
    | { userId: number; salt: string; passwordHash: string }
    | null
  > {
    const { rows } = await this.db.query<any>(
      `select u.id as userId, uc.salt, uc.password_hash as passwordHash
         from users u
         join user_credentials uc on uc.user_id = u.id
        where u.username = ?
        limit 1`,
      [username],
    );
    if (!rows[0]) return null;
    return {
      userId: Number(rows[0].userId),
      salt: String(rows[0].salt),
      passwordHash: String(rows[0].passwordHash).toUpperCase(),
    };
  }

  async setCredential(userId: number, rawPassword: string) {
    const { createHash, randomBytes } = await import('crypto');
    const salt = randomBytes(8).toString('hex');
    const hash = createHash('sha256').update(salt + rawPassword).digest('hex').toUpperCase();
    await this.db.query('insert into user_credentials(user_id, salt, password_hash) values(?,?,?) on duplicate key update salt = values(salt), password_hash = values(password_hash)', [userId, salt, hash]);
  }

  async insertOne(b: { username: string; displayName: string; enabled?: boolean; phone?: string; remark?: string; createdBy?: string }) {
    const cols = await this.ensureCols();
    const fields = ['username', 'display_name'];
    const vals: any[] = [b.username, b.displayName];
    if (cols.has('enabled')) { fields.push('enabled'); vals.push(b.enabled ? 1 : 0); }
    if (cols.has('phone')) { fields.push('phone'); vals.push(b.phone || null); }
    if (cols.has('remark')) { fields.push('remark'); vals.push(b.remark || null); }
    if (cols.has('created_by')) { fields.push('created_by'); vals.push(b.createdBy || null); }
    const sql = `insert into users(${fields.join(',')}) values(${fields.map(() => '?').join(',')})`;
    try {
      const res = await this.db.query(sql, vals);
      return Number(res.insertId || 0);
    } catch (e: any) {
      const code = String(e?.code || e?.errno || '');
      // MySQL: ER_DUP_ENTRY = 1062
      if (code === 'ER_DUP_ENTRY' || Number(code) === 1062) {
        throw new BadRequestException('用户名已存在，或手机号对应账号已存在');
      }
      throw e;
    }
  }

  async updateOne(id: number, patch: { displayName?: string; phone?: string; remark?: string; enabled?: boolean }) {
    const cols = await this.ensureCols();
    const sets: string[] = [];
    const vals: any[] = [];
    if (patch.displayName !== undefined) { sets.push('display_name = ?'); vals.push(patch.displayName); }
    if (cols.has('phone') && patch.phone !== undefined) { sets.push('phone = ?'); vals.push(patch.phone || null); }
    if (cols.has('remark') && patch.remark !== undefined) { sets.push('remark = ?'); vals.push(patch.remark || null); }
    if (cols.has('enabled') && patch.enabled !== undefined) { sets.push('enabled = ?'); vals.push(patch.enabled ? 1 : 0); }
    if (!sets.length) return { ok: true } as any;
    vals.push(id);
    await this.db.query(`update users set ${sets.join(', ')} where id = ?`, vals);
    return { ok: true } as any;
  }

  async removeOne(id: number) {
    await this.db.query('delete from user_roles where user_id = ?', [id]);
    await this.db.query('delete from users where id = ?', [id]);
    return { ok: true } as any;
  }
}
