type Inbound = { schoolId: string; date: string; item: string; qty: number; supplier: string };
type Outbound = { schoolId: string; date: string; item: string; qty: number; purpose: string };
type Hygiene = { schoolId: string; date: string; item: string; result: '合格' | '不合格' };
type Device = { schoolId: string; id: string; type: string; status: '在线' | '离线' };
// 业务台账（示例结构，可替换为真实后端）
type MorningCheck = { schoolId: string; date: string; person: string; result: '合格' | '不合格' };
type Sampling = { schoolId: string; date: string; dish: string; weight: number };
type Disinfection = { schoolId: string; date: string; object: string; method: string };
type Dine = { schoolId: string; date: string; person: string; meal: '早餐' | '午餐' | '晚餐' };
type Waste = { schoolId: string; date: string; kind: string; qty: number; unit: string };
type AIEvent = {
  id: string;
  schoolId: string;
  cameraId?: string;
  type: string;
  snapshotUrl?: string;
  detectedAt: string;
  status: 'OPEN' | 'ACK' | 'CLOSED';
  measure?: string;
};

function today() {
  return new Date().toLocaleDateString();
}
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

class Store {
  inbound: Inbound[] = [];
  outbound: Outbound[] = [];
  hygiene: Hygiene[] = [];
  devices: Device[] = [];
  aiEvents: AIEvent[] = [];
  morning: MorningCheck[] = [];
  sampling: Sampling[] = [];
  disinfection: Disinfection[] = [];
  dine: Dine[] = [];
  waste: Waste[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    this.inbound = [
      { schoolId: 'sch-001', date: today(), item: '大米', qty: rand(30, 60), supplier: '供货商A' },
      { schoolId: 'sch-001', date: today(), item: '鸡蛋', qty: rand(80, 120), supplier: '供货商B' },
      { schoolId: 'sch-002', date: today(), item: '面粉', qty: rand(20, 40), supplier: '供货商C' },
    ];
    this.outbound = [
      { schoolId: 'sch-001', date: today(), item: '大米', qty: rand(5, 15), purpose: '午餐' },
      { schoolId: 'sch-001', date: today(), item: '蔬菜', qty: rand(10, 25), purpose: '晚餐' },
      { schoolId: 'sch-002', date: today(), item: '面粉', qty: rand(5, 10), purpose: '早点' },
    ];
    const ok: () => '合格' | '不合格' = () => (Math.random() < 0.9 ? '合格' : '不合格');
    this.hygiene = [
      { schoolId: 'sch-001', date: today(), item: '操作台', result: ok() },
      { schoolId: 'sch-001', date: today(), item: '餐具消毒', result: ok() },
      { schoolId: 'sch-002', date: today(), item: '储物柜', result: ok() },
    ];
    const s: () => '在线' | '离线' = () => (Math.random() < 0.85 ? '在线' : '离线');
    this.devices = [
      { schoolId: 'sch-001', id: 'GW-001', type: '网关', status: s() },
      { schoolId: 'sch-001', id: 'CAM-001', type: '摄像头', status: s() },
      { schoolId: 'sch-001', id: 'SCALE-001', type: '留样秤', status: s() },
      { schoolId: 'sch-002', id: 'CAM-101', type: '摄像头', status: s() },
    ];
    this.aiEvents = [
      {
        id: 'E-001',
        schoolId: 'sch-001',
        cameraId: 'ch-01',
        type: '未戴帽',
        detectedAt: new Date().toISOString(),
        status: 'OPEN',
      },
      {
        id: 'E-002',
        schoolId: 'sch-002',
        cameraId: 'ch-02',
        type: '打电话',
        detectedAt: new Date().toISOString(),
        status: 'OPEN',
      },
    ];

    // 示例台账：用于 KPI 统计演示
    this.morning = [
      { schoolId: 'sch-001', date: today(), person: '张三', result: '合格' },
      { schoolId: 'sch-001', date: today(), person: '李四', result: '合格' },
      { schoolId: 'sch-001', date: today(), person: '王五', result: '不合格' },
      { schoolId: 'sch-002', date: today(), person: '赵六', result: '合格' },
    ];
    this.sampling = [
      { schoolId: 'sch-001', date: today(), dish: '土豆丝', weight: rand(80, 120) },
      { schoolId: 'sch-001', date: today(), dish: '青椒肉丝', weight: rand(80, 120) },
      { schoolId: 'sch-002', date: today(), dish: '红烧肉', weight: rand(80, 120) },
    ];
    this.disinfection = [
      { schoolId: 'sch-001', date: today(), object: '餐具', method: '高温消毒' },
      { schoolId: 'sch-001', date: today(), object: '案板', method: '酒精擦拭' },
      { schoolId: 'sch-002', date: today(), object: '蒸箱', method: '高温消毒' },
    ];
    this.dine = [
      { schoolId: 'sch-001', date: today(), person: '教导处', meal: '午餐' },
      { schoolId: 'sch-001', date: today(), person: '年级组', meal: '晚餐' },
      { schoolId: 'sch-002', date: today(), person: '后勤', meal: '午餐' },
    ];
    this.waste = [
      { schoolId: 'sch-001', date: today(), kind: '厨余', qty: rand(10, 30), unit: 'kg' },
      { schoolId: 'sch-001', date: today(), kind: '餐厨油脂', qty: rand(2, 5), unit: 'kg' },
      { schoolId: 'sch-002', date: today(), kind: '厨余', qty: rand(8, 15), unit: 'kg' },
    ];
  }
}

export const DataStore = new Store();

export type {
  Inbound,
  Outbound,
  Hygiene,
  Device,
  AIEvent,
  MorningCheck,
  Sampling,
  Disinfection,
  Dine,
  Waste,
};
