import * as fs from 'fs';
import * as path from 'path';

type Level = 'info' | 'warn' | 'error';

function ensureDir(p: string) {
  try { fs.mkdirSync(p, { recursive: true }); } catch {}
}

function log(level: Level, message: string, meta?: any) {
  const now = new Date();
  const day = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const root = path.join(__dirname, '..', '..', 'logs');
  ensureDir(root);
  const file = path.join(root, `${level}-${day}.log`);
  const line = JSON.stringify({
    ts: now.toISOString(),
    level,
    msg: message,
    meta,
  }) + '\n';
  try { fs.appendFileSync(file, line, { encoding: 'utf8' }); } catch {}
}

export function logInfo(message: string, meta?: any) { log('info', message, meta); }
export function logWarn(message: string, meta?: any) { log('warn', message, meta); }
export function logError(message: string, meta?: any) { log('error', message, meta); }

