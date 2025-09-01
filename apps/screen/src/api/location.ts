type Region = { city?: string; district?: string; province?: string; country?: string; display: string }

const env = (import.meta as any).env || {}

export function autoRegionEnabled(): boolean {
  return String(env.VITE_REGION_AUTO || 'false').toLowerCase() === 'true'
}

async function fromIp(): Promise<Region> {
  const url = env.VITE_IP_GEO_URL || 'https://ipapi.co/json/'
  const hname = env.VITE_IP_GEO_HEADER_NAME
  const hval = env.VITE_IP_GEO_HEADER_VALUE
  const init: RequestInit = hname && hval ? { headers: { [hname]: hval } } : {}
  const res = await fetch(url, init)
  if (!res.ok) throw new Error('ip geo http ' + res.status)
  const j = await res.json()
  const city = j.city || j.city_name || j.town || ''
  const region = j.region || j.region_name || j.state || ''
  const country = j.country || j.country_name || j.country_code || ''
  const display = [city, region].filter(Boolean).join(' · ') || [region, country].filter(Boolean).join(' · ') || String(country || '未知')
  return { city, province: region, country, display }
}

async function fromReverseGeocode(lat: number, lng: number): Promise<Region> {
  const tmpl = env.VITE_REVERSE_GEOCODE_URL
  if (!tmpl) throw new Error('no reverse geocode url configured')
  const url = String(tmpl).replace('{lat}', String(lat)).replace('{lng}', String(lng)).replace('{lon}', String(lng))
  const hname = env.VITE_REVERSE_GEOCODE_HEADER_NAME
  const hval = env.VITE_REVERSE_GEOCODE_HEADER_VALUE
  const init: RequestInit = hname && hval ? { headers: { [hname]: hval } } : {}
  const res = await fetch(url, init)
  if (!res.ok) throw new Error('reverse geocode http ' + res.status)
  const j = await res.json()
  const city = j.city || j.address?.city || j.result?.addressComponent?.city || j.ad_info?.city || ''
  const district = j.district || j.address?.district || j.result?.addressComponent?.district || ''
  const province = j.province || j.address?.province || j.result?.addressComponent?.province || ''
  const display = [city || province, district].filter(Boolean).join(' · ') || [province, city].filter(Boolean).join(' · ')
  return { city, district, province, display: display || '定位中' }
}

export async function resolveRegion(): Promise<Region> {
  // cache first
  try {
    const { cacheGet } = await import('../utils/cache')
    const cached = cacheGet<Region>('region:auto')
    if (cached) return cached
  } catch {}
  // Try browser geolocation if allowed and reverse geocode configured
  try {
    if ('geolocation' in navigator && env.VITE_REVERSE_GEOCODE_URL) {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 3000 }),
      )
      const r = await fromReverseGeocode(pos.coords.latitude, pos.coords.longitude)
      try { const { cacheSet } = await import('../utils/cache'); cacheSet('region:auto', r, Number(env.VITE_REGION_CACHE_SEC || 86400)) } catch {}
      return r
    }
  } catch {}
  // Fallback to IP-based geo
  try {
    const r = await fromIp()
    try { const { cacheSet } = await import('../utils/cache'); cacheSet('region:auto', r, Number(env.VITE_REGION_CACHE_SEC || 86400)) } catch {}
    return r
  } catch {}
  // Final fallback to env region string
  const display = env.VITE_REGION || '示例市 · 示例区'
  return { display }
}
