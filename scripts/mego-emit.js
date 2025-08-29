#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');
const { existsSync } = require('fs');

const host = process.env.HOST || process.argv[2] || 'localhost';
const ECODE = process.env.EQUIPMENT_CODE || 'DEMO-EC-0001';
const SCHOOL = process.env.SCHOOL_API_BASE || `http://${host}:4001`;
const REG = process.env.REGULATOR_API_BASE || `http://${host}:4002`;
const MOCK = process.env.DEVICE_MOCK_BASE || `http://${host}:4003`;

const servicesMock = path.join(__dirname, '..', 'services', 'device-mock');
const appsMock = path.join(__dirname, '..', 'apps', 'device-mock');
const cwd = existsSync(servicesMock) ? servicesMock : appsMock;
console.log(`[emit] posting 10 demo checks via device-mock CLI`);
const r = spawnSync(
  'npm',
  ['run', 'demo:online'],
  {
    cwd,
    stdio: 'inherit',
    env: {
      ...process.env,
      SCHOOL_API_BASE: SCHOOL,
      REGULATOR_API_BASE: REG,
      DEVICE_MOCK_BASE: MOCK,
      EQUIPMENT_CODE: ECODE,
    },
  }
);
process.exit(r.status || 0);
