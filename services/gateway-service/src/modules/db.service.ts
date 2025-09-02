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

  async query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
    if (!this.pool) throw new Error('DB not configured');
    const [rows] = await this.pool.query(text, params);
    return { rows: rows as T[] };
  }
}
