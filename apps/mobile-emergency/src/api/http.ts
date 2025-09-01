export async function get<T>(path: string): Promise<T> {
  const base = (import.meta as any).env?.VITE_API_BASE || '/api'
  const res = await fetch(`${base}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

export async function post<T>(path: string, body?: any): Promise<T> {
  const base = (import.meta as any).env?.VITE_API_BASE || '/api'
  const res = await fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

