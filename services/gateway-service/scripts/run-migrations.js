/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Load env from repo root .env if available
try {
  const candidates = [
    path.join(__dirname, '../../../.env'), // repo root
    path.join(__dirname, '../../.env'),    // services/.env (if exists)
    path.join(__dirname, '..', '.env'),    // services/gateway-service/.env
    path.join(process.cwd(), '.env'),      // cwd .env as a last resort
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      require('dotenv').config({ path: p });
      break;
    }
  }
} catch {}

async function main() {
  const dir = path.join(__dirname, '..', 'migrations');
  if (!fs.existsSync(dir)) {
    console.log('No migrations directory. Skipping.');
    return;
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  if (!files.length) { console.log('No migration files. Skipping.'); return; }

  const ssl = process.env.MYSQL_SSL === '1' || process.env.MYSQL_SSL === 'true';

  let pool;
  if (process.env.DATABASE_URL) {
    const u = new URL(process.env.DATABASE_URL);
    const dbName = u.pathname.replace(/^\//, '');
    // ensure database exists
    const admin = await mysql.createConnection({
      host: u.hostname,
      port: u.port ? Number(u.port) : 3306,
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      timezone: '+08:00',
      ssl: ssl ? { rejectUnauthorized: false } : undefined,
    });
    try { await admin.query(`create database if not exists \`${dbName}\``); } finally { await admin.end(); }
    pool = await mysql.createPool({
      host: u.hostname,
      port: u.port ? Number(u.port) : 3306,
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      multipleStatements: true,
      timezone: '+08:00',
      ssl: ssl ? { rejectUnauthorized: false } : undefined,
    });
  } else {
    const host = process.env.DB_HOST || process.env.MYSQL_HOST;
    const port = process.env.DB_PORT || process.env.MYSQL_PORT;
    const user = process.env.DB_USER || process.env.MYSQL_USER;
    const password = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD;
    const database = process.env.DB_NAME || process.env.MYSQL_DATABASE;
    if (!user) {
      console.log('[migrate] Using split vars (no DATABASE_URL). Host:', host, 'DB:', database, 'User:', user);
    } else {
      console.log('[migrate] Using split vars. Host:', host, 'DB:', database, 'User:', user);
    }
    // ensure database exists
    const admin = await mysql.createConnection({
      host,
      port: port ? Number(port) : 3306,
      user,
      password,
      timezone: '+08:00',
      ssl: ssl ? { rejectUnauthorized: false } : undefined,
    });
    try { if (database) await admin.query(`create database if not exists \`${database}\``); } finally { await admin.end(); }
    pool = await mysql.createPool({
      host,
      port: port ? Number(port) : 3306,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      multipleStatements: true,
      timezone: '+08:00',
      ssl: ssl ? { rejectUnauthorized: false } : undefined,
    });
  }

  // simple migrations table
  await pool.query('create table if not exists _migrations(id varchar(255) primary key, applied_at datetime not null default current_timestamp)');
  const [appliedRows] = await pool.query('select id from _migrations');
  const applied = new Set(appliedRows.map((r) => r.id));

  for (const f of files) {
    const id = f;
    if (applied.has(id)) { console.log('Already applied:', id); continue; }
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    console.log('Applying:', id);
    try {
      await pool.query(sql);
      await pool.query('insert into _migrations(id) values(?)', [id]);
      console.log('Applied:', id);
    } catch (e) {
      console.error('Migration failed:', id, e.message);
      process.exitCode = 1;
      break;
    }
  }
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
