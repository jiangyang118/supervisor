export type WeatherKind = 'sun'|'cloud'|'rain'|'storm'|'snow'|'fog'|'wind'|'unknown'
type WeatherNow = { text: string; temp: number; icon: string; kind: WeatherKind }

const env = (import.meta as any).env || {}

function kindOf(textOrCode: string): WeatherKind {
  const s = String(textOrCode).toLowerCase()
  if (/sun|clear|晴/.test(s)) return 'sun'
  if (/cloud|阴|多云/.test(s)) return 'cloud'
  if (/rain|雨/.test(s)) return 'rain'
  if (/storm|雷/.test(s)) return 'storm'
  if (/snow|雪/.test(s)) return 'snow'
  if (/fog|雾|霾/.test(s)) return 'fog'
  if (/wind|风/.test(s)) return 'wind'
  return 'cloud'
}

function emojiOf(kind: WeatherKind): string {
  switch (kind) {
    case 'sun': return '☀️'
    case 'cloud': return '⛅'
    case 'rain': return '🌧️'
    case 'storm': return '⛈️'
    case 'snow': return '❄️'
    case 'fog': return '🌫️'
    case 'wind': return '🌬️'
    default: return '⛅'
  }
}

async function fromQWeather(): Promise<WeatherNow> {
  const key = env.VITE_QWEATHER_KEY
  const city = env.VITE_QWEATHER_CITY_ID
  if (!key || !city) throw new Error('qweather missing key/city')
  const url = `https://devapi.qweather.com/v7/weather/now?location=${encodeURIComponent(city)}&key=${encodeURIComponent(key)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('qweather http ' + res.status)
  const data = await res.json()
  const now = data?.now || {}
  const text = now.text || '多云'
  const temp = Number(now.temp ?? 28)
  const kind = kindOf(now.icon ?? text)
  return { text, temp, icon: emojiOf(kind), kind }
}

async function fromOpenWeather(cityOverride?: string): Promise<WeatherNow> {
  const key = env.VITE_OPENWEATHER_KEY
  const city = cityOverride || env.VITE_OPENWEATHER_CITY
  if (!key || !city) throw new Error('openweather missing key/city')
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${encodeURIComponent(key)}&units=metric&lang=zh_cn`
  const res = await fetch(url)
  if (!res.ok) throw new Error('openweather http ' + res.status)
  const data = await res.json()
  const w = (data.weather && data.weather[0]) || {}
  const text = w.description || '多云'
  const temp = Number(data?.main?.temp ?? 28)
  const kind = kindOf(w.main || text)
  return { text, temp, icon: emojiOf(kind), kind }
}

async function fromCustom(cityOverride?: string): Promise<WeatherNow> {
  const tmpl = env.VITE_WEATHER_URL
  if (!tmpl) throw new Error('custom weather url missing')
  const url = String(tmpl)
    .replace('{city}', encodeURIComponent(cityOverride || env.VITE_OPENWEATHER_CITY || env.VITE_QWEATHER_CITY_ID || ''))
    .replace('{key}', encodeURIComponent(env.VITE_OPENWEATHER_KEY || env.VITE_QWEATHER_KEY || ''))
  const res = await fetch(url)
  if (!res.ok) throw new Error('custom weather http ' + res.status)
  const data = await res.json()
  const text = data.text || data.weather || data.desc || '多云'
  const temp = Number(data.temp ?? data.temperature ?? 28)
  const kind = kindOf(data.icon || text)
  return { text, temp, icon: emojiOf(kind), kind }
}

export function getProvider(): string {
  return String(env.VITE_WEATHER_PROVIDER || 'none').toLowerCase()
}

export async function loadWeather(cityOverride?: string): Promise<WeatherNow> {
  const provider = getProvider()
  if (provider === 'qweather') return fromQWeather()
  if (provider === 'openweather') return fromOpenWeather(cityOverride)
  if (provider === 'custom') return fromCustom(cityOverride)
  // none: fallback to env static
  const kind = kindOf(env.VITE_WEATHER_TEXT || '')
  return { text: env.VITE_WEATHER_TEXT || '多云', temp: Number(env.VITE_WEATHER_TEMP || 28), icon: emojiOf(kind), kind }
}

export function weatherRefreshIntervalMs() {
  const sec = Number(env.VITE_WEATHER_REFRESH_SEC || 600)
  return (isFinite(sec) && sec > 0 ? sec : 600) * 1000
}

export async function loadWeatherCached(cityOverride?: string) {
  const ttl = Number(env.VITE_WEATHER_CACHE_SEC || env.VITE_WEATHER_REFRESH_SEC || 600)
  const key = `weather:${getProvider()}:${cityOverride || ''}`
  try {
    const { cacheGet, cacheSet } = await import('../utils/cache')
    const cached = cacheGet<any>(key)
    if (cached) return cached
    const fresh = await loadWeather(cityOverride)
    cacheSet(key, fresh as any, isFinite(ttl) && ttl > 0 ? ttl : 600)
    return fresh
  } catch {
    return loadWeather(cityOverride)
  }
}
