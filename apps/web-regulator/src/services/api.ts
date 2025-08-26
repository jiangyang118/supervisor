const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  overview: () => get<any>('/reg/overview'),
  schools: () => get<any[]>('/reg/schools/stats'),
  cameras: (schoolId: string) => get<any[]>(`/reg/schools/${schoolId}/cameras`),
};
