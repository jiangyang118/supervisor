const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  inbound: () => get<any[]>('/home/inbound'),
  outbound: () => get<any[]>('/home/outbound'),
  hygiene: () => get<any[]>('/home/hygiene'),
  devices: () => get<any[]>('/home/devices'),
  feedback: () => get<any[]>('/home/parent-feedback'),
  schoolEvents: (schoolId?: string) =>
    get<any[]>(`/school/ai/events${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`),
  schoolDaily: (schoolId?: string) =>
    get<any>(`/reports/school/daily${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`),
};
