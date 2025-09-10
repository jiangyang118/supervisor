const BASE = import.meta.env.VITE_API_BASE || '/api';

function authHeaders() {
  const t = (typeof localStorage !== 'undefined' && localStorage.getItem('AUTH_TOKEN')) || '';
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function handleUnauthorized(status: number) {
  if (status === 401) {
    try {
      localStorage.removeItem('AUTH_TOKEN');
      localStorage.removeItem('AUTH_USER');
    } catch {}
    try { (window as any).ElMessage?.warning?.('登录已过期，请重新登录'); } catch {}
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.replace('/login');
    }
  }
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { ...authHeaders() } });
  if (!res.ok) {
    handleUnauthorized(res.status);
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body?: any, method: string = 'POST'): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    handleUnauthorized(r.status);
    throw new Error(`HTTP ${r.status}`);
  }
  return r.json();
}

export const api = {
  overview: () => get<any>('/reg/overview'),
  schools: () => get<any[]>('/reg/schools/stats'),
  // System schools config
  sysSchools: () => get<Array<{ id: number; name: string; enabled: boolean }>>('/reg/schools/config'),
  sysSchoolCreate: async (body: { name: string; enabled?: boolean }) => post(`/reg/schools/config`, body),
  sysSchoolUpdate: async (id: number, body: { name?: string; enabled?: boolean }) => post(`/reg/schools/config?id=${encodeURIComponent(String(id))}`, body, 'PATCH'),
  sysSchoolDelete: async (id: number) => post(`/reg/schools/config/delete`, { id }),
  cameras: (schoolId: string) => get<any[]>(`/reg/schools/${schoolId}/cameras`),
  // AI events (regulator)
  aiEvents: (
    params: {
      schoolId?: string;
      type?: string;
      status?: 'OPEN' | 'ACK' | 'CLOSED' | '';
      start?: string;
      end?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/reg/ai/events?${new URLSearchParams(
        Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null),
        ) as any,
      ).toString()}`,
    ),
  aiEventsExportCsv: async (
    params: {
      schoolId?: string;
      type?: string;
      status?: 'OPEN' | 'ACK' | 'CLOSED';
      start?: string;
      end?: string;
    } = {},
  ) => {
    const url = `/reg/ai/events/export.csv?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)) as any).toString()}`;
    const r = await fetch(`${BASE}${url}`, { headers: { ...authHeaders() } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const { csv } = await r.json();
    return csv as string;
  },
  // Patrol tasks
  aiTasks: (
    params: { status?: '待处理' | '进行中' | '已完成' | ''; start?: string; end?: string } = {},
  ) =>
    get<any[]>(
      `/reg/ai/tasks?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)) as any).toString()}`,
    ),
  aiTaskCreate: async (body: {
    name: string;
    items: string[];
    method: string;
    period?: { start?: string; end?: string };
    schools: string[];
  }) => {
    return post(`/reg/ai/tasks`, body);
  },
  aiTaskUpdate: async (id: string, patch: any) => {
    return post(`/reg/ai/tasks/${encodeURIComponent(id)}`, patch, 'PATCH');
  },
  aiTaskSetStatus: async (id: string, status: '待处理' | '进行中' | '已完成') => {
    return post(`/reg/ai/tasks/${encodeURIComponent(id)}/status?id=${encodeURIComponent(id)}`, { status }, 'PATCH');
  },
  // Broadcast
  aiBroadcast: async (body: { school: string; camera: string; text: string }) => {
    return post(`/reg/ai/broadcast`, body);
  },
  aiBroadcastLogs: () => get<any[]>(`/reg/ai/broadcast/logs`),
  aiMethods: () => get<string[]>(`/reg/ai/methods`),
  aiSchools: () => get<Array<{ id: string; name: string; linked: boolean }>>(`/reg/ai/schools`),
  // Bright kitchen (regulator)
  brightCameras: (schoolId?: string) =>
    get<any[]>(`/bright/reg/cameras${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`),
  brightStart: (schoolId: string, cameraId: string) =>
    get<any>(`/bright/start/${encodeURIComponent(schoolId)}/${encodeURIComponent(cameraId)}`),
  brightPlayback: (schoolId: string, cameraId: string, start?: string, end?: string) =>
    get<any[]>(
      `/bright/reg/playback?schoolId=${encodeURIComponent(schoolId)}&cameraId=${encodeURIComponent(cameraId)}${start ? `&start=${encodeURIComponent(start)}` : ''}${end ? `&end=${encodeURIComponent(end)}` : ''}`,
    ),
  brightSnapshots: (
    params: { schoolId?: string; cameraId?: string; start?: string; end?: string } = {},
  ) =>
    get<any[]>(
      `/bright/reg/snapshots?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)) as any).toString()}`,
    ),
  brightCreateSnapshot: async (body: {
    schoolId: string;
    cameraId: string;
    at?: string;
    url?: string;
  }) => {
    return post(`/bright/reg/snapshots`, body);
  },
  // Credentials (regulator)
  credCanteens: (schoolId?: string) =>
    get<any[]>(
      `/reg/credentials/canteens${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`,
    ),
  credWorkers: (schoolId?: string) =>
    get<any[]>(
      `/reg/credentials/workers${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`,
    ),
  credSuppliers: (schoolId?: string) =>
    get<any[]>(
      `/reg/credentials/suppliers${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`,
    ),
  credExceptions: (params: { type?: 'canteen' | 'worker' | 'supplier'; schoolId?: string } = {}) =>
    get<any[]>(
      `/reg/credentials/exceptions?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) as any).toString()}`,
    ),
  credSetMeasure: async (id: string, measure: string) => {
    return post(`/reg/credentials/exceptions/measure?id=${encodeURIComponent(id)}`, { measure }, 'PATCH');
  },
  credExportCsv: async (params: {
    target: 'canteens' | 'workers' | 'suppliers' | 'exceptions';
    type?: 'canteen' | 'worker' | 'supplier';
    schoolId?: string;
  }) => {
    const url = `/reg/credentials/export.csv?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) as any).toString()}`;
    const r = await fetch(`${BASE}${url}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const { csv } = await r.json();
    return csv as string;
  },
  // Ledgers (regulator)
  ledgerSampling: (
    params: {
      schoolId?: string;
      start?: string;
      end?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/reg/ledgers/sampling?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)) as any).toString()}`,
    ),
  ledgerDisinfection: (
    params: {
      schoolId?: string;
      method?: string;
      start?: string;
      end?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/reg/ledgers/disinfection?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)) as any).toString()}`,
    ),
  ledgerDine: (
    params: {
      schoolId?: string;
      meal?: string;
      start?: string;
      end?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/reg/ledgers/dine?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)) as any).toString()}`,
    ),
  ledgerWaste: (
    params: {
      schoolId?: string;
      category?: string;
      start?: string;
      end?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/reg/ledgers/waste?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)) as any).toString()}`,
    ),
  // Daily report
  dailyReport: (params: { start?: string; end?: string; schoolId?: string } = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => [k, String(v)]),
      ) as any,
    ).toString();
    return get<{ rows: any[]; summary: any }>(`/reg/reports/daily${qs ? `?${qs}` : ''}`);
  },
  // Food waste (regulator)
  foodWasteRanking: (params: { start?: string; end?: string; metric?: 'weight' | 'amount' } = {}) =>
    get<any[]>(
      `/reg/food-waste/ranking?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) as any).toString()}`,
    ),
  foodWasteDetails: (
    params: {
      schoolId?: string;
      source?: '库存损耗' | '加工制作损耗' | '剩菜剩饭损耗';
      start?: string;
      end?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/reg/food-waste/details?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)) as any).toString()}`,
    ),
  foodWasteExportCsv: async (
    params: {
      schoolId?: string;
      source?: '库存损耗' | '加工制作损耗' | '剩菜剩饭损耗';
      start?: string;
      end?: string;
    } = {},
  ) => {
    const url = `/reg/food-waste/details/export.csv?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) as any).toString()}`;
    const r = await fetch(`${BASE}${url}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const { csv } = await r.json();
    return csv as string;
  },
  foodWasteSummary: (params: { schoolId?: string; start?: string; end?: string } = {}) =>
    get<{ total: any; bySource: any[]; byReason: any[] }>(
      `/reg/food-waste/summary?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) as any).toString()}`,
    ),
  foodWasteTrend: (
    params: {
      schoolId?: string;
      start?: string;
      end?: string;
      bucket?: 'day' | 'week' | 'month';
    } = {},
  ) =>
    get<Array<{ period: string; weightKg: number; amountYuan: number }>>(
      `/reg/food-waste/trend?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) as any).toString()}`,
    ),
  foodWasteRankingExportCsv: async (
    params: { start?: string; end?: string; metric?: 'weight' | 'amount' } = {},
  ) => {
    const url = `/reg/food-waste/ranking/export.csv?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) as any).toString()}`;
    const r = await fetch(`${BASE}${url}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const { csv } = await r.json();
    return csv as string;
  },
  // Alerts (regulator)
  alertsSummary: (params: { start?: string; end?: string } = {}) =>
    get<{ stats: Array<{ type: string; count: number }> }>(
      `/reg/alerts/summary${Object.keys(params).length ? `?${new URLSearchParams(params as any).toString()}` : ''}`,
    ),
  alertsEvents: (
    params: {
      type?: string;
      schoolId?: string;
      start?: string;
      end?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/reg/alerts/events?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)) as any).toString()}`,
    ),
  alertsExportCsv: async (
    params: { type?: string; schoolId?: string; start?: string; end?: string } = {},
  ) => {
    const url = `/reg/alerts/events/export.csv?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) as any).toString()}`;
    const r = await fetch(`${BASE}${url}`, { headers: { ...authHeaders() } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const { csv } = await r.json();
    return csv as string;
  },
  alertsConfigGet: () => get<any>(`/reg/alerts/config`),
  alertsConfigSave: async (patch: any) => {
    const r = await fetch(`${BASE}/reg/alerts/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(patch),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  alertsNotify: async (body: {
    to: string[];
    message: string;
    channel?: 'sms' | 'app' | 'both';
  }) => {
    const r = await fetch(`${BASE}/reg/alerts/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  // Public feedback (regulator)
  publicFeedbackList: (
    params: {
      schoolId?: string;
      type?: '表扬' | '建议' | '投诉' | '评价' | '';
      status?: '待处理' | '已回复' | '';
      start?: string;
      end?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/reg/public/feedback/list?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)) as any).toString()}`,
    ),
  publicFeedbackExportCsv: async (
    params: {
      schoolId?: string;
      type?: '表扬' | '建议' | '投诉' | '评价';
      status?: '待处理' | '已回复';
      start?: string;
      end?: string;
    } = {},
  ) => {
    const url = `/reg/public/feedback/export.csv?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) as any).toString()}`;
    const r = await fetch(`${BASE}${url}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const { csv } = await r.json();
    return csv as string;
  },
  publicFeedbackStats: (params: { schoolId?: string; start?: string; end?: string } = {}) =>
    get<{ byType: any[]; byStatus: any[]; avgProcessingMs: number }>(
      `/reg/public/feedback/stats?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) as any).toString()}`,
    ),
  publicFeedbackReply: async (id: string, content: string) => {
    const r = await fetch(`${BASE}/reg/public/feedback/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, replyContent: content }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  // Inspections
  inspTasks: (
    params: {
      type?: '日常' | '专项' | '双随机' | '';
      status?: '待处理' | '进行中' | '已完成' | '';
      schoolId?: string;
      assignee?: string;
      start?: string;
      end?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/reg/inspections/tasks?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)) as any).toString()}`,
    ),
  inspTaskCreate: async (body: {
    type: '日常' | '专项';
    schoolId: string;
    assignee?: string;
    grid?: string;
    content: string;
  }) => {
    const r = await fetch(`${BASE}/reg/inspections/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  inspTaskRandom: async (body: {
    item: string;
    inspectorCount?: number;
    schoolIds?: string[];
    schoolCount?: number;
  }) => {
    const r = await fetch(`${BASE}/reg/inspections/tasks/random`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  inspTaskSubmit: async (
    id: string,
    body: {
      passed: boolean;
      items: Array<{ item: string; ok: boolean; remark?: string; penaltyType?: string }>;
      summary?: string;
    },
  ) => {
    const r = await fetch(`${BASE}/reg/inspections/tasks/${encodeURIComponent(id)}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  inspTasksExportCsv: async (
    params: {
      type?: '日常' | '专项' | '双随机';
      status?: '待处理' | '进行中' | '已完成';
      schoolId?: string;
      assignee?: string;
      start?: string;
      end?: string;
    } = {},
  ) => {
    const url = `/reg/inspections/tasks/export.csv?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) as any).toString()}`;
    const r = await fetch(`${BASE}${url}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const { csv } = await r.json();
    return csv as string;
  },
  inspInspectors: () => get<any[]>(`/reg/inspections/inspectors`),
  inspInspectorCreate: async (body: {
    name: string;
    region?: string;
    mobile?: string;
    grids?: string[];
  }) => {
    const r = await fetch(`${BASE}/reg/inspections/inspectors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  inspInspectorUpdate: async (id: string, patch: any) => {
    const r = await fetch(`${BASE}/reg/inspections/inspectors/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  inspInspectorDelete: async (id: string) => {
    const r = await fetch(`${BASE}/reg/inspections/inspectors/${encodeURIComponent(id)}/delete`, {
      method: 'POST',
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  inspConfig: () =>
    get<{ items: string[]; penalties: string[]; publications: string[] }>(
      `/reg/inspections/config`,
    ),
  inspConfigAddItem: async (name: string) => {
    const r = await fetch(`${BASE}/reg/inspections/config/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  inspConfigAddPenalty: async (name: string) => {
    const r = await fetch(`${BASE}/reg/inspections/config/penalties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  inspConfigAddPublication: async (name: string) => {
    const r = await fetch(`${BASE}/reg/inspections/config/publications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  inspConfigRemoveItem: async (name: string) => {
    const r = await fetch(`${BASE}/reg/inspections/config/items/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  inspConfigRemovePenalty: async (name: string) => {
    const r = await fetch(`${BASE}/reg/inspections/config/penalties/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  inspConfigRemovePublication: async (name: string) => {
    const r = await fetch(`${BASE}/reg/inspections/config/publications/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  // Reg system
  sysNews: (params: { page?: number; pageSize?: number; enabled?: 'true' | 'false' } = {}) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/reg/system/news?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) as any).toString()}`,
    ),
  sysNewsCreate: async (body: {
    title: string;
    content?: string;
    enabled?: boolean;
    pinned?: boolean;
  }) => {
    const r = await fetch(`${BASE}/reg/system/news`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  sysNewsUpdate: async (id: string, patch: any) => {
    const r = await fetch(`${BASE}/reg/system/news?id=${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  sysNewsSetEnabled: async (id: string, enabled: boolean) => {
    const r = await fetch(`${BASE}/reg/system/news/enabled?id=${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  sysNewsSetPinned: async (id: string, pinned: boolean) => {
    const r = await fetch(`${BASE}/reg/system/news/pinned?id=${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  sysNewsDelete: async (id: string) => {
    const r = await fetch(`${BASE}/reg/system/news/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  sysNewsDetail: (id: string) => get<any>(`/reg/system/news/detail?id=${encodeURIComponent(id)}`),
  sysLinkageList: (status?: 'PENDING' | 'APPROVED' | 'REJECTED' | '') =>
    get<any[]>(`/reg/system/linkage${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  sysLinkageReview: async (id: string, status: 'APPROVED' | 'REJECTED', comment?: string) => {
    const r = await fetch(`${BASE}/reg/system/linkage/review?id=${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, comment }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  sysApps: () => get<any[]>(`/reg/system/apps`),
  sysUsers: () => get<any[]>(`/reg/system/users`),
  sysUserCreate: async (body: {
    username: string;
    displayName: string;
    roles?: string[];
    enabled?: boolean;
  }) => {
    const r = await fetch(`${BASE}/reg/system/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  sysUserUpdate: async (id: string, patch: any) => {
    const r = await fetch(`${BASE}/reg/system/users?id=${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(patch),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  sysUserDelete: async (id: string) => {
    const r = await fetch(`${BASE}/reg/system/users/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ id }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  sysRoles: () => get<any[]>(`/reg/system/roles`),
  sysRoleCreate: async (body: { name: string; remark?: string }) => {
    const r = await fetch(`${BASE}/reg/system/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  sysPermissions: () => get<any[]>(`/reg/system/permissions`),
  sysSetUserRoles: async (id: string, roles: string[]) => {
    const r = await fetch(`${BASE}/reg/system/users/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ id, roles }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  sysSetRolePerms: async (name: string, permissions: string[]) => {
    const r = await fetch(`${BASE}/reg/system/roles/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ name, permissions }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  sysInfoGet: () => get<any>(`/reg/system/info`),
  sysInfoSave: async (body: any) => {
    const r = await fetch(`${BASE}/reg/system/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  // School account management
  sysCreateSchoolAccount: async (body: { schoolId: number; username: string; displayName?: string; phone?: string; password?: string; roles?: string[] }) => {
    const r = await fetch(`${BASE}/reg/system/school-accounts`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  sysSchoolAccountList: (params: { schoolId?: number; q?: string } = {}) =>
    get<any[]>(`/reg/system/school-accounts?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)) as any).toString()}`),
  sysSchoolAccountUpdate: async (id: number, patch: { displayName?: string; phone?: string; enabled?: boolean; roles?: string[]; schoolId?: number }) => {
    const r = await fetch(`${BASE}/reg/system/school-accounts/${encodeURIComponent(String(id))}?id=${encodeURIComponent(String(id))}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(patch),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  sysSchoolAccountDelete: async (id: number) => {
    const r = await fetch(`${BASE}/reg/system/school-accounts/${encodeURIComponent(String(id))}/delete?id=${encodeURIComponent(String(id))}`, { method: 'POST', headers: { ...authHeaders() } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
};
