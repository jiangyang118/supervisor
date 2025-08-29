type Level = 'pv' | 'click' | 'error'

export function log(level: Level, msg: string, extra?: any) {
  try {
    const rec = { t: Date.now(), level, msg, extra }
    const key = 'app_logs'
    const list = JSON.parse(localStorage.getItem(key) || '[]')
    list.push(rec)
    localStorage.setItem(key, JSON.stringify(list.slice(-500)))
  } catch {}
  if (level === 'error') console.error('[log]', msg, extra)
  else console.log('[log]', level, msg, extra)
}

export const logger = {
  pv: (msg: string, extra?: any) => log('pv', msg, extra),
  click: (msg: string, extra?: any) => log('click', msg, extra),
  error: (msg: string, extra?: any) => log('error', msg, extra),
}

