import 'dotenv/config';
import fetch from 'node-fetch';
import { genRecord, postToSchool, pushToRegulator } from './generate';

const SCHOOL = process.env.SCHOOL_API_BASE || 'http://localhost:4001';
const REG = process.env.REGULATOR_API_BASE || 'http://localhost:4002';
const BASE = process.env.DEVICE_MOCK_BASE || 'http://localhost:4003';
const EQUIPMENT_CODE = process.env.EQUIPMENT_CODE || 'DEMO-EC-0001';

async function heartbeatOnce() {
  const url = `${BASE.replace(/\/$/, '')}/device/morningChecker/heartBeatInfo`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `equipmentCode=${encodeURIComponent(EQUIPMENT_CODE)}`,
  });
  const t = await res.text();
  // eslint-disable-next-line no-console
  console.log('heartbeat:', t);
}

async function refreshEmployees() {
  const url = `${SCHOOL.replace(/\/$/, '')}/api/employees/refresh`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ equipmentCode: EQUIPMENT_CODE }),
  });
  const j = await res.json();
  // eslint-disable-next-line no-console
  console.log('employees refresh:', j);
}

async function run() {
  // 1) heartbeat
  await heartbeatOnce();
  // 2) refresh employees cache in school-api (from mock upstream)
  await refreshEmployees();
  // 3) emit 10 checks
  const users = ['E001', 'E002'];
  for (let i = 0; i < 10; i++) {
    const userId = users[i % users.length];
    const rec = genRecord(EQUIPMENT_CODE, userId);
    const schoolResp = await postToSchool(SCHOOL, rec);
    // eslint-disable-next-line no-console
    console.log(`#${i + 1} to school:`, schoolResp);
    const regResp = await pushToRegulator(REG, 'S-001', '示例学校', rec);
    // eslint-disable-next-line no-console
    console.log(`#${i + 1} to regulator:`, regResp);
  }
}

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

