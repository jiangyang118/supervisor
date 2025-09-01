import { get, post } from './http'

export const api = {
  regSchools: () => get<Array<{ id: string; name: string }>>('/reg/schools'),
  // Credentials for school archives
  regCanteens: (schoolId?: string) => get<any[]>(`/reg/credentials/canteens${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`),
  regWorkers: (schoolId?: string) => get<any[]>(`/reg/credentials/workers${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`),
  regSuppliers: (schoolId?: string) => get<any[]>(`/reg/credentials/suppliers${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`),
  regExceptions: (schoolId?: string) => get<any[]>(`/reg/credentials/exceptions${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`),
  // Cameras (regulator)
  regCameras: (schoolId?: string) => get<any[]>(`/bright/reg/cameras${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`),
  makeSnapshot: (b: { schoolId: string; cameraId: string; at?: string; url?: string }) => post<any>('/bright/reg/snapshots', b),
  // AI events (regulator)
  regAiEvents: (params: { schoolId?: string; page?: number; pageSize?: number } = {}) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/reg/ai/events?${new URLSearchParams(Object.fromEntries(Object.entries({ page: 1, pageSize: 20, ...params }).filter(([, v]) => v !== undefined && v !== '')) as any).toString()}`,
    ),
  // Public feedback (home endpoint as demo)
  feedback: () => get<any[]>('/home/parent-feedback'),
  // Reports daily (school)
  schoolDaily: (schoolId?: string) => get<any>(`/reports/school/daily${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`),
  // AI tasks (reg)
  regAiTasks: () => get<any[]>('/reg/ai/tasks'),
  // Ledgers (reg)
  regLedgersSampling: (schoolId?: string) => get<{ items: any[]; total: number; page: number; pageSize: number }>(`/reg/ledgers/sampling${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`),
  regLedgersDisinfection: (schoolId?: string) => get<{ items: any[]; total: number; page: number; pageSize: number }>(`/reg/ledgers/disinfection${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`),
  regLedgersDine: (schoolId?: string) => get<{ items: any[]; total: number; page: number; pageSize: number }>(`/reg/ledgers/dine${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`),
  regLedgersWaste: (schoolId?: string) => get<{ items: any[]; total: number; page: number; pageSize: number }>(`/reg/ledgers/waste${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`),
  morningChecks: (params: { schoolId?: string; page?: number; pageSize?: number } = {}) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(`/school/morning-checks?${new URLSearchParams(Object.fromEntries(Object.entries({ page: 1, pageSize: 50, ...params }).filter(([, v]) => v !== undefined && v !== '')) as any).toString()}`),
  // Inbound/Outbound history (per school)
  inboundHistory: (schoolId?: string) => get<any[]>(`/home/inbound${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`),
  outboundHistory: (schoolId?: string) => get<any[]>(`/home/outbound${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`),
}
