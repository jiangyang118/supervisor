/* eslint-disable no-console */
// Lightweight DB readiness check for MySQL using env vars.
// Tries to connect until success or timeout.
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Load .env from repo root or service dir when running locally/builder
try {
  const candidates = [
    path.join(__dirname, '../../../.env'),
    path.join(__dirname, '../../.env'),
    path.join(__dirname, '..', '.env'),
    path.join(process.cwd(), '.env'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      require('dotenv').config({ path: p });
      break;
    }
  }
} catch {}

function buildConfigFromEnv() {
  const ssl = process.env.MYSQL_SSL === '1' || process.env.MYSQL_SSL === 'true';
  if (process.env.DATABASE_URL) {
    const u = new URL(process.env.DATABASE_URL);
    return {
      host: u.hostname,
      port: u.port ? Number(u.port) : 3306,
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ''),
      timezone: '+08:00',
      ssl: ssl ? { rejectUnauthorized: false } : undefined,
    };
  }
  const host = process.env.DB_HOST || process.env.MYSQL_HOST;
  const port = Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306);
  const user = process.env.DB_USER || process.env.MYSQL_USER;
  const password = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD;
  const database = process.env.DB_NAME || process.env.MYSQL_DATABASE;
  return { host, port, user, password, database, timezone: '+08:00', ssl: ssl ? { rejectUnauthorized: false } : undefined };
}

async function waitForDb({ timeoutMs = 60000, intervalMs = 2000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  const cfg = buildConfigFromEnv();
  const target = `${cfg.user}@${cfg.host}:${cfg.port}/${cfg.database || ''}`;
  while (Date.now() < deadline) {
    try {
      const conn = await mysql.createConnection(cfg);
      await conn.query('SELECT 1');
      await conn.end();
      console.log(`[wait-for-db] Connected: ${target}`);
      return true;
    } catch (e) {
      console.log(`[wait-for-db] Waiting for MySQL at ${target} ... (${e.code || e.message})`);
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
  console.error('[wait-for-db] Timed out waiting for database');
  return false;
}

waitForDb().then((ok) => process.exit(ok ? 0 : 1));

