#!/usr/bin/env node
const { spawn, spawnSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

const host = process.env.HOST || process.argv[2] || 'localhost';
const ECODE = process.env.EQUIPMENT_CODE || 'DEMO-EC-0001';

const roots = {
  gateway: path.join(__dirname, '..', 'services', 'gateway-service'),
  mock: path.join(__dirname, '..', 'services', 'device-mock'),
};

function installIfNeeded(dir) {
  if (!existsSync(path.join(dir, 'node_modules'))) {
    console.log(`[setup] installing deps in ${dir}`);
    const r = spawnSync('npm', ['i'], { cwd: dir, stdio: 'inherit' });
    if (r.status !== 0) process.exit(r.status || 1);
  }
}

function start(name, dir, script, extraEnv = {}) {
  console.log(`[start] ${name} -> ${dir} (${script})`);
  const child = spawn('npm', ['run', script], {
    cwd: dir,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...extraEnv,
    },
  });
  child.on('exit', (code) => {
    console.log(`[exit] ${name} code=${code}`);
  });
  return child;
}

async function main() {
  const GATEWAY = `http://${host}:3300`;
  const MOCK = `http://${host}:4003`;

  installIfNeeded(roots.gateway);
  installIfNeeded(roots.mock);

  const p1 = start('device-mock', roots.mock, 'dev', { PORT_DEVICE_MOCK: '4003' });
  const p2 = start('gateway-service', roots.gateway, 'dev', { PORT: '3300', MEGO_BASE_URLS: MOCK, EQUIPMENT_CODE: ECODE });

  console.log('\n=== MEGO Demo Started ===');
  console.log(`gateway-service:   ${GATEWAY}`);
  console.log(`device-mock:       ${MOCK}`);
  console.log('\nNext steps:');
  console.log(`1) In browser console set: window.SCHOOL_INTEGRATION_BASE='${GATEWAY}'; window.MEGO_CANDIDATES='${MOCK}'`);
  console.log("2) In web-school → 设备 → 新增设备（米果晨检仪）：填 equipmentCode=", ECODE, '，候选域名填上述 device-mock URL，点“自动搜索”');
  console.log('3) 点击“刷新员工缓存”，查看员工列表');
  console.log('4) 运行: npm run demo:mego:emit', '(or trigger manual curl) to emit 10 checks');
  console.log('5) 在“晨检管理”页点击“同步设备记录”查看');

  const killAll = () => {
    p1 && p1.kill('SIGINT');
    p2 && p2.kill('SIGINT');
  };
  process.on('SIGINT', () => {
    killAll();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    killAll();
    process.exit(0);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
