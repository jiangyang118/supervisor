export async function get<T>(path: string): Promise<T> {
  const base = (import.meta as any).env?.VITE_API_BASE || '/api'
  const url = `${base}${path}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json() as Promise<T>
}

export async function post<T>(path: string, body?: any): Promise<T> {
  const base = (import.meta as any).env?.VITE_API_BASE || '/api'
  const url = `${base}${path}`
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json() as Promise<T>
}

