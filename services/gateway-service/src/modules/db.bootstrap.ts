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
  }
}
