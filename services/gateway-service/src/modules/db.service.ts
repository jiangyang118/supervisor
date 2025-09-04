import { Injectable, OnModuleInit } from '@nestjs/common';
import mysql, { Pool, PoolOptions } from 'mysql2/promise';

export interface DbConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  ssl?: boolean;
}

@Injectable()
export class DbService implements OnModuleInit {
  private pool?: Pool;
  isReady = false;

  onModuleInit() {
    try {
      const cfg: DbConfig = this.readConfig();
      if (!cfg.connectionString && !cfg.host) return; // not configured
      const options: PoolOptions = cfg.connectionString
        ? ({} as any)
        : {
            host: cfg.host,
            port: cfg.port || 3306,
            user: cfg.user,
            password: cfg.password,
            database: cfg.database,
            ssl: cfg.ssl ? { rejectUnauthorized: false } : undefined,
          };
      try {
        this.pool = cfg.connectionString
          ? mysql.createPool(cfg.connectionString)
          : mysql.createPool({
              ...options,
              waitForConnections: true,
              connectionLimit: 10,
              multipleStatements: true,
            });
      } catch (e: any) {
        this.isReady = false;
        throw e;
      }
      // test
      this.query('select 1')
        .then(() => (this.isReady = true))
        .catch(async (err) => {
          // Auto-create database if missing, then retry
          const msg = String(err?.message || '');
          if (/unknown database|doesn't exist/i.test(msg) && !cfg.connectionString && cfg.host && cfg.user) {
            try {
              const admin = await mysql.createConnection({
                host: cfg.host,
                port: cfg.port || 3306,
                user: cfg.user,
                password: cfg.password,
                ssl: cfg.ssl ? { rejectUnauthorized: false } : undefined,
              });
              if (cfg.database) {
                await admin.query(`create database if not exists \`${cfg.database}\``);
              }
              await admin.end();
              // recreate pool with database
              this.pool = mysql.createPool({
                ...options,
                waitForConnections: true,
                connectionLimit: 10,
                multipleStatements: true,
              });
              await this.query('select 1');
              this.isReady = true;
              return;
            } catch {
              this.isReady = false;
              return;
            }
          }
          this.isReady = false;
        });
    } catch {
      this.isReady = false;
    }
  }

  private readConfig(): DbConfig {
    const env = process.env;
    const ssl = env.MYSQL_SSL === '1' || env.MYSQL_SSL === 'true';
    if (env.DATABASE_URL) return { connectionString: env.DATABASE_URL, ssl };
    // Support both MYSQL_* and DB_* variable families
    const host = env.MYSQL_HOST || env.DB_HOST;
    const port = env.MYSQL_PORT || env.DB_PORT;
    const user = env.MYSQL_USER || env.DB_USER;
    const password = env.MYSQL_PASSWORD || env.DB_PASSWORD;
    const database = env.MYSQL_DATABASE || env.DB_NAME;
    if (!host) return {};
    return {
      host,
      port: port ? Number(port) : 3306,
      user,
      password,
      database,
      ssl,
    };
  }

  async query<T = any>(
    text: string,
    params?: any[],
  ): Promise<{ rows: T[]; insertId?: number; affectedRows?: number }> {
    // Graceful fallback when DB is not configured: return empty sets for reads,
    // and no-op for writes. This keeps demo endpoints usable without MySQL.
    if (!this.pool) {
      const sql = String(text || '').trim().toLowerCase();
      if (sql.startsWith('select') || sql.startsWith('show') || sql.startsWith('describe')) {
        return { rows: [] as T[] };
      }
      if (sql.startsWith('insert')) {
        return { rows: [] as T[], insertId: undefined, affectedRows: 0 };
      }
      if (sql.startsWith('update') || sql.startsWith('delete')) {
        return { rows: [] as T[], affectedRows: 0 };
      }
      return { rows: [] as T[] };
    }
    const [rows]: any = await this.pool.query(text, params);
    const insertId = typeof rows?.insertId === 'number' ? rows.insertId : undefined;
    const affectedRows = typeof rows?.affectedRows === 'number' ? rows.affectedRows : undefined;
    return { rows: Array.isArray(rows) ? (rows as T[]) : ([] as T[]), insertId, affectedRows };
  }
}
