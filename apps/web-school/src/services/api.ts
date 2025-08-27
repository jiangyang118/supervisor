// API基础地址
const BASE = 'http://localhost:3000';
export const API_BASE = BASE;

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
  // Morning check APIs
  morningList: (
    params: {
      staff?: string;
      result?: '正常' | '异常' | '';
      start?: string;
      end?: string;
      page?: number;
      pageSize?: number;
      schoolId?: string;
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
  morningCreate: async (body: { staff: string; temp: number; schoolId?: string }) => {
    const res = await fetch(`${BASE}/school/morning-checks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  morningDelete: async (id: string) => {
    const res = await fetch(`${BASE}/school/morning-checks/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  morningSetMeasure: async (id: string, measure: string) => {
    const res = await fetch(`${BASE}/school/morning-checks/${encodeURIComponent(id)}/measure`, {
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
      schoolId?: string;
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
    schoolId?: string;
  }) => {
    const res = await fetch(`${BASE}/school/sampling/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  samplingSetMeasure: async (id: string, measure: string) => {
    const res = await fetch(`${BASE}/school/sampling/records/${encodeURIComponent(id)}/measure`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ measure }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  samplingCleanupList: (params: { schoolId?: string; page?: number; pageSize?: number } = {}) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/school/sampling/cleanup?${new URLSearchParams(
        Object.fromEntries(
          Object.entries({ ...params })
            .filter(([, v]) => v !== undefined && v !== '' && v !== null)
            .map(([k, v]) => [k, String(v)]),
        ) as any,
      ).toString()}`,
    ),
  samplingCleanupCreate: async (body: {
    sampleId?: string;
    sample: string;
    weight: number;
    imageUrl?: string;
    method: string;
    by: string;
    schoolId?: string;
  }) => {
    const res = await fetch(`${BASE}/school/sampling/cleanup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
      schoolId?: string;
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
    remark?: string;
    schoolId?: string;
  }) => {
    const res = await fetch(`${BASE}/school/pesticide/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  // Hygiene inspections + asset maintenance
  hygieneList: (
    params: {
      result?: '合格' | '不合格';
      start?: string;
      end?: string;
      page?: number;
      pageSize?: number;
      schoolId?: string;
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
    schoolId?: string;
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
      schoolId?: string;
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
    schoolId?: string;
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
  pesticideDeviceCallback: async (body: {
    sample: string;
    device: string;
    result: '合格' | '不合格';
    remark?: string;
    schoolId?: string;
  }) => {
    const res = await fetch(`${BASE}/school/pesticide/device/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  pesticideSetMeasure: async (id: string, measure: string) => {
    const res = await fetch(`${BASE}/school/pesticide/records/${encodeURIComponent(id)}/measure`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ measure }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  // Dine-with APIs
  dineList: (
    params: {
      meal?: string;
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
    meal: string;
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
  dineQrCreate: async (meal: string) => {
    const res = await fetch(`${BASE}/school/dine/qr/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  // Inventory module
  invCategories: () => get<any[]>(`/school/inventory/categories`),
  invCategoryCreate: async (name: string) => {
    const res = await fetch(`${BASE}/school/inventory/categories`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name }) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json();
  },
  invProducts: () => get<any[]>(`/school/inventory/products`),
  invProductCreate: async (body: { name: string; unit: string; categoryId?: string }) => {
    const res = await fetch(`${BASE}/school/inventory/products`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json();
  },
  invImportCloud: () => get<any>(`/school/inventory/products/import/cloud`),
  invImportTemplate: async (items: any[]) => {
    const res = await fetch(`${BASE}/school/inventory/products/import/template`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ items }) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json();
  },
  invSuppliers: (params: { q?: string; enabled?: 'true'|'false'; page?: number; pageSize?: number } = {}) =>
    get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/school/inventory/suppliers?${new URLSearchParams(
        Object.fromEntries(Object.entries({ ...params }).filter(([,v])=>v!==undefined && v!==null).map(([k,v])=>[k,String(v)])) as any,
      ).toString()}`,
    ),
  invSupplierCreate: async (body: any) => {
    const res = await fetch(`${BASE}/school/inventory/suppliers`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json();
  },
  invWarehouses: () => get<any[]>(`/school/inventory/warehouses`),
  invWarehouseCreate: async (body: { name: string; location?: string; capacity?: number }) => {
    const res = await fetch(`${BASE}/school/inventory/warehouses`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json();
  },
  invInboundList: () => get<any[]>(`/school/inventory/inbound`),
  invInboundCreate: async (body: { productId: string; qty: number; supplierId?: string; warehouseId?: string; imageUrl?: string }) => {
    const res = await fetch(`${BASE}/school/inventory/inbound`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json();
  },
  invOutboundList: () => get<any[]>(`/school/inventory/outbound`),
  invOutboundCreate: async (body: { productId: string; qty: number; purpose?: string; by?: string; warehouseId?: string }) => {
    const res = await fetch(`${BASE}/school/inventory/outbound`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json();
  },
  invStock: () => get<any[]>(`/school/inventory/stock`),
  invStocktake: async (body: { productId: string; qty: number }) => {
    const res = await fetch(`${BASE}/school/inventory/stock/stocktake`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json();
  },
  invTickets: () => get<any[]>(`/school/inventory/tickets`),
  invTicketCreate: async (body: { productId: string; type: string; imageUrl?: string }) => {
    const res = await fetch(`${BASE}/school/inventory/tickets`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json();
  },
  invAdditives: () => get<any[]>(`/school/inventory/additives`),
  invAdditiveCreate: async (body: { name: string; amount: number; dish?: string; by?: string }) => {
    const res = await fetch(`${BASE}/school/inventory/additives`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json();
  },
  invSupplierUpdate: async (id: string, body: any) => {
    const res = await fetch(`${BASE}/school/inventory/suppliers?id=${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json();
  },
  invSupplierDelete: async (id: string) => {
    const res = await fetch(`${BASE}/school/inventory/suppliers/delete`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json();
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
      method:'POST',
      headers: isCsv ? { 'Content-Type': 'text/plain;charset=utf-8' } : { 'Content-Type': 'application/json' },
      body: isCsv ? payload as string : JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json();
  },
};
