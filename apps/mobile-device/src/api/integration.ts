// MEGO integration client — targets the school integration service (default :4001)

const getIntegrationBase = (): string => {
  const vite = (import.meta as any).env
  const v = vite?.VITE_SCHOOL_INTEGRATION_BASE as string | undefined
  const w = (typeof window !== 'undefined' ? (window as any).SCHOOL_INTEGRATION_BASE : undefined) as
    | string
    | undefined
  const ls = typeof localStorage !== 'undefined' ? localStorage.getItem('SCHOOL_INTEGRATION_BASE') || undefined : undefined
  // default to local demo integration service
  return (v || ls || w || 'http://localhost:4001').replace(/\/$/, '')
}

export async function megoDiscover(body: { equipmentCode: string; candidates: string[] }) {
  const base = getIntegrationBase()
  const res = await fetch(`${base}/api/devices/discover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<{ results: Array<{ baseUrl: string; ok: boolean }>; autoSelected: string | null }>
}

export async function megoEmployeesRefresh(equipmentCode?: string) {
  const base = getIntegrationBase()
  const res = await fetch(`${base}/api/employees/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ equipmentCode }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<{ success: boolean; count?: number; message?: string }>
}

export async function megoEmployees() {
  const base = getIntegrationBase()
  const res = await fetch(`${base}/api/employees`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<{ data: Array<{ userId: string; name: string; healthStartTime?: string; healthEndTime?: string }> }>
}

export async function megoMorningChecks() {
  const base = getIntegrationBase()
  const res = await fetch(`${base}/api/morning-checks`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<{ data: any[] }>
}

export type MorningCheckPayload = {
  equipmentCode: string
  userId: string
  foreheadTemp: number
  normalTemperatureRange?: string // default 35.9-37.3
  handCheckResult?: string // csv
  healthAskResult?: string // csv
}

function parseRange(range: string): [number, number] {
  const [a, b] = range.split('-').map((s) => Number(s.trim()))
  return [isFinite(a) ? a : 35.9, isFinite(b) ? b : 37.3]
}

function computeFlags(temp: number, range = '35.9-37.3', hand = '', ask = ''): { abnormal: 0 | 1; health: 0 | 1 } {
  const [min, max] = parseRange(range)
  const abnormal: 0 | 1 = temp < min || temp > max ? 1 : 0
  const health: 0 | 1 = abnormal === 0 && (!hand || hand.trim() === '') && (!ask || ask.trim() === '') ? 0 : 1
  return { abnormal, health }
}

function fmtTime(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = d.getFullYear()
  const m = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const h = pad(d.getHours())
  const mi = pad(d.getMinutes())
  const s = pad(d.getSeconds())
  return `${y}-${m}-${day} ${h}:${mi}:${s}`
}

export async function megoPostMorningCheck(p: MorningCheckPayload) {
  const base = getIntegrationBase()
  const url = `${base}/api/integrations/morning-checks/mego`
  const range = p.normalTemperatureRange || '35.9-37.3'
  const { abnormal, health } = computeFlags(p.foreheadTemp, range, p.handCheckResult || '', p.healthAskResult || '')
  const fd = new FormData()
  fd.append('equipmentCode', p.equipmentCode)
  fd.append('uuid', `uuid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`)
  fd.append('userId', String(p.userId))
  fd.append('checkTime', fmtTime())
  fd.append('foreheadTemp', String(p.foreheadTemp))
  fd.append('normalTemperatureRange', range)
  fd.append('abnormalTemp', String(abnormal))
  fd.append('handCheckResult', p.handCheckResult || '')
  fd.append('healthAskResult', p.healthAskResult || '')
  fd.append('health', String(health))
  // placeholder images to avoid binary requirement
  const blob = new Blob([new TextEncoder().encode('demo')], { type: 'image/jpeg' })
  fd.append('faceFile', blob, 'face.jpg')
  fd.append('palmFile', blob, 'palm.jpg')
  fd.append('backOfHandFile', blob, 'back.jpg')

  const res = await fetch(url, { method: 'POST', body: fd })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<{ success: boolean; id?: string; message?: string }>
}

