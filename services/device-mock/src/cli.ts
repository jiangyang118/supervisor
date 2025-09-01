import 'dotenv/config';
import fetch from 'node-fetch';
import crypto from 'crypto';
import { genRecord, postToSchool, pushToRegulator } from './generate';

// Default to gateway-service for all targets (integrated endpoints)
const SCHOOL = process.env.SCHOOL_API_BASE || 'http://localhost:3300';
const REG = process.env.REGULATOR_API_BASE || 'http://localhost:3300';
const BASE = process.env.DEVICE_MOCK_BASE || 'http://localhost:3300';
const EQUIPMENT_CODE = process.env.EQUIPMENT_CODE || 'DEMO-EC-0001';

function buildSign(params: Record<string, any>, key?: string): string | undefined {
  const k = key || process.env.DEVICE_SIGN_KEY || '';
  if (!k) return undefined;
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => (a > b ? 1 : a < b ? -1 : 0))
    .map(([kk, vv]) => `${kk}=${vv}`)
    .join('&');
  const raw = entries + k;
  return crypto.createHash('md5').update(raw).digest('hex').toLowerCase();
}

async function heartbeatOnce() {
  const url = `${BASE.replace(/\/$/, '')}/device/morningChecker/heartBeatInfo`;
  const params = { equipmentCode: EQUIPMENT_CODE } as Record<string, any>;
  const sign = buildSign(params);
  const body = new URLSearchParams({ ...params, ...(sign ? { sign } : {}) }).toString();
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
  const t = await res.text(); console.log('heartbeat:', t);
}

async function refreshEmployees() {
  const url = `${SCHOOL.replace(/\/$/, '')}/api/employees/refresh`;
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ equipmentCode: EQUIPMENT_CODE }) });
  const j = await res.json(); console.log('employees refresh:', j);
}

async function run() {
  await heartbeatOnce();
  await refreshEmployees();
  const users = ['E001', 'E002'];
  for (let i = 0; i < 10; i++) {
    const userId = users[i % users.length];
    const rec = genRecord(EQUIPMENT_CODE, userId);
    const schoolResp = await postToSchool(SCHOOL, rec); console.log(`#${i + 1} to school:`, schoolResp);
    const regResp = await pushToRegulator(REG, 'S-001', '示例学校', rec); console.log(`#${i + 1} to regulator:`, regResp);
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
