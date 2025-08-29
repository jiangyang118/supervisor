const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3300';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  overview: () => get<any>('/reg/overview'),
  schools: () => get<any[]>('/reg/schools/stats'),
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
    const r = await fetch(`${BASE}${url}`);
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
    const r = await fetch(`${BASE}/reg/ai/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  aiTaskUpdate: async (id: string, patch: any) => {
    const r = await fetch(`${BASE}/reg/ai/tasks/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  aiTaskSetStatus: async (id: string, status: '待处理' | '进行中' | '已完成') => {
    const r = await fetch(
      `${BASE}/reg/ai/tasks/${encodeURIComponent(id)}/status?id=${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      },
    );
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  // Broadcast
  aiBroadcast: async (body: { school: string; camera: string; text: string }) => {
    const r = await fetch(`${BASE}/reg/ai/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
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
    const r = await fetch(`${BASE}/bright/reg/snapshots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
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
    const r = await fetch(
      `${BASE}/reg/credentials/exceptions/measure?id=${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ measure }),
      },
    );
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
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
  // Training & Exams (regulator)
  ledgerTraining: (params: { schoolId?: string; page?: number; pageSize?: number } = {}) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/reg/ledgers/training?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)) as any).toString()}`,
    ),
  ledgerExams: (params: { schoolId?: string; page?: number; pageSize?: number } = {}) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/reg/ledgers/exams?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)) as any).toString()}`,
    ),
  ledgerTrainingExportCsv: async (params: { schoolId?: string } = {}) => {
    const url = `/reg/ledgers/training/export.csv?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) as any).toString()}`;
    const r = await fetch(`${BASE}${url}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const { csv } = await r.json();
    return csv as string;
  },
  ledgerExamsExportCsv: async (params: { schoolId?: string } = {}) => {
    const url = `/reg/ledgers/exams/export.csv?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) as any).toString()}`;
    const r = await fetch(`${BASE}${url}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const { csv } = await r.json();
    return csv as string;
  },
  ledgerResults: (
    params: {
      schoolId?: string;
      examId?: string;
      user?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/reg/ledgers/results?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)) as any).toString()}`,
    ),
  ledgerResultsExportCsv: async (
    params: { schoolId?: string; examId?: string; user?: string } = {},
  ) => {
    const url = `/reg/ledgers/results/export.csv?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) as any).toString()}`;
    const r = await fetch(`${BASE}${url}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const { csv } = await r.json();
    return csv as string;
  },
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
    const r = await fetch(`${BASE}${url}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const { csv } = await r.json();
    return csv as string;
  },
  alertsConfigGet: () => get<any>(`/reg/alerts/config`),
  alertsConfigSave: async (patch: any) => {
    const r = await fetch(`${BASE}/reg/alerts/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  sysUserUpdate: async (id: string, patch: any) => {
    const r = await fetch(`${BASE}/reg/system/users?id=${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  sysUserDelete: async (id: string) => {
    const r = await fetch(`${BASE}/reg/system/users/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  sysRoles: () => get<any[]>(`/reg/system/roles`),
  sysPermissions: () => get<any[]>(`/reg/system/permissions`),
  sysSetUserRoles: async (id: string, roles: string[]) => {
    const r = await fetch(`${BASE}/reg/system/users/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, roles }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  sysSetRolePerms: async (name: string, permissions: string[]) => {
    const r = await fetch(`${BASE}/reg/system/roles/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, permissions }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  sysInfoGet: () => get<any>(`/reg/system/info`),
  sysInfoSave: async (body: any) => {
    const r = await fetch(`${BASE}/reg/system/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
};
