const getBase = (): string => {
  const v = (import.meta as any).env?.VITE_SCHOOL_API_BASE as string | undefined;
  const w = (window as any)?.SCHOOL_INTEGRATION_BASE as string | undefined;
  const ls = typeof localStorage !== 'undefined' ? localStorage.getItem('SCHOOL_INTEGRATION_BASE') || undefined : undefined;
  return v || ls || w || 'http://localhost:4001';
};

export async function refreshEmployees(equipmentCode?: string): Promise<{ success: boolean; count?: number; message?: string; baseUrl?: string }> {
  const base = getBase().replace(/\/$/, '');
  const res = await fetch(`${base}/api/employees/refresh`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ equipmentCode }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function listEmployees(): Promise<Array<{ userId: string; name: string; healthStartTime?: string; healthEndTime?: string }>> {
  const base = getBase().replace(/\/$/, '');
  const res = await fetch(`${base}/api/employees`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  return Array.isArray(j?.data) ? j.data : [];
}

