export type Device = {
  id: string;
  vendor: 'MEGO';
  equipmentCode: string;
  onlineStatus: 'online' | 'offline' | 'unknown';
  lastHeartbeatAt?: string;
  baseUrl?: string;
};

export type Employee = {
  userId: string;
  name: string;
  post?: string;
  portraitUrl?: string;
  healthNumber?: string;
  healthStartTime?: string;
  healthEndTime?: string;
  healthCertUrl?: string;
  updateTime?: string;
};

export type MorningCheck = {
  id: string;
  equipmentCode: string;
  userId: string;
  checkTime: string; // YYYY-MM-DD HH:mm:ss
  foreheadTemp: number;
  normalTemperatureMin: number;
  normalTemperatureMax: number;
  abnormalTemp: 0 | 1;
  handCheckResult: string[];
  healthAskResult: string[];
  health: 0 | 1;
  images?: { face?: string; palm?: string; backOfHand?: string };
  raw?: any;
};

type Store = {
  devices: Map<string, Device>;
  employees: Map<string, Employee>;
  checks: Map<string, MorningCheck>;
  idempotency: Set<string>;
  regulator: { list: any[] };
};

const store: Store = {
  devices: new Map(),
  employees: new Map(),
  checks: new Map(),
  idempotency: new Set(),
  regulator: { list: [] },
};

export function upsertDevice(partial: Partial<Device> & { equipmentCode: string }): Device {
  const prev = store.devices.get(partial.equipmentCode);
  const next: Device = {
    id: prev?.id || `dev_${partial.equipmentCode}`,
    vendor: 'MEGO',
    onlineStatus: prev?.onlineStatus || 'unknown',
    ...prev,
    ...partial,
  } as Device;
  store.devices.set(next.equipmentCode, next);
  return next;
}

export function getDevices(): Device[] {
  return Array.from(store.devices.values());
}

export function setEmployees(list: Employee[]) {
  store.employees.clear();
  for (const e of list) store.employees.set(e.userId, e);
}

export function getEmployees(): Employee[] {
  return Array.from(store.employees.values());
}

export function idempotencyKey(
  equipmentCode: string,
  userId: string,
  checkTime: string,
  uuid?: string
): string {
  return [equipmentCode, userId, checkTime, uuid || ''].join('#');
}

export function saveMorningCheck(mc: MorningCheck, uuid?: string): { saved: boolean; id: string } {
  const key = idempotencyKey(mc.equipmentCode, mc.userId, mc.checkTime, uuid);
  if (store.idempotency.has(key)) return { saved: false, id: mc.id };
  store.idempotency.add(key);
  store.checks.set(mc.id, mc);
  return { saved: true, id: mc.id };
}

export function listChecks(): MorningCheck[] {
  return Array.from(store.checks.values());
}

export function pushRegulator(rec: any) {
  store.regulator.list.push(rec);
}
export function listRegulator() {
  return store.regulator.list;
}

