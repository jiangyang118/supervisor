import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DbService } from './db.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DbBootstrapService implements OnModuleInit {
  private readonly logger = new Logger('DbBootstrap');

  constructor(private readonly db: DbService) {}

  async onModuleInit() {
    const auto = (process.env.DB_AUTO_MIGRATE ?? (process.env.NODE_ENV === 'production' ? '0' : '1')) as string;
    if (auto !== '1' && auto.toLowerCase() !== 'true') {
      this.logger.log('DB auto-migrate disabled');
      return;
    }

    // wait briefly for DbService to initialize (non-blocking retries)
    for (let i = 0; i < 10 && !this.db.isReady; i++) {
      await new Promise((r) => setTimeout(r, 200));
    }
    if (!this.db.isReady) {
      this.logger.warn('DB not ready; skip auto-migrate');
      return;
    }

    try {
      await this.applyMigrations();
      await this.applySeeds();
    } catch (e: any) {
      this.logger.error(`DB bootstrap failed: ${e?.message || e}`);
    }
  }

  private async applyMigrations() {
    // Try both when running via ts-node (src/**) and compiled dist/**
    const candidates = [
      path.join(__dirname, '..', '..', 'migrations'), // src/modules -> ../../migrations
      path.join(__dirname, '..', 'migrations'), // dist/modules -> ../migrations
    ];
    const migDir = candidates.find((p) => fs.existsSync(p));
    if (!migDir) {
      this.logger.warn(`No migrations directory found in: ${candidates.join(', ')}`);
      return;
    }

    await this.db.query(
      'create table if not exists _migrations(id varchar(255) primary key, applied_at datetime not null default current_timestamp)'
    );
    const { rows: appliedRows } = await this.db.query<any>('select id from _migrations');
    const applied = new Set<string>((appliedRows || []).map((r: any) => r.id));

    const files = fs
      .readdirSync(migDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const f of files) {
      if (applied.has(f)) {
        this.logger.log(`Already applied: ${f}`);
        continue;
      }
      const sql = fs.readFileSync(path.join(migDir, f), 'utf8');
      this.logger.log(`Applying: ${f}`);
      await this.db.query(sql);
      await this.db.query('insert into _migrations(id) values(?)', [f]);
      this.logger.log(`Applied: ${f}`);
    }
  }

  private async applySeeds() {
    // schools
    try {
      const { rows } = await this.db.query<any>('select count(1) as c from schools');
      const count = Number(rows?.[0]?.c || 0);
      if (count === 0) {
        await this.db.query('insert into schools(id, name, enabled) values(?,?,1)', [1, '示例学校']);
        this.logger.log('Seed: inserted default school');
      }
    } catch {}

    // food_waste_reasons
    try {
      const { rows } = await this.db.query<any>('select count(1) as c from food_waste_reasons');
      const count = Number(rows?.[0]?.c || 0);
      if (count === 0) {
        const reasons = ['备料过量', '口味不合', '保温不佳', '供应计划不合理'];
        for (const name of reasons) {
          const id = `fw-${Buffer.from(name).toString('hex').slice(0, 8)}`;
          await this.db.query('insert ignore into food_waste_reasons(id, name, enabled) values(?,?,1)', [id, name]);
        }
        this.logger.log('Seed: inserted default food_waste_reasons');
      }
    } catch {}

    // inv_categories
    try {
      const { rows } = await this.db.query<any>('select count(1) as c from inv_categories');
      const count = Number(rows?.[0]?.c || 0);
      if (count === 0) {
        const cats = [
          ['cat-veg', '蔬菜'],
          ['cat-meat', '肉类'],
          ['cat-grain', '粮油'],
          ['cat-dairy', '奶制品'],
        ];
        for (const [id, name] of cats) {
          await this.db.query('insert ignore into inv_categories(id, name) values(?,?)', [id, name]);
        }
        this.logger.log('Seed: inserted default inv_categories');
      }
    } catch {}

    // roles & permissions: ensure ADMIN and PLATFORM_SUPER both have *:*
    try {
      await this.db.query('create table if not exists roles(id int auto_increment primary key, name varchar(255) unique, remark varchar(255) null, created_at datetime default current_timestamp, updated_at datetime default current_timestamp on update current_timestamp)');
      await this.db.query('create table if not exists role_permissions(role_id int, permission_key varchar(255), unique key uk_rp(role_id, permission_key))');
      // ADMIN and PLATFORM_SUPER
      await this.db.query('insert ignore into roles(name, remark) values(?, ?)', ['ADMIN', '监管端超级管理员']);
      await this.db.query('insert ignore into roles(name, remark) values(?, ?)', ['PLATFORM_SUPER', '平台超管']);
      // SCHOOL role for school-side accounts
      await this.db.query('insert ignore into roles(name, remark) values(?, ?)', ['SCHOOL', '学校端默认角色']);
      const { rows: r1 } = await this.db.query<any>('select id from roles where name = ? limit 1', ['ADMIN']);
      const { rows: r2 } = await this.db.query<any>('select id from roles where name = ? limit 1', ['PLATFORM_SUPER']);
      const { rows: r3 } = await this.db.query<any>('select id from roles where name = ? limit 1', ['SCHOOL']);
      const adminId = Number(r1?.[0]?.id || 0);
      const superId = Number(r2?.[0]?.id || 0);
      const schoolId = Number(r3?.[0]?.id || 0);
      if (adminId) await this.db.query('insert ignore into role_permissions(role_id, permission_key) values(?,?)', [adminId, '*:*']);
      if (superId) await this.db.query('insert ignore into role_permissions(role_id, permission_key) values(?,?)', [superId, '*:*']);
      if (schoolId) {
        const perms = [
          'report:R',
          'food_safety:R',
          'inventory:R',
          'stream:R',
          'public_feedback:R',
        ];
        for (const p of perms) await this.db.query('insert ignore into role_permissions(role_id, permission_key) values(?,?)', [schoolId, p]);
      }
      this.logger.log('Seed: ensured roles and *:* permissions');
      // Ensure permissions catalog includes regulator+school common keys
      const permPairs: Array<[string, string]> = [
        ['report:R', '报表-查看'],
        ['report:EX', '报表-导出'],
        ['school:R', '学校-查看'],
        ['config:S', '系统配置-策略变更'],
        ['alerts:R', '预警-查看'],
        ['alerts:EX', '预警-导出'],
        ['alerts:A', '预警-敏感操作'],
        ['credentials:R', '资质-查看'],
        ['credentials:U', '资质-更新处理'],
        ['credentials:EX', '资质-导出'],
        ['food_waste:R', '食品浪费-查看'],
        ['food_waste:EX', '食品浪费-导出'],
        ['training:R', '培训考试-查看'],
        ['training:EX', '培训考试-导出'],
        ['food_safety:R', '食安台账-查看'],
        ['inventory:R', '出入库-查看'],
        ['stream:R', '明厨亮灶-查看'],
        ['public_feedback:R', '公众反馈-查看'],
        ['public_feedback:EX', '公众反馈-导出'],
        ['public_feedback:U', '公众反馈-回复'],
        ['inspections:R', '监督检查-查看'],
        ['inspections:C', '监督检查-创建'],
        ['inspections:U', '监督检查-更新'],
        ['inspections:M', '监督检查-人员管理'],
        ['inspections:S', '监督检查-配置管理'],
        ['users.manage', '用户管理'],
      ];
      for (const [k, v] of permPairs) {
        await this.db.query('insert ignore into permissions(`key`, label) values(?,?)', [k, v]);
      }
    } catch {}

    // users & credentials: super, admin, jiaowu
    try {
      await this.db.query('create table if not exists users(id int auto_increment primary key, username varchar(255) unique, display_name varchar(255), enabled tinyint default 1, phone varchar(32) null, remark varchar(255) null, created_by varchar(255) null, created_at datetime default current_timestamp, updated_at datetime default current_timestamp on update current_timestamp)');
      await this.db.query('create table if not exists user_roles(user_id int, role_id int, unique key uk_ur(user_id, role_id))');
      await this.db.query('create table if not exists user_credentials(user_id int unique, salt varchar(64), password_hash varchar(128))');

      const defaults = [
        { u: 'super', name: '平台超管', phone: '19900000000', role: 'PLATFORM_SUPER', pwdEnv: 'SUPER_DEFAULT_PASSWORD', def: 'super123' },
        { u: 'admin', name: '监管超管', phone: '19900000001', role: 'ADMIN', pwdEnv: 'ADMIN_DEFAULT_PASSWORD', def: 'admin123' },
        { u: 'jiaowu', name: '教务', phone: '19900000002', role: 'ADMIN', pwdEnv: 'JIAOWU_DEFAULT_PASSWORD', def: 'jiaowu123' },
      ];
      for (const d of defaults) {
        const { rows: found } = await this.db.query<any>('select id from users where username = ? limit 1', [d.u]);
        let uid = Number(found?.[0]?.id || 0);
        if (!uid) {
          const res = await this.db.query('insert into users(username, display_name, enabled, phone, created_by) values(?,?,?,?,?)', [d.u, d.name, 1, d.phone, 'system']);
          uid = Number(res.insertId || 0);
          this.logger.log(`Seed: created user ${d.u}#${uid}`);
        }
        const { rows: rrows } = await this.db.query<any>('select id from roles where name = ? limit 1', [d.role]);
        const rid = Number(rrows?.[0]?.id || 0);
        if (rid) await this.db.query('insert ignore into user_roles(user_id, role_id) values(?,?)', [uid, rid]);
        const { rows: cred } = await this.db.query<any>('select user_id from user_credentials where user_id = ? limit 1', [uid]);
        if (!cred?.[0]) {
          const { createHash, randomBytes } = await import('crypto');
          const salt = randomBytes(8).toString('hex');
          const raw = process.env[d.pwdEnv] || d.def;
          const hash = createHash('sha256').update(salt + raw).digest('hex').toUpperCase();
          await this.db.query('insert into user_credentials(user_id, salt, password_hash) values(?,?,?)', [uid, salt, hash]);
          this.logger.log(`Seed: set credential for ${d.u}`);
        }
      }
    } catch {}
  }
}
