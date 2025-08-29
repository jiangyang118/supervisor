import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { Device, Employee, MorningCheck } from '../types';

type Store = {
  devices: Map<string, Device>;
  employees: Map<string, Employee>;
  checks: Map<string, MorningCheck>;
  idempotency: Set<string>;
};

const store: Store = {
  devices: new Map(),
  employees: new Map(),
  checks: new Map(),
  idempotency: new Set(),
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

export function persistUpload(recordId: string, field: string, buffer: Buffer, ext = 'jpg'): string {
  const dir = path.join(process.cwd(), 'data', 'uploads', recordId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${field}.${ext}`);
  writeFileSync(filePath, buffer);
  return filePath;
}

