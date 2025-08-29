import fetch from 'node-fetch';

async function tolerantJson(text: string): Promise<any> {
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

