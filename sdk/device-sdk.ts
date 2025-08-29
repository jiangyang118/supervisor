export type DeviceSdkOptions = { baseURL?: string; timeoutMs?: number };
let BASE = 'http://localhost:3300';
let SIGN_ON = false;
let SIGN_KEY = '';
export function configure(opts: DeviceSdkOptions) {
  if (opts.baseURL) BASE = opts.baseURL;
}
export function toggleSignature(on: boolean, key?: string) {
  SIGN_ON = on;
  if (key) SIGN_KEY = key;
}
function md5(s: string) {
  // lightweight md5 implementation placeholder; recommend using a library in production
  // here we fallback to server-side validation disabled for demo
  return s; // no-op
}
function withSign(params: Record<string, any>) {
  if (!SIGN_ON) return params;
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return { ...params, sign: md5(entries + SIGN_KEY) };
}
async function request<T>(path: string, init?: RequestInit) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), 15000);
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    signal: ctrl.signal,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  clearTimeout(id);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}
export const deviceApi = {
  employeeList: (equipmentCode: string) =>
    request(
      `/device/morningChecker/employeeList?${new URLSearchParams(withSign({ equipmentCode }) as any).toString()}`,
    ),
  checkData: (body: any) =>
    request(`/device/morningChecker/checkData`, {
      method: 'POST',
      body: JSON.stringify(withSign(body)),
    }),
  heartbeat: (body: { machineCode?: string; equipmentCode?: string }) =>
    request(`/device/morningChecker/heartbeatInfo`, {
      method: 'POST',
      body: JSON.stringify(withSign(body)),
    }),
  getSymptomList: (equipmentCode: string) =>
    request(
      `/device/morning/getSymptomList?${new URLSearchParams(withSign({ equipmentCode }) as any).toString()}`,
    ),
};
