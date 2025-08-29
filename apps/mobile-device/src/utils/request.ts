type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

export type RequestOptions<T = any> = {
  baseURL?: string
  path: string
  method?: Method
  headers?: Record<string, string>
  body?: any
  cache?: boolean
  cacheTtlMs?: number
}

function getBaseURL() {
  // 1) Vite env
  const vite = (import.meta as any).env
  if (vite?.VITE_API_BASE) return String(vite.VITE_API_BASE)
  // 2) LocalStorage keys (prefer gateway)
  if (typeof localStorage !== 'undefined') {
    for (const k of ['FOODSAFE_API_BASE', 'API_GATEWAY_BASE']) {
      const v = localStorage.getItem(k)
      if (v) return v
    }
  }
  // 3) Global window vars
  // @ts-ignore
  if (typeof window !== 'undefined') {
    // @ts-ignore
    if ((window as any).FOODSAFE_API_BASE) return (window as any).FOODSAFE_API_BASE
  }
  // 4) Default to web-school style base (proxied)
  return '/api'
}

function cacheKey(url: string) {
  return `req_cache:${url}`
}

export async function request<T = any>(opts: RequestOptions): Promise<T> {
  const method = opts.method || 'GET'
  const base = opts.baseURL ?? getBaseURL()
  const url = `${base}${opts.path}`

  if (opts.cache && typeof localStorage !== 'undefined') {
    const key = cacheKey(url)
    const raw = localStorage.getItem(key)
    if (raw) {
      try {
        const { expiredAt, data } = JSON.parse(raw)
        if (!expiredAt || Date.now() < expiredAt) return data
      } catch {}
    }
  }

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
    body: method === 'GET' ? undefined : JSON.stringify(opts.body ?? {}),
  })

  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  const data = (await res.json()) as T

  if (opts.cache && typeof localStorage !== 'undefined') {
    const key = cacheKey(url)
    const ttl = opts.cacheTtlMs ?? 5 * 60 * 1000
    try {
      localStorage.setItem(key, JSON.stringify({ expiredAt: Date.now() + ttl, data }))
    } catch {}
  }

  return data
}
