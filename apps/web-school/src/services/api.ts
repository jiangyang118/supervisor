// API基础地址（主平台网关）
const BASE = (import.meta as any).env?.VITE_API_BASE || '/api';
export const API_BASE = BASE;
// 学校端集成服务（MEGO 对接演示服务，默认 4001）
const SCHOOL_INTEGRATION_BASE = (window as any)?.SCHOOL_INTEGRATION_BASE || 'http://localhost:4001';

function authHeaders(): Record<string, string> {
  const token = (typeof localStorage !== 'undefined' && (localStorage.getItem('AUTH_TOKEN') || sessionStorage.getItem('AUTH_TOKEN'))) || '';
  return token ? { Authorization: `Bearer ${token}` } : ({} as Record<string, string>);
}

function handleUnauthorized(status: number) {
  if (status === 401) {
    try {
      localStorage.removeItem('AUTH_TOKEN');
      localStorage.removeItem('AUTH_USER');
      sessionStorage.removeItem('AUTH_TOKEN');
      sessionStorage.removeItem('AUTH_USER');
    } catch {}
    try { (window as any).ElMessage?.warning?.('登录已过期，请重新登录'); } catch {}
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.replace('/login');
    }
  }
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { ...authHeaders() } });
  if (!res.ok) { handleUnauthorized(res.status); throw new Error(`HTTP ${res.status}`); }
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body?: any): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) { handleUnauthorized(res.status); throw new Error(`HTTP ${res.status}`); }
  return res.json() as Promise<T>;
}

