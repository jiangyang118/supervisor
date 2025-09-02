require('dotenv').config({ path: '../../.env' });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  console.log('Using DATABASE_URL:', process.env.DATABASE_URL);
  console.log('MySQL User:', process.env.MYSQL_USER);
  
  const dir = path.join(__dirname, '..', 'migrations');
  if (!fs.existsSync(dir)) {
    console.log('No migrations directory. Skipping.');
    return;
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  if (!files.length) { console.log('No migration files. Skipping.'); return; }

  const ssl = process.env.MYSQL_SSL === '1' || process.env.MYSQL_SSL === 'true';
  const pool = process.env.DATABASE_URL
    ? await mysql.createPool(process.env.DATABASE_URL)
    : await mysql.createPool({
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        waitForConnections: true,
        connectionLimit: 10,
        multipleStatements: true,
        ssl: ssl ? { rejectUnauthorized: false } : undefined,
      });

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