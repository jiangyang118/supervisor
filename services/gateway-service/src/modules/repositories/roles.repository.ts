import { ConflictException, Injectable } from '@nestjs/common';
import { DbService } from '../db.service';

@Injectable()
export class RolesRepository {
  constructor(private readonly db: DbService) {}
  private cols: Set<string> | null = null;
  private async ensureCols() {
    if (this.cols) return this.cols;
    try {
      const { rows } = await this.db.query<any>(
        `select column_name as c from information_schema.columns where table_schema = database() and table_name = 'roles'`
      );
      this.cols = new Set((rows || []).map((r: any) => String(r.c)));
    } catch {
      this.cols = new Set<string>();
    }
    return this.cols;
  }

  async listRoles(): Promise<Array<{ name: string; permissions: string[] }>> {
    const { rows } = await this.db.query<any>(
      `select r.name, group_concat(rp.permission_key separator ',') as perms
         from roles r
         left join role_permissions rp on rp.role_id = r.id
        group by r.id, r.name order by r.name asc`);
    return (rows as any[]).map(r => ({ name: r.name, permissions: r.perms ? String(r.perms).split(',').filter(Boolean) : [] }));
  }

  async setPermissions(name: string, perms: string[]) {
    const roleRes = await this.db.query<any>('select id from roles where name = ? limit 1', [name]);
    const roleId = Number(roleRes.rows?.[0]?.id || 0);
    if (!roleId) throw new Error('role not found');
    await this.db.query('delete from role_permissions where role_id = ?', [roleId]);
    if (perms && perms.length) {
      const values: any[] = [];
      const placeholders = perms.map(k => { values.push(roleId, k); return '(?,?)'; }).join(',');
      await this.db.query('insert into role_permissions(role_id, permission_key) values ' + placeholders, values);
    }
  }

  async createIfNotExists(name: string, remark?: string) {
    await this.db.query('insert ignore into roles(name) values(?)', [name]);
    if (remark) {
      try {
        await this.db.query('update roles set remark = ? where name = ?', [remark, name]);
      } catch {
        // remark column may not exist; ignore
      }
    }
    return { ok: true } as any;
  }

  async search(params: { schoolId?: number; q?: string }) {
    const cols = await this.ensureCols();
    const hasSchool = cols.has('school_id');
    const hasRemark = cols.has('remark');
    const hasCreated = cols.has('created_at');
    const hasUpdated = cols.has('updated_at');

    const where: string[] = [];
    const values: any[] = [];
    if (hasSchool && params.schoolId && Number.isFinite(Number(params.schoolId))) {
      where.push('school_id = ?'); values.push(Number(params.schoolId));
    }
    if (params.q && String(params.q).trim()) {
      if (hasRemark) {
        where.push('(name like ? or coalesce(remark, "") like ?)');
        const kw = `%${String(params.q).trim()}%`; values.push(kw, kw);
      } else {
        where.push('(name like ?)');
        const kw = `%${String(params.q).trim()}%`; values.push(kw);
      }
    }

    const selectParts = [
      'id',
      hasSchool ? 'school_id as schoolId' : '1 as schoolId',
      'name',
      hasRemark ? 'remark' : 'null as remark',
      hasCreated ? 'date(created_at) as createdAt' : 'null as createdAt',
      hasUpdated ? 'date(updated_at) as updatedAt' : 'null as updatedAt',
    ];
    const sql = `select ${selectParts.join(', ')} from roles ${where.length ? 'where ' + where.join(' and ') : ''} order by id desc`;
    const { rows } = await this.db.query<any>(sql, values);
    return rows as Array<{ id: number; schoolId: number; name: string; remark?: string; createdAt: string; updatedAt: string }>;
  }

  async create(schoolId: number, name: string, remark?: string) {
    const cols = await this.ensureCols();
    const hasSchool = cols.has('school_id');
    const hasRemark = cols.has('remark');
    let sql = 'insert into roles(';
    const fields: string[] = [];
    const vals: any[] = [];
    if (hasSchool) { fields.push('school_id'); vals.push(schoolId); }
    fields.push('name'); vals.push(name);
    if (hasRemark) { fields.push('remark'); vals.push(remark || null); }
    sql += fields.join(', ') + ') values(' + fields.map(() => '?').join(',') + ')';
    try {
      const { insertId } = await this.db.query(sql, vals);
      return { id: Number(insertId || 0) };
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (msg.includes('Duplicate entry') || msg.includes('ER_DUP_ENTRY')) {
        throw new ConflictException('角色名称已存在');
      }
      throw e;
    }
  }

  async update(id: number, patch: { name?: string; remark?: string }) {
    const cols = await this.ensureCols();
    const sets: string[] = [];
    const vals: any[] = [];
    if (patch.name !== undefined) { sets.push('name = ?'); vals.push(patch.name); }
    if (patch.remark !== undefined && cols.has('remark')) { sets.push('remark = ?'); vals.push(patch.remark); }
    if (!sets.length) return { ok: true };
    vals.push(id);
    try {
      await this.db.query('update roles set ' + sets.join(',') + ' where id = ?', vals);
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (msg.includes('Duplicate entry') || msg.includes('ER_DUP_ENTRY')) {
        throw new ConflictException('角色名称已存在');
      }
      throw e;
    }
    return { ok: true };
  }

  async remove(id: number) {
    await this.db.query('delete from roles where id = ?', [id]);
    return { ok: true };
  }
}