export const api = {
  inbound: () => get<any[]>('/home/inbound'),
  outbound: () => get<any[]>('/home/outbound'),
  hygiene: () => get<any[]>('/home/hygiene'),
  devices: () => get<any[]>('/home/devices'),
  // Regulator meta for school options (shared list)
  regSchools: () => get<Array<{ id: number; name: string }>>('/reg/schools'),
  // Bright kitchen (school)
  brightCameras: (schoolId?: string) =>
    get<any[]>(
      `/bright/school/cameras${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`,
    ),
  brightStart: (schoolId: string, cameraId: string) =>
    get<any>(`/bright/start/${encodeURIComponent(schoolId)}/${encodeURIComponent(cameraId)}`),
  brightPlayback: (schoolId: string, cameraId: string, start?: string, end?: string) =>
    get<any[]>(
      `/bright/school/playback?schoolId=${encodeURIComponent(schoolId)}&cameraId=${encodeURIComponent(cameraId)}${start ? `&start=${encodeURIComponent(start)}` : ''}${end ? `&end=${encodeURIComponent(end)}` : ''}`,
    ),
  brightDownload: async (schoolId: string, cameraId: string, start?: string, end?: string) =>
    get<string[]>(
      `/bright/school/download?schoolId=${encodeURIComponent(schoolId)}&cameraId=${encodeURIComponent(cameraId)}${start ? `&start=${encodeURIComponent(start)}` : ''}${end ? `&end=${encodeURIComponent(end)}` : ''}`,
    ),
  brightSnapshots: (
    params: { schoolId?: string; cameraId?: string; start?: string; end?: string } = {},
  ) =>
    get<any[]>(
      `/bright/school/snapshots?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)) as any).toString()}`,
    ),
  brightCreateSnapshot: async (body: {
    schoolId?: string;
    cameraId: string;
    at?: string;
    url?: string;
  }) => {
    const res = await fetch(`${BASE}/bright/school/snapshots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  feedback: () => get<any[]>('/home/parent-feedback'),
  schoolEvents: (schoolId?: string) =>
    get<any[]>(`/school/ai/events${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`),
  aiTypes: () => get<Array<{ code: string; label: string }>>('/school/ai/types'),
  aiEventsList: (
    params: {
      schoolId?: string;
      type?: string;
      status?: 'OPEN' | 'ACK' | 'CLOSED';
      start?: string;
      end?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/school/ai/events?${new URLSearchParams(
        Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null),
        ) as any,
      ).toString()}`,
    ),
  aiEventsSummary: (
    params: {
      schoolId?: string;
      dim?: 'day' | 'week' | 'month';
      start?: string;
      end?: string;
    } = {},
  ) =>
    get<Array<{ date: string; type: string; count: number; status?: string }>>(
      `/school/ai/events/summary?${new URLSearchParams(
        Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null),
        ) as any,
      ).toString()}`,
    ),
  aiEventsSummaryExportCsv: async (
    params: {
      schoolId?: string;
      dim?: 'day' | 'week' | 'month';
      start?: string;
      end?: string;
    } = {},
  ) => {
    const res = await fetch(
      `${BASE}/school/ai/events/summary/export.csv?${new URLSearchParams(
        Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null),
        ) as any,
      ).toString()}`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { csv } = await res.json();
    return csv as string;
  },
  aiEventHandle: async (eventId: string, measure: string) => {
    const res = await fetch(`${BASE}/school/ai/events/handle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, measure }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  aiEventSetStatus: async (id: string, status: 'OPEN' | 'ACK' | 'CLOSED') => {
    const res = await fetch(`${BASE}/school/ai/events/status?id=${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  schoolDaily: (schoolId?: string) =>
    get<any>(`/reports/school/daily${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`),
  // MEGO 集成（学校端集成服务：apps/school-api）
  megoDiscover: async (body: { equipmentCode: string; candidates: string[] }) => {
    const res = await fetch(`${SCHOOL_INTEGRATION_BASE}/api/devices/discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<{ results: Array<{ baseUrl: string; ok: boolean }>; autoSelected: string | null }>;
  },
  megoEmployeesRefresh: async (equipmentCode?: string) => {
    const res = await fetch(`${SCHOOL_INTEGRATION_BASE}/api/employees/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipmentCode }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<{ success: boolean; count?: number; message?: string }>;
  },
  megoEmployees: async () => {
    const res = await fetch(`${SCHOOL_INTEGRATION_BASE}/api/employees`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<{ data: Array<{ userId: string; name: string; healthStartTime?: string; healthEndTime?: string }> }>;
  },
  megoMorningChecks: async () => {
    const res = await fetch(`${SCHOOL_INTEGRATION_BASE}/api/morning-checks`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<{ data: any[] }>;
  },
  // Morning check APIs
  morningList: (
    params: {
      staff?: string;
      result?: '正常' | '异常' | '';
      start?: string;
      end?: string;
      page?: number;
      pageSize?: number;
      schoolId?: number;
    } = {},
  ) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/school/morning-checks?${new URLSearchParams(
        Object.fromEntries(
          Object.entries({ ...params })
            .filter(([, v]) => v !== undefined && v !== '' && v !== null)
            .map(([k, v]) => [k, String(v)]),
        ) as any,
      ).toString()}`,
    ),
  morningCreate: async (body: { staff: string; temp: number; schoolId?: number }) => {
    const res = await fetch(`${BASE}/school/morning-checks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  morningDelete: async (id: number) => {
    const res = await fetch(`${BASE}/school/morning-checks/${encodeURIComponent(String(id))}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  morningSetMeasure: async (id: number, measure: string) => {
    const res = await fetch(`${BASE}/school/morning-checks/${encodeURIComponent(String(id))}/measure`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ measure }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  // Sampling APIs
  samplingList: (
    params: {
      sample?: string;
      status?: string;
      exception?: 'true' | 'false';
      start?: string;
      end?: string;
      page?: number;
      pageSize?: number;
      schoolId?: number;
    } = {},
  ) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/school/sampling/records?${new URLSearchParams(
        Object.fromEntries(
          Object.entries({ ...params })
            .filter(([, v]) => v !== undefined && v !== '' && v !== null)
            .map(([k, v]) => [k, String(v)]),
        ) as any,
      ).toString()}`,
    ),
  samplingCreate: async (body: {
    sample: string;
    weight: number;
    imageUrl?: string;
    duration: number;
    by: string;
    cabinet?: string;
    schoolId?: number;
  }) => {
    const res = await fetch(`${BASE}/school/sampling/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  samplingSetMeasure: async (id: number, measure: string) => {
    const res = await fetch(`${BASE}/school/sampling/records/${encodeURIComponent(String(id))}/measure`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ measure }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  // Pesticide test APIs
  pesticideList: (
    params: {
      q?: string;
      result?: '合格' | '不合格';
      start?: string;
      end?: string;
      page?: number;
      pageSize?: number;
      schoolId?: number;
    } = {},
  ) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/school/pesticide/records?${new URLSearchParams(
        Object.fromEntries(
          Object.entries({ ...params })
            .filter(([, v]) => v !== undefined && v !== '' && v !== null)
            .map(([k, v]) => [k, String(v)]),
        ) as any,
      ).toString()}`,
    ),
  pesticideCreate: async (body: {
    sample: string;
    device: string;
    result: '合格' | '不合格';
    imageUrl?: string;
    remark?: string;
    schoolId?: number;
  }) => {
    const res = await fetch(`${BASE}/school/pesticide/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  // System news (platform infos)
  sysNews: (params: { page?: number; pageSize?: number; enabled?: 'true' | 'false' } = {}) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/school/system/news?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) as any).toString()}`,
    ),
  sysNewsDetail: (id: string) =>
    get<any>(`/school/system/news/detail?id=${encodeURIComponent(id)}`),
  // File upload (simple JSON-based)
  uploadFile: async (filename: string, content: string) => {
    const res = await fetch(`${BASE}/files/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, content }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { url: string; filename?: string };
    const url = data.url?.startsWith('/') ? `${BASE}${data.url}` : data.url;
    return { url };
  },
  // Hygiene inspections + asset maintenance
  hygieneList: (
    params: {
      result?: '合格' | '不合格';
      start?: string;
      end?: string;
      page?: number;
      pageSize?: number;
      schoolId?: number;
    } = {},
  ) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/school/hygiene/inspections?${new URLSearchParams(
        Object.fromEntries(
          Object.entries({ ...params })
            .filter(([, v]) => v !== undefined && v !== '' && v !== null)
            .map(([k, v]) => [k, String(v)]),
        ) as any,
      ).toString()}`,
    ),
  hygieneCreate: async (body: {
    date?: string;
    result: '合格' | '不合格';
    by: string;
    remark?: string;
    schoolId?: number;
  }) => {
    const res = await fetch(`${BASE}/school/hygiene/inspections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  assetsList: (
    params: {
      asset?: string;
      start?: string;
      end?: string;
      page?: number;
      pageSize?: number;
      schoolId?: number;
    } = {},
  ) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/school/assets/maintenance?${new URLSearchParams(
        Object.fromEntries(
          Object.entries({ ...params })
            .filter(([, v]) => v !== undefined && v !== '' && v !== null)
            .map(([k, v]) => [k, String(v)]),
        ) as any,
      ).toString()}`,
    ),
  assetsCreate: async (body: {
    asset: string;
    date?: string;
    action: string;
    by: string;
    schoolId?: number;
  }) => {
    const res = await fetch(`${BASE}/school/assets/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  // Disinfection APIs
  disinfectionList: (
    params: {
      method?: string;
      exception?: 'true' | 'false';
      start?: string;
      end?: string;
      page?: number;
      pageSize?: number;
      schoolId?: string;
    } = {},
  ) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/school/disinfection/records?${new URLSearchParams(
        Object.fromEntries(
          Object.entries({ ...params })
            .filter(([, v]) => v !== undefined && v !== '' && v !== null)
            .map(([k, v]) => [k, String(v)]),
        ) as any,
      ).toString()}`,
    ),
  disinfectionCreate: async (body: {
    method: string;
    duration: number;
    items: string;
    imageUrl?: string;
    schoolId?: string;
  }) => {
    const res = await fetch(`${BASE}/school/disinfection/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  disinfectionSetMeasure: async (id: string, measure: string) => {
    const res = await fetch(
      `${BASE}/school/disinfection/records/${encodeURIComponent(id)}/measure`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ measure }),
      },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  disinfectionDetail: (id: string) => get<any>(`/school/disinfection/records/${encodeURIComponent(id)}`),
  disinfectionImport: async (payload: { items: any[] } | string) => {
    const isCsv = typeof payload === 'string';
    const res = await fetch(`${BASE}/school/disinfection/records/import`, {
      method: 'POST',
      headers: isCsv ? { 'Content-Type': 'text/plain;charset=utf-8' } : { 'Content-Type': 'application/json' },
      body: isCsv ? (payload as string) : JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  // Waste (废弃物管理)
  wasteCategories: () => get<any[]>(`/school/waste/categories`),
  wasteCategoryCreate: async (name: string) => {
    const res = await fetch(`${BASE}/school/waste/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  wasteCategorySetEnabled: async (id: string, enabled: boolean) => {
    const res = await fetch(`${BASE}/school/waste/categories/${encodeURIComponent(id)}/enable`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  wasteCategoryDelete: async (id: string) => {
    const res = await fetch(`${BASE}/school/waste/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  wasteList: (
    params: {
      category?: string;
      start?: string;
      end?: string;
      page?: number;
      pageSize?: number;
      schoolId?: number;
      canteenId?: number;
    } = {},
  ) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/school/waste/records?${new URLSearchParams(
        Object.fromEntries(
          Object.entries({ ...params })
            .filter(([, v]) => v !== undefined && v !== '' && v !== null)
            .map(([k, v]) => [k, String(v)]),
        ) as any,
      ).toString()}`,
    ),
  wasteCreate: async (body: {
    date?: string;
    category: string;
    amount: number;
    buyer: string;
    person: string;
    schoolId?: number;
    canteenId?: number;
  }) => {
    const res = await fetch(`${BASE}/school/waste/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  wasteDelete: async (id: number) => {
    const res = await fetch(`${BASE}/school/waste/records/${encodeURIComponent(String(id))}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  pesticideDeviceCallback: async (body: {
    sample: string;
    device: string;
    result: '合格' | '不合格';
    remark?: string;
    schoolId?: number;
  }) => {
    const res = await fetch(`${BASE}/school/pesticide/device/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  pesticideSetMeasure: async (id: number, measure: string) => {
    const res = await fetch(`${BASE}/school/pesticide/records/${encodeURIComponent(String(id))}/measure`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ measure }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  // Dine-with APIs
  dineMeals: () => get<{ items: string[] }>(`/school/dine/meals`),
  dineMealOptions: () => get<{ items: Array<{ key: string; value: number; label: string }> }>(`/school/dine/meal-options`),
  dineList: (
    params: {
      meal?: string;
      mealCode?: number;
      exception?: 'true' | 'false';
      start?: string;
      end?: string;
      page?: number;
      pageSize?: number;
      schoolId?: string;
    } = {},
  ) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/school/dine/records?${new URLSearchParams(
        Object.fromEntries(
          Object.entries({ ...params })
            .filter(([, v]) => v !== undefined && v !== '' && v !== null)
            .map(([k, v]) => [k, String(v)]),
        ) as any,
      ).toString()}`,
    ),
  dineCreate: async (body: {
    meal?: string;
    mealCode?: number;
    people: string[];
    imageUrl?: string;
    comment?: string;
    schoolId?: string;
  }) => {
    const res = await fetch(`${BASE}/school/dine/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  dineSetMeasure: async (id: string, measure: string) => {
    const res = await fetch(`${BASE}/school/dine/records/${encodeURIComponent(id)}/measure`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ measure }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  dineQrCreate: async (mealOrCode: string | number, schoolId?: string) => {
    const res = await fetch(`${BASE}/school/dine/qr/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        typeof mealOrCode === 'number'
          ? { mealCode: mealOrCode, schoolId }
          : { mealKey: mealOrCode, schoolId },
      ),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  // Inventory module
  invCategories: (schoolId?: string) => get<any[]>(`/school/inventory/categories${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`),
  invCategoryCreate: async (name: string, schoolId?: string) => {
    const res = await fetch(`${BASE}/school/inventory/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, schoolId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  // Products v2
  invProducts: (schoolId?: string) => get<any[]>(`/school/inventory/products${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`),
  invProductCreate: async (body: { schoolId?: string | number; name: string; unit: string; category?: string; spec?: string; lastPrice?: number }) => {
    const res = await fetch(`${BASE}/school/inventory/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  invProductUpdate: async (id: number, patch: any) => {
    const res = await fetch(`${BASE}/school/inventory/products?id=${encodeURIComponent(String(id))}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  invImportCloud: () => get<any>(`/school/inventory/products/import/cloud`),
  invImportTemplate: async (schoolId: string | number | undefined, items: Array<{ name: string; unit: string; category?: string; spec?: string; lastPrice?: number }>) => {
    const res = await fetch(`${BASE}/school/inventory/products/import/template`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schoolId, items }) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  invProductDelete: async (id: number) => {
    const res = await fetch(`${BASE}/school/inventory/products/delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  // invProducts endpoints removed
  invSuppliers: (
    params: {
      q?: string;
      enabled?: 'true' | 'false';
      expired?: 'true' | 'false';
      expireStart?: string;
      expireEnd?: string;
      page?: number;
      pageSize?: number;
      schoolId?: string;
    } = {},
  ) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/school/inventory/suppliers?${new URLSearchParams(
        Object.fromEntries(
          Object.entries({ ...params })
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v]) => [k, String(v)]),
        ) as any,
      ).toString()}`,
    ),
  invSupplierCreate: async (body: any) => {
    const res = await fetch(`${BASE}/school/inventory/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  invWarehouses: (schoolId?: string) =>
    get<any[]>(
      `/school/inventory/warehouses${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`,
    ),
  invWarehouseCreate: async (body: {
    name: string;
    location?: string;
    capacity?: number;
    schoolId?: string;
  }) => {
    const res = await fetch(`${BASE}/school/inventory/warehouses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  invWarehouseUpdate: async (
    id: string,
    body: { name?: string; location?: string; capacity?: number },
  ) => {
    const res = await fetch(`${BASE}/school/inventory/warehouses?id=${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  invWarehouseDelete: async (id: string) => {
    const res = await fetch(`${BASE}/school/inventory/warehouses/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  invInboundList: (schoolId?: string) =>
    get<any[]>(
      `/school/inventory/inbound${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`,
    ),
  invInboundDocs: (schoolId?: string) =>
    get<any[]>(
      `/school/inventory/inbound/docs${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`,
    ),
  invInboundCreate: async (body: {
    productId: string;
    qty: number;
    supplierId?: string;
    warehouseId?: string;
    imageUrl?: string;
    schoolId?: string;
  }) => {
    const res = await fetch(`${BASE}/school/inventory/inbound`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  invInboundDocDetail: (docNo: string) =>
    get<any>(`/school/inventory/inbound/doc?docNo=${encodeURIComponent(docNo)}`),
  invInboundCreateDoc: async (body: any) => {
    const res = await fetch(`${BASE}/school/inventory/inbound/doc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  invOutboundList: (schoolId?: string) =>
    get<any[]>(
      `/school/inventory/outbound${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`,
    ),
  invOutboundBatches: (params: { schoolId?: string | number; productId: string | number; canteenId?: string | number }) =>
    get<any[]>(
      `/school/inventory/outbound/batches?${new URLSearchParams(
        Object.fromEntries(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, String(v)]),
        ) as any,
      ).toString()}`,
    ),
  invOutboundCreate: async (body: {
    productId: string;
    qty: number;
    purpose?: string;
    by?: string;
    receiver?: string;
    canteenId?: number;
    date?: string;
    warehouseId?: string;
    schoolId?: string;
  }) => {
    const res = await fetch(`${BASE}/school/inventory/outbound`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  invStock: (schoolId?: string) =>
    get<any[]>(
      `/school/inventory/stock${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`,
    ),
  invStockBatches: (params: { schoolId?: string | number; near?: 'true' | 'false' } = {}) =>
    get<any[]>(
      `/school/inventory/stock/batches?${new URLSearchParams(
        Object.fromEntries(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, String(v)]),
        ) as any,
      ).toString()}`,
    ),
  invStocktakeBatch: async (body: { schoolId?: string | number; inboundId: number | string; actualQty: number; operator?: string }) => {
    const res = await fetch(`${BASE}/school/inventory/stock/stocktake-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  invStocktake: async (body: { productId: string; qty: number; schoolId?: string }) => {
    const res = await fetch(`${BASE}/school/inventory/stock/stocktake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  invTickets: (schoolId?: string) =>
    get<any[]>(
      `/school/inventory/tickets${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`,
    ),
  invTicketCreate: async (body: {
    productId: string;
    type: string;
    imageUrl?: string;
    schoolId?: string;
  }) => {
    const res = await fetch(`${BASE}/school/inventory/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  invAdditives: (schoolId?: string) =>
    get<any[]>(
      `/school/inventory/additives${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`,
    ),
  invAdditiveCreate: async (body: {
    name: string;
    amount: number;
    dish?: string;
    by?: string;
    schoolId?: string;
  }) => {
    const res = await fetch(`${BASE}/school/inventory/additives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  // Certificates (资质证件)
  certList: (params: { owner?: string; type?: string; status?: '有效' | '过期'; schoolId?: string | number } = {}) =>
    get<any[]>(
      `/school/certificates?${new URLSearchParams(
        Object.fromEntries(
          Object.entries({ ...params })
            .filter(([, v]) => v !== undefined && v !== '' && v !== null)
            .map(([k, v]) => [k, String(v)]),
        ) as any,
      ).toString()}`,
    ),
  certCreate: async (body: { owner: string; type: string; number: string; expireAt: string; schoolId?: string | number }) => {
    const res = await fetch(`${BASE}/school/certificates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  certUpdate: async (
    id: string,
    body: { owner?: string; type?: string; number?: string; expireAt?: string },
  ) => {
    const res = await fetch(`${BASE}/school/certificates?id=${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  certDelete: async (id: string) => {
    const res = await fetch(`${BASE}/school/certificates/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  certExportCsv: async (
    params: { owner?: string; type?: string; status?: '有效' | '过期'; schoolId?: string | number } = {},
  ) => {
    const url = `/school/certificates/export.csv?${new URLSearchParams(
      Object.fromEntries(
        Object.entries({ ...params })
          .filter(([, v]) => v !== undefined && v !== '' && v !== null)
          .map(([k, v]) => [k, String(v)]),
      ) as any,
    ).toString()}`;
    const res = await fetch(`${BASE}${url}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { csv } = await res.json();
    return csv as string;
  },
  // Canteen & licenses summary (school-side)
  canteensSummary: (schoolId?: string | number) =>
    get<any[]>(`/school/canteens/summary${schoolId ? `?schoolId=${encodeURIComponent(String(schoolId))}` : ''}`),
  canteensList: async (schoolId?: string | number) => {
    const res = await fetch(`${BASE}/school/canteens${schoolId ? `?schoolId=${encodeURIComponent(String(schoolId))}` : ''}`, { headers: { ...authHeaders() } });
    if (!res.ok) { handleUnauthorized(res.status); throw new Error(`HTTP ${res.status}`); }
    return res.json();
  },
  canteensAll: async (schoolId?: string | number) => {
    const qs = new URLSearchParams(Object.fromEntries(Object.entries({ schoolId, enabled: 'all' }).filter(([,v])=> v!==undefined && v!==null)) as any).toString();
    const res = await fetch(`${BASE}/school/canteens?${qs}`, { headers: { ...authHeaders() } });
    if (!res.ok) { handleUnauthorized(res.status); throw new Error(`HTTP ${res.status}`); }
    return res.json();
  },
  canteensByStatus: async (schoolId?: string | number, enabled: 'all' | 'true' | 'false' = 'all') => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries({ schoolId, enabled }).filter(([,v])=> v!==undefined && v!==null)
      ) as any,
    ).toString();
    const res = await fetch(`${BASE}/school/canteens?${qs}`, { headers: { ...authHeaders() } });
    if (!res.ok) { handleUnauthorized(res.status); throw new Error(`HTTP ${res.status}`); }
    return res.json();
  },
  canteenCreateSimple: async (body: { schoolId?: number; name: string; code?: string; address?: string; manager?: string; phone?: string; enabled?: boolean }) => {
    const res = await fetch(`${BASE}/school/canteens`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) });
    if (!res.ok) { handleUnauthorized(res.status); throw new Error(`HTTP ${res.status}`); }
    return res.json();
  },
  canteenUpdateSimple: async (id: number, patch: { name?: string; code?: string; address?: string; manager?: string; phone?: string; enabled?: boolean }) => {
    const res = await fetch(`${BASE}/school/canteens?id=${encodeURIComponent(String(id))}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(patch) });
    if (!res.ok) { handleUnauthorized(res.status); throw new Error(`HTTP ${res.status}`); }
    return res.json();
  },
  // Personnel (staff + health cert)
  personnelList: (
    params: { schoolId?: string | number; name?: string; phone?: string; canteenId?: number; page?: number; pageSize?: number } = {},
  ) => get<{ items: any[]; total: number; page: number; pageSize: number }>(
    `/school/personnel?${new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null).map(([k,v])=>[k,String(v)])) as any,
    ).toString()}`,
  ),
  personnelCreate: async (body: any) => {
    const res = await fetch(`${BASE}/school/personnel`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) });
    if (!res.ok) { handleUnauthorized(res.status); throw new Error(`HTTP ${res.status}`); }
    return res.json();
  },
  personnelUpdate: async (id: number, patch: any) => {
    const res = await fetch(`${BASE}/school/personnel?id=${encodeURIComponent(String(id))}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(patch) });
    if (!res.ok) { handleUnauthorized(res.status); throw new Error(`HTTP ${res.status}`); }
    return res.json();
  },
  personnelDelete: async (id: number) => {
    const res = await fetch(`${BASE}/school/personnel/delete`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ id }) });
    if (!res.ok) { handleUnauthorized(res.status); throw new Error(`HTTP ${res.status}`); }
    return res.json();
  },
  personnelDetail: (id: number | string) => get<any>(`/school/personnel/detail?id=${encodeURIComponent(String(id))}`),
  invSupplierUpdate: async (id: string, body: any) => {
    const res = await fetch(`${BASE}/school/inventory/suppliers?id=${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  invSupplierDelete: async (id: string) => {
    const res = await fetch(`${BASE}/school/inventory/suppliers/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  invSupplierDetail: async (id: string | number) => get<any>(`/school/inventory/suppliers/detail?id=${encodeURIComponent(String(id))}`),
  invSuppliersBatchEnable: async (ids: string[], enabled: boolean) => {
    const res = await fetch(`${BASE}/school/inventory/suppliers/enable/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, enabled }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  invSuppliersExportCsv: async () => {
    const res = await fetch(`${BASE}/school/inventory/suppliers/export.csv`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { csv } = await res.json();
    return csv as string;
  },
  invSuppliersImport: async (payload: { items: any[] } | string) => {
    const isCsv = typeof payload === 'string';
    const res = await fetch(`${BASE}/school/inventory/suppliers/import`, {
      method: 'POST',
      headers: isCsv
        ? { 'Content-Type': 'text/plain;charset=utf-8' }
        : { 'Content-Type': 'application/json' },
      body: isCsv ? (payload as string) : JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  invSupplierAddCert: async (
    id: string | number,
    body: { type: string; number?: string; authority?: string; expireAt?: string; imageUrl?: string },
  ) => {
    const res = await fetch(`${BASE}/school/inventory/suppliers/${encodeURIComponent(String(id))}/certificates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  invSupplierSummary: async (id: string | number) => {
    return get<{ products: any[]; inbound: any[] }>(`/school/inventory/suppliers/summary?id=${encodeURIComponent(String(id))}`);
  },
  // Canteens & licenses
  canteenDetail: (canteenId: number | string, schoolId?: number | string) =>
    get<any>(`/school/canteen-detail?canteenId=${encodeURIComponent(String(canteenId))}${schoolId ? `&schoolId=${encodeURIComponent(String(schoolId))}` : ''}`),
  canteenDetailUpdate: async (body: {
    canteenId: number;
    name?: string;
    address?: string;
    manager?: string;
    phone?: string;
    biz?: { id?: number; number: string; authority?: string; expireAt: string; imageUrl?: string };
    food?: { id?: number; number: string; authority?: string; permitItems?: string; expireAt: string; imageUrl?: string };
  }) => {
    const res = await fetch(`${BASE}/school/canteen-detail`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    });
    if (!res.ok) { handleUnauthorized(res.status); throw new Error(`HTTP ${res.status}`); }
    return res.json();
  },
  canteenDetailDelete: async (canteenId: number) => {
    const res = await fetch(`${BASE}/school/canteen-detail/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ canteenId }),
    });
    if (!res.ok) { handleUnauthorized(res.status); throw new Error(`HTTP ${res.status}`); }
    return res.json();
  },
  canteenCreate: async (body: { schoolId?: number; name: string; address?: string; manager?: string; phone?: string }) => {
    const res = await fetch(`${BASE}/school/canteens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    });
    if (!res.ok) { handleUnauthorized(res.status); throw new Error(`HTTP ${res.status}`); }
    return res.json();
  },
  // Public config
  publicConfigGet: (schoolId?: string) => get<any>(`/school/public/config${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`),
  publicConfigUpdate: async (cfg: any & { schoolId?: string }) => {
    const res = await fetch(`${BASE}/school/public/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  publicConfigAudit: (schoolId?: string) => get<any[]>(`/school/public/config/audit${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`),
  // Analytics
  analyticsDashboard: (params: { schoolId?: string } = {}) =>
    get<any>(
      `/school/analytics/dashboard${params.schoolId ? `?schoolId=${encodeURIComponent(params.schoolId)}` : ''}`,
    ),
  analyticsAlerts: (
    params: { schoolId?: string; type?: string; status?: '未处理' | '已处理'; start?: string; end?: string; canteenId?: number } = {},
  ) =>
    get<{ items: any[]; summary: Array<{ name: string; count: number }> }>(
      `/school/analytics/alerts?${new URLSearchParams(
        Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null),
        ) as any,
      ).toString()}`,
    ),
  analyticsAlertHandle: async (payload: { id: string; type: string; measure?: string; status?: '未处理' | '已处理' }) => {
    const res = await fetch(`${BASE}/school/analytics/alerts/handle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) { handleUnauthorized(res.status); throw new Error(`HTTP ${res.status}`); }
    return res.json();
  },
  // Devices
  // deviceTypes/deviceStatuses defined earlier; keep single source to avoid duplicates
  devicesList: (params: { schoolId?: string; type?: string; status?: string; q?: string } = {}) =>
    get<any[]>(
      `/school/devices?${new URLSearchParams(
        Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null),
        ) as any,
      ).toString()}`,
    ),
  // Risk (hazard)
  riskCatalog: () => get<any[]>(`/school/risk/catalog`),
  riskCatalogCreate: async (body: {
    category?: string;
    title: string;
    level: '低' | '中' | '高';
    desc?: string;
  }) => {
    const res = await fetch(`${BASE}/school/risk/catalog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  // Device safety checks
  deviceSafetyList: (
    params: { schoolId?: number | string; canteenId?: number; start?: string; end?: string; page?: number; pageSize?: number } = {},
  ) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/school/device-safety?${new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null).map(([k,v])=>[k,String(v)])) as any,
      ).toString()}`,
    ),
  deviceSafetyCreate: async (body: {
    schoolId?: number | string;
    canteenId?: number | string;
    deviceName: string;
    items: string[];
    result: '正常' | '异常';
    description?: string;
    measures?: string;
    handler?: string;
    imageUrl?: string;
    signatureData?: string;
    checkDate: string;
  }) => {
    const res = await fetch(`${BASE}/school/device-safety`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    });
    if (!res.ok) { handleUnauthorized(res.status); throw new Error(`HTTP ${res.status}`); }
    return res.json();
  },
  deviceSafetyDetail: (id: number | string) => get<any>(`/school/device-safety/detail?id=${encodeURIComponent(String(id))}`),
  riskCatalogUpdate: async (id: string, body: any) => {
    const res = await fetch(`${BASE}/school/risk/catalog?id=${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  riskCatalogDelete: async (id: string) => {
    const res = await fetch(`${BASE}/school/risk/catalog/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  riskReports: (
    params: {
      schoolId?: string;
      status?: '待处理' | '整改中' | '已整改';
      start?: string;
      end?: string;
      location?: string;
      object?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) =>
    get<any>(
      `/school/risk/reports?${new URLSearchParams(Object.fromEntries(Object.entries({ ...params }).filter(([, v]) => v !== undefined && v !== '' && v !== null)) as any).toString()}`,
    ),
  riskReportCreate: async (body: {
    schoolId?: string;
    location: string;
    object: string;
    desc: string;
    images?: string[];
    riskId?: string;
  }) => {
    const res = await fetch(`${BASE}/school/risk/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  riskReportSetStatus: async (
    id: string,
    body: { status: '待处理' | '整改中' | '已整改'; measures?: string; rectifiedBy?: string },
  ) => {
    const res = await fetch(`${BASE}/school/risk/reports/status?id=${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  riskReportsExportCsv: async (params: any = {}) => {
    const url = `/school/risk/reports/export.csv?${new URLSearchParams(Object.fromEntries(Object.entries({ ...params }).filter(([, v]) => v !== undefined && v !== '' && v !== null)) as any).toString()}`;
    const r = await fetch(`${BASE}${url}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const { csv } = await r.json();
    return csv as string;
  },
  riskTasks: (
    params: {
      schoolId?: string;
      assignee?: string;
      status?: '待处理' | '进行中' | '已完成';
      start?: string;
      end?: string;
    } = {},
  ) =>
    get<any[]>(
      `/school/risk/tasks?${new URLSearchParams(Object.fromEntries(Object.entries({ ...params }).filter(([, v]) => v !== undefined && v !== '' && v !== null)) as any).toString()}`,
    ),
  riskTaskCreate: async (body: {
    assignee: string;
    location: string;
    object: string;
    riskId?: string;
    dueAt?: string;
    note?: string;
  }) => {
    const res = await fetch(`${BASE}/school/risk/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  riskTaskSetStatus: async (id: string, status: '待处理' | '进行中' | '已完成') => {
    const res = await fetch(`${BASE}/school/risk/tasks/status?id=${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  riskTaskSubmit: async (id: string, result: string, images?: string[]) => {
    const res = await fetch(`${BASE}/school/risk/tasks/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, result, images }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  riskTasksExportCsv: async (params: any = {}) => {
    const url = `/school/risk/tasks/export.csv?${new URLSearchParams(Object.fromEntries(Object.entries({ ...params }).filter(([, v]) => v !== undefined && v !== '' && v !== null)) as any).toString()}`;
    const r = await fetch(`${BASE}${url}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const { csv } = await r.json();
    return csv as string;
  },
  riskCatalogExportCsv: async () => {
    const r = await fetch(`${BASE}/school/risk/catalog/export.csv`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const { csv } = await r.json();
    return csv as string;
  },
  riskTaskDetail: (id: string) =>
    get<any>(`/school/risk/tasks/detail?id=${encodeURIComponent(id)}`),
  riskReportDetail: (id: string) =>
    get<any>(`/school/risk/reports/detail?id=${encodeURIComponent(id)}`),
  // System config
  sysAnnouncements: (params: { page?: number; pageSize?: number } = {}) =>
    get<any>(
      `/school/system/announcements?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined)) as any).toString()}`,
    ),
  sysAnnouncementDetail: (id: string) =>
    get<any>(`/school/system/announcements/detail?id=${encodeURIComponent(id)}`),
  sysAnnouncementCreate: async (body: { title: string; content: string }) => {
    const res = await fetch(`${BASE}/school/system/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  sysCanteenGet: async () => {
    const r = await fetch(`${BASE}/school/system/canteen`, { headers: { ...authHeaders() } });
    if (!r.ok) { handleUnauthorized(r.status); throw new Error(`HTTP ${r.status}`); }
    return r.json();
  },
  sysCanteenSave: async (body: any) => {
    const r = await fetch(`${BASE}/school/system/canteen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    });
    if (!r.ok) { handleUnauthorized(r.status); throw new Error(`HTTP ${r.status}`); }
    return r.json();
  },
  sysLinkageList: (status?: 'PENDING' | 'APPROVED' | 'REJECTED') =>
    get<any[]>(`/school/system/linkage${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  sysLinkageApply: async (body: { org: string; contact?: string; remark?: string }) => {
    const r = await fetch(`${BASE}/school/system/linkage/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  sysLinkageReview: async (id: string, status: 'APPROVED' | 'REJECTED', comment?: string) => {
    const r = await fetch(`${BASE}/school/system/linkage/review?id=${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ status, comment }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  sysApps: () => get<any[]>(`/school/system/apps`),
  sysUsers: (schoolId?: string | number) => get<any[]>(`/school/system/users${schoolId!==undefined&&schoolId!==null&&String(schoolId) !== '' ? `?schoolId=${encodeURIComponent(String(schoolId))}` : ''}`),
  sysUserCreate: async (body: { name: string; phone?: string; roles?: string[]; remark?: string; enabled?: boolean; password?: string }) => {
    return post(`/school/system/users`, body);
  },
  sysUserUpdate: async (id: number | string, patch: { name?: string; phone?: string; remark?: string; enabled?: boolean }) => {
    const r = await fetch(`${BASE}/school/system/users`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ id, patch }),
    });
    if (!r.ok) { handleUnauthorized(r.status); throw new Error(`HTTP ${r.status}`); }
    return r.json();
  },
  sysUserDelete: async (id: number | string) => {
    return post(`/school/system/users/delete`, { id });
  },
  sysRoles: (params: { schoolId?: number; q?: string } = {}) =>
    get<any[]>(`/school/system/roles?${new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)) as any,
    ).toString()}`),
  sysRoleCreate: async (name: string, remark?: string, schoolId?: number) => {
    const r = await fetch(`${BASE}/school/system/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ name, remark, schoolId }),
    });
    if (!r.ok) {
      console.log('Error response:', r);
      try {
        const data = await r.json();
        console.log('Error data:', data,data?.message);
        throw new Error(data?.message || `HTTP ${r.status}`);
      } catch {
        throw new Error(`HTTP ${r.status}`);
      }
    }
    return r.json();
  },
  sysRoleUpdate: async (id: number, patch: { name?: string; remark?: string }) => {
    const r = await fetch(`${BASE}/school/system/roles`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ id, patch }),
    });
    if (!r.ok) {
      try {
        const data = await r.json();
        throw new Error(data?.message || `HTTP ${r.status}`);
      } catch {
        throw new Error(`HTTP ${r.status}`);
      }
    }
    return r.json();
  },
  sysRoleDelete: async (id: number) => {
    const r = await fetch(`${BASE}/school/system/roles/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ id }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  sysUserSetRoles: async (id: string, roles: string[]) => {
    const r = await fetch(`${BASE}/school/system/users/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ id, roles }),
    });
    if (!r.ok) { handleUnauthorized(r.status); throw new Error(`HTTP ${r.status}`); }
    return r.json();
  },
  sysPermissions: () => get<any[]>(`/school/system/permissions`),
  sysRolePermissions: (name: string) => get<{ name: string; permissions: string[] }>(`/school/system/roles/permissions?name=${encodeURIComponent(name)}`),
  sysRoleSetPermissions: async (name: string, permissions: string[]) => {
    const r = await fetch(`${BASE}/school/system/roles/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ name, permissions }),
    });
    if (!r.ok) { handleUnauthorized(r.status); throw new Error(`HTTP ${r.status}`); }
    return r.json();
  },
  sysAnnouncementAttach: async (id: string, att: { name: string; url: string }) => {
    const r = await fetch(`${BASE}/school/system/announcements/attach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ id, ...att }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  // Staff (personnel) removed

};

// TrustIVS helper client for calling gateway TrustIVS endpoints
// Adds required headers (time, uuid, token) and supports simple get/post.
let TRUSTIVS_TOKEN = (typeof localStorage !== 'undefined' && localStorage.getItem('TRUSTIVS_TOKEN')) || '';
function trustivsHeaders() {
  const h: Record<string, string> = {};
  h['time'] = String(Date.now());
  h['uuid'] = Math.random().toString(36).slice(2, 12);
  if (TRUSTIVS_TOKEN) h['token'] = TRUSTIVS_TOKEN;
  return h;
}
async function trustivsGet<T>(path: string, params?: Record<string, any>): Promise<T> {
  const qs = params
    ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) as any).toString()
    : '';
  const res = await fetch(`${BASE}${path}${qs}`, { headers: trustivsHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}
async function trustivsPost<T>(path: string, body?: any): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...trustivsHeaders() },
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const trustivsApi = {
  setToken(t?: string) {
    TRUSTIVS_TOKEN = t || '';
    try { localStorage.setItem('TRUSTIVS_TOKEN', TRUSTIVS_TOKEN); } catch {}
  },
  get: trustivsGet,
  post: trustivsPost,
};
