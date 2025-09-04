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
