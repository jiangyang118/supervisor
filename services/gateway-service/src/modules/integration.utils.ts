export function parseRange(s: string): [number, number] {
  const m = /([0-9.]+)\s*[-~~]\s*([0-9.]+)/.exec(s) || /([0-9.]+)\s*-\s*([0-9.]+)/.exec(s);
  if (m) return [Number(m[1]), Number(m[2])];
  return [35.9, 37.3];
}

export function abnormalTempFlag(temp: number, range: [number, number]): 0 | 1 {
  const [min, max] = range;
  return temp < min || temp > max ? 1 : 0;
}

export function computeHealth(abnormal: 0 | 1, handCsv: string, askCsv: string): 0 | 1 {
  if (abnormal === 1) return 1 as const;
  if (String(handCsv || '').trim()) return 1 as const;
  if (String(askCsv || '').trim()) return 1 as const;
  return 0 as const;
}

import fetch from 'node-fetch';

export async function tolerantJson(text: string): Promise<any> {
  try {
    return JSON.parse(text);
  } catch (_) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try { return JSON.parse(text.slice(start, end + 1)); } catch {}
    }
    throw new Error('Invalid JSON');
  }
}

export async function probeHeartbeat(baseUrl: string, equipmentCode: string): Promise<boolean> {
  const url = `${baseUrl.replace(/\/$/, '')}/device/morningChecker/heartBeatInfo`;
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `equipmentCode=${encodeURIComponent(equipmentCode)}` });
  const text = await res.text();
  const data = await tolerantJson(text);
  return data && (data.statusCode === 200 || data.success === true);
}

export async function discoverCandidates(candidates: string[], equipmentCode: string) {
  const results: { baseUrl: string; ok: boolean }[] = [];
  for (const baseUrl of candidates) {
    try { results.push({ baseUrl, ok: await probeHeartbeat(baseUrl, equipmentCode) }); }
    catch { results.push({ baseUrl, ok: false }); }
  }
  return results;
}

export async function fetchEmployees(baseUrl: string, equipmentCode: string): Promise<any[]> {
  const url = `${baseUrl.replace(/\/$/, '')}/device/morningChecker/employeeList?equipmentCode=${encodeURIComponent(equipmentCode)}`;
  const res = await fetch(url);
  const text = await res.text();
  const data = await tolerantJson(text);
  const arr: any[] = Array.isArray(data?.data) ? data.data : [];
  return arr.map((u) => ({
    userId: String(u.userId),
    name: u.name,
    post: u.post,
    portraitUrl: u.portraitPhoto,
    healthNumber: u.healthNumber,
    healthStartTime: u.healthStartTime,
    healthEndTime: u.healthEndTime,
    healthCertUrl: u.healthUrl,
    updateTime: u.updateTime,
  }));
}
