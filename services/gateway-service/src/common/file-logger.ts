import * as fs from 'fs';
import * as path from 'path';

type Level = 'info' | 'warn' | 'error';

function ensureDir(p: string) {
  try { fs.mkdirSync(p, { recursive: true }); } catch {}
}

function getCaller(): string | undefined {
  try {
    const err = new Error();
    const stack = String((err as any).stack || '');
    const lines = stack.split(/\r?\n/).slice(2); // skip Error + this log function
    for (const ln of lines) {
      if (ln.includes('file-logger.ts')) continue;
      const m = ln.trim().match(/^at\s+([^\(]+)\s*\(([^:]+):(\d+):(\d+)\)$/) || ln.trim().match(/^at\s+([^:]+):(\d+):(\d+)$/);
      if (m) {
        if (m.length === 5) {
          const fn = m[1].trim();
          const file = m[2];
          const line = m[3];
          return `${fn} @ ${file}:${line}`;
        } else if (m.length === 4) {
          const file = m[1];
          const line = m[2];
          return `${file}:${line}`;
        }
      }
    }
  } catch {}
  return undefined;
}

function formatLocal(now: Date) {
  const tz = process.env.LOG_TZ || 'Asia/Shanghai';
  const fmt = new Intl.DateTimeFormat('zh-CN', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  // zh-CN gives YYYY/MM/DD HH:mm:ss
  return fmt.format(now).replace(/\//g, '-');
}

function log(level: Level, message: string, meta?: any) {
  const now = new Date();
  const day = (process.env.LOG_TZ ? formatLocal(now).slice(0, 10) : now.toISOString().slice(0, 10));
  const root = path.join(__dirname, '..', '..', 'logs');
  ensureDir(root);
  const file = path.join(root, `${level}-${day}.log`);
  const payload: any = {
    ts: formatLocal(now),
    level,
    msg: message,
    meta,
  };
  const src = getCaller();
  if (src) payload.source = src;
  const line = JSON.stringify(payload) + '\n';
  try { fs.appendFileSync(file, line, { encoding: 'utf8' }); } catch {}
}

export function logInfo(message: string, meta?: any) { log('info', message, meta); }
export function logWarn(message: string, meta?: any) { log('warn', message, meta); }
export function logError(message: string, meta?: any) { log('error', message, meta); }
