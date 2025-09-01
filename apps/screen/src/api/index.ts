import { get, post } from './http'

export const api = {
  regSchools: () => get<Array<{ id: string; name: string }>>('/reg/schools'),
  regCameras: (schoolId?: string) => get<any[]>(`/bright/reg/cameras${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`),
  regAiEvents: (params: { schoolId?: string; page?: number; pageSize?: number } = {}) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/reg/ai/events?${new URLSearchParams(Object.fromEntries(Object.entries({ page: 1, pageSize: 20, ...params }).filter(([, v]) => v !== undefined && v !== '')) as any).toString()}`,
    ),
  schoolDaily: (schoolId?: string) => get<any>(`/reports/school/daily${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`),
  makeSnapshot: (b: { schoolId: string; cameraId: string; at?: string; url?: string }) => post<any>('/bright/reg/snapshots', b),
}

