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
      this.pool = cfg.connectionString
        ? mysql.createPool(cfg.connectionString)
        : mysql.createPool({
            ...options,
            waitForConnections: true,
            connectionLimit: 10,
            multipleStatements: true,
          });
      // test
      this.query('select 1')
        .then(() => (this.isReady = true))
        .catch(() => (this.isReady = false));
    } catch {
      this.isReady = false;
    }
  }

  private readConfig(): DbConfig {
    const env = process.env;
    const ssl = env.MYSQL_SSL === '1' || env.MYSQL_SSL === 'true';
    if (env.DATABASE_URL) return { connectionString: env.DATABASE_URL, ssl };
    if (!env.MYSQL_HOST) return {};
    return {
      host: env.MYSQL_HOST,
      port: env.MYSQL_PORT ? Number(env.MYSQL_PORT) : 3306,
      user: env.MYSQL_USER,
      password: env.MYSQL_PASSWORD,
      database: env.MYSQL_DATABASE,
      ssl,
    };
  }

  async query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
    if (!this.pool) throw new Error('DB not configured');
    const [rows] = await this.pool.query(text, params);
    return { rows: rows as T[] };
  }
}
