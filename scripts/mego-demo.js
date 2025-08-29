#!/usr/bin/env node
const { spawn, spawnSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

const host = process.env.HOST || process.argv[2] || 'localhost';
const ECODE = process.env.EQUIPMENT_CODE || 'DEMO-EC-0001';

const roots = {
  school: path.join(__dirname, '..', 'apps', 'school-api'),
  regulator: path.join(__dirname, '..', 'apps', 'regulator-api'),
  mock: path.join(__dirname, '..', 'apps', 'device-mock'),
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
  const SCHOOL = `http://${host}:4001`;
  const REG = `http://${host}:4002`;
  const MOCK = `http://${host}:4003`;

  installIfNeeded(roots.school);
  installIfNeeded(roots.regulator);
  installIfNeeded(roots.mock);

  const p1 = start('device-mock', roots.mock, 'dev', { PORT_DEVICE_MOCK: '4003' });
  const p2 = start('regulator-api', roots.regulator, 'dev', { PORT_REGULATOR: '4002' });
  const p3 = start('school-api', roots.school, 'dev', {
    PORT_SCHOOL: '4001',
    MEGO_BASE_URLS: MOCK,
    EQUIPMENT_CODE: ECODE,
  });

  console.log('\n=== MEGO Demo Started ===');
  console.log(`school-api:    ${SCHOOL}`);
  console.log(`regulator-api: ${REG}`);
  console.log(`device-mock:   ${MOCK}`);
  console.log('\nNext steps:');
  console.log(`1) In browser console set: window.SCHOOL_INTEGRATION_BASE='${SCHOOL}'; window.MEGO_CANDIDATES='${MOCK}'`);
  console.log("2) In web-school → 设备 → 新增设备（米果晨检仪）：填 equipmentCode=", ECODE, '，候选域名填上述 device-mock URL，点“自动搜索”');
  console.log('3) 点击“刷新员工缓存”，查看员工列表');
  console.log('4) 运行: npm run demo:mego:emit', '(or trigger manual curl) to emit 10 checks');
  console.log('5) 在“晨检管理”页点击“同步设备记录”查看');

  const killAll = () => {
    p1 && p1.kill('SIGINT');
    p2 && p2.kill('SIGINT');
    p3 && p3.kill('SIGINT');
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

