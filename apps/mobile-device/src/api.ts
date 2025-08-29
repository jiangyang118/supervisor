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

export type MorningCheckPayload = {
  equipmentCode: string;
  userId: string;
  foreheadTemp: number;
  normalTemperatureRange?: string; // default 35.9-37.3
  handCheckResult?: string; // csv
  healthAskResult?: string; // csv
};

function parseRange(range: string): [number, number] {
  const [a, b] = range.split('-').map((s) => Number(s.trim()));
  return [isFinite(a) ? a : 35.9, isFinite(b) ? b : 37.3];
}

function computeFlags(temp: number, range = '35.9-37.3', hand = '', ask = ''): { abnormal: 0 | 1; health: 0 | 1 } {
  const [min, max] = parseRange(range);
  const abnormal: 0 | 1 = temp < min || temp > max ? 1 : 0;
  const health: 0 | 1 = abnormal === 0 && (!hand || hand.trim() === '') && (!ask || ask.trim() === '') ? 0 : 1;
  return { abnormal, health };
}

function fmtTime(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${y}-${m}-${day} ${h}:${mi}:${s}`;
}

export async function postMorningCheck(p: MorningCheckPayload): Promise<{ success: boolean; id?: string; message?: string }> {
  const base = getBase().replace(/\/$/, '');
  const url = `${base}/api/integrations/morning-checks/mego`;
  const range = p.normalTemperatureRange || '35.9-37.3';
  const { abnormal, health } = computeFlags(p.foreheadTemp, range, p.handCheckResult || '', p.healthAskResult || '');
  const fd = new FormData();
  fd.append('equipmentCode', p.equipmentCode);
  fd.append('uuid', `uuid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  fd.append('userId', String(p.userId));
  fd.append('checkTime', fmtTime());
  fd.append('foreheadTemp', String(p.foreheadTemp));
  fd.append('normalTemperatureRange', range);
  fd.append('abnormalTemp', String(abnormal));
  fd.append('handCheckResult', p.handCheckResult || '');
  fd.append('healthAskResult', p.healthAskResult || '');
  fd.append('health', String(health));
  // 占位图片（避免真实二进制依赖）
  const blob = new Blob([new TextEncoder().encode('demo')], { type: 'image/jpeg' });
  fd.append('faceFile', blob, 'face.jpg');
  fd.append('palmFile', blob, 'palm.jpg');
  fd.append('backOfHandFile', blob, 'back.jpg');

  const res = await fetch(url, { method: 'POST', body: fd });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
