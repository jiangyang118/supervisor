import express from 'express';
import multer from 'multer';
import { z } from 'zod';
import { abnormalTempFlag, computeHealth, parseRange } from './utils/healthLogic';
import { discoverCandidates } from './services/deviceDiscovery';
import { fetchEmployees } from './services/employeeCache';
import {
  getDevices,
  getEmployees,
  listChecks,
  persistUpload,
  saveMorningCheck,
  setEmployees,
  upsertDevice,
} from './services/storage';
import type { MorningCheck } from './types';

const upload = multer();
export const router = express.Router();

router.get('/health', (_req, res) => res.json({ ok: true }));

router.get('/api/employees', (_req, res) => { res.json({ data: getEmployees() }); });

router.post('/api/employees/refresh', express.json(), async (req, res) => {
  const envUrls = String(process.env.MEGO_BASE_URLS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const equipmentCode = String(process.env.EQUIPMENT_CODE || req.body?.equipmentCode || '');
  const fromDevice = getDevices().find((d) => d.equipmentCode === equipmentCode && d.baseUrl);
  const tryUrls = [fromDevice?.baseUrl, ...envUrls].filter(Boolean) as string[];
  if (!tryUrls.length || !equipmentCode)
    return res.status(400).json({ error: 'No candidate BASE_URL found or equipmentCode missing' });
  for (const baseUrl of tryUrls) {
    try {
      const list = await fetchEmployees(baseUrl, equipmentCode);
      setEmployees(list);
      return res.json({ success: true, count: list.length, baseUrl });
    } catch (e) {}
  }
  return res.status(502).json({ success: false, message: 'All upstream fetch attempts failed' });
});

router.get('/api/devices', (_req, res) => { res.json({ data: getDevices() }); });

router.post('/api/devices/discover', express.json(), async (req, res) => {
  const body = z.object({ equipmentCode: z.string().min(1), candidates: z.array(z.string().url()).min(1) }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });
  const { equipmentCode, candidates } = body.data;
  const results = await discoverCandidates(candidates, equipmentCode);
  const ok = results.filter((r) => r.ok);
  if (ok.length) {
    const chosen = ok[0].baseUrl;
    upsertDevice({ equipmentCode, baseUrl: chosen, onlineStatus: 'online', lastHeartbeatAt: new Date().toISOString() });
  }
  res.json({ results, autoSelected: ok[0]?.baseUrl || null });
});

const checkFields = {
  equipmentCode: 'equipmentCode',
  machineCode: 'machineCode',
  uuid: 'uuid',
  userId: 'userId',
  foreheadTemp: 'foreheadTemp',
  checkTime: 'checkTime',
  normalTemperatureRange: 'normalTemperatureRange',
  abnormalTemp: 'abnormalTemp',
  handCheckResult: 'handCheckResult',
  healthAskResult: 'healthAskResult',
  health: 'health',
} as const;

function pickField(body: any, name: keyof typeof checkFields) { return body[checkFields[name]]; }

router.post('/api/integrations/morning-checks/mego', upload.any(), async (req, res) => {
  try {
    const body: any = Object.keys(req.body || {}).length ? req.body : req.query;
    const equipmentCode: string = pickField(body, 'equipmentCode') || pickField(body, 'machineCode');
    if (!equipmentCode) return res.status(400).json({ message: 'equipmentCode missing' });
    const uuid: string | undefined = pickField(body, 'uuid');
    const userId: string = String(pickField(body, 'userId'));
    const checkTime: string = String(pickField(body, 'checkTime'));
    const foreheadTemp = Number(pickField(body, 'foreheadTemp'));
    const rangeStr: string = String(pickField(body, 'normalTemperatureRange') || '35.9-37.3');
    const [min, max] = parseRange(rangeStr);
    const abnormal: 0 | 1 = (Number(pickField(body, 'abnormalTemp')) as any) ?? abnormalTempFlag(foreheadTemp, [min, max]);
    const handCsv = String(pickField(body, 'handCheckResult') || '');
    const askCsv = String(pickField(body, 'healthAskResult') || '');
    const health: 0 | 1 = (Number(pickField(body, 'health')) as any) ?? computeHealth(abnormal, handCsv, askCsv);

    const id = `mc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const mc: MorningCheck = {
      id,
      equipmentCode,
      userId: String(userId),
      checkTime,
      foreheadTemp,
      normalTemperatureMin: min,
      normalTemperatureMax: max,
      abnormalTemp: abnormal,
      handCheckResult: handCsv ? handCsv.split(',').map((s) => s.trim()).filter(Boolean) : [],
      healthAskResult: askCsv ? askCsv.split(',').map((s) => s.trim()).filter(Boolean) : [],
      health,
      images: {},
      raw: body,
    };

    if (Array.isArray((req as any).files)) {
      for (const f of (req as any).files as Express.Multer.File[]) {
        if (f.fieldname === 'faceFile') mc.images!.face = persistUpload(id, 'face', f.buffer, 'jpg');
        if (f.fieldname === 'palmFile') mc.images!.palm = persistUpload(id, 'palm', f.buffer, 'jpg');
        if (f.fieldname === 'backOfHandFile') mc.images!.backOfHand = persistUpload(id, 'backOfHand', f.buffer, 'jpg');
      }
    }

    const { id: recordId } = saveMorningCheck(mc, uuid);
    return res.json({ success: true, id: recordId });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e?.message || 'Invalid payload' });
  }
});

router.get('/api/morning-checks', (_req, res) => { res.json({ data: listChecks() }); });

