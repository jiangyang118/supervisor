// Simple front-end mock service to simulate API calls
export type Inbound = { date: string; item: string; qty: number; supplier: string };
export type Outbound = { date: string; item: string; qty: number; purpose: string };
export type Hygiene = { date: string; item: string; result: '合格' | '不合格' };
export type Device = { id: string; type: string; status: '在线' | '离线' };
export type ParentFeedback = { parent: string; rating: number; comment: string };

function delay(ms = 300) {
  return new Promise((r) => setTimeout(r, ms));
}
function today() {
  return new Date().toLocaleDateString();
}
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function fetchInbound(): Promise<Inbound[]> {
  await delay();
  return [
    { date: today(), item: '大米', qty: rand(30, 60), supplier: '供货商A' },
    { date: today(), item: '鸡蛋', qty: rand(80, 120), supplier: '供货商B' },
  ];
}

export async function fetchOutbound(): Promise<Outbound[]> {
  await delay();
  return [
    { date: today(), item: '大米', qty: rand(5, 15), purpose: '午餐' },
    { date: today(), item: '蔬菜', qty: rand(10, 25), purpose: '晚餐' },
  ];
}

export async function fetchHygiene(): Promise<Hygiene[]> {
  await delay();
  const ok = (): '合格' | '不合格' => (Math.random() < 0.9 ? '合格' : '不合格');
  return [
    { date: today(), item: '操作台', result: ok() },
    { date: today(), item: '餐具消毒', result: ok() },
  ];
}

export async function fetchDevices(): Promise<Device[]> {
  await delay();
  const s = (): '在线' | '离线' => (Math.random() < 0.85 ? '在线' : '离线');
  return [
    { id: 'GW-001', type: '网关', status: s() },
    { id: 'CAM-001', type: '摄像头', status: s() },
    { id: 'SCALE-001', type: '留样秤', status: s() },
  ];
}

export async function fetchParentFeedback(): Promise<ParentFeedback[]> {
  await delay();
  const names = ['家长A', '家长B', '家长C', '家长D', '家长E'];
  return Array.from({ length: 5 }).map((_, i) => ({
    parent: names[i],
    rating: rand(3, 5),
    comment: ['孩子说菜不错', '干净卫生', '希望提升口味'][rand(0, 2)],
  }));
}
