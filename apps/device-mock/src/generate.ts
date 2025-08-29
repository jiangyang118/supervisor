import FormData from 'form-data';
import fetch from 'node-fetch';

function randBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

export function genRecord(equipmentCode: string, userId: string) {
  const checkTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const normal = '35.9-37.3';
  const foreheadTemp = randBetween(35.6, 38.2);
  const abnormalTemp = foreheadTemp < 35.9 || foreheadTemp > 37.3 ? 1 : 0;
  const handCheckResult = Math.random() < 0.15 ? '异物' : '';
  const healthAskResult = Math.random() < 0.15 ? '咳嗽' : '';
  const health = abnormalTemp === 0 && !handCheckResult && !healthAskResult ? 0 : 1;
  return {
    equipmentCode,
    uuid: `uuid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    checkTime,
    foreheadTemp,
    normalTemperatureRange: normal,
    abnormalTemp,
    handCheckResult,
    healthAskResult,
    health,
  };
}

export async function postToSchool(schoolBase: string, rec: any) {
  // Use JSON for simplicity; school API accepts JSON/query as well
  const url = `${schoolBase.replace(/\/$/, '')}/api/integrations/morning-checks/mego`;
  const form = new FormData();
  for (const [k, v] of Object.entries(rec)) form.append(k, String(v));
  // Attach placeholder text as jpg bytes
  const faceBuf = Buffer.from('face');
  const palmBuf = Buffer.from('palm');
  const backBuf = Buffer.from('backOfHand');
  form.append('faceFile', faceBuf, { filename: 'face.jpg' });
  form.append('palmFile', palmBuf, { filename: 'palm.jpg' });
  form.append('backOfHandFile', backBuf, { filename: 'back.jpg' });

  const res = await fetch(url, { method: 'POST', body: form as any, headers: form.getHeaders() as any });
  const txt = await res.text();
  try {
    return JSON.parse(txt);
  } catch {
    return { text: txt };
  }
}

export async function pushToRegulator(regBase: string, schoolId: string, schoolName: string, payload: any) {
  const url = `${regBase.replace(/\/$/, '')}/api/regulator/morning-checks/push`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ schoolId, schoolName, ...payload }),
  });
  return res.json();
}

