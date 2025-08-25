import { z } from 'zod';

// Core IDs
export const Id = z.string().min(1);

// Tenant & Organization
export const School = z.object({
  id: Id,
  name: z.string(),
  district: z.string().optional(),
  address: z.string().optional(),
});
export type School = z.infer<typeof School>;

export const Canteen = z.object({
  id: Id,
  schoolId: Id,
  name: z.string(),
});
export type Canteen = z.infer<typeof Canteen>;

// Users & Auth
export const RoleEnum = z.enum(['ADMIN', 'REGULATOR', 'SCHOOL', 'SUPPLIER', 'DEVICE_OPS', 'PARENT']);
export const User = z.object({
  id: Id,
  tenantId: Id, // schoolId or orgId
  username: z.string(),
  displayName: z.string().optional(),
  roles: z.array(RoleEnum),
});
export type User = z.infer<typeof User>;

// Inventory (minimal)
export const InventoryItem = z.object({
  id: Id,
  name: z.string(),
  unit: z.string().default('kg'),
});
export type InventoryItem = z.infer<typeof InventoryItem>;

export const Inbound = z.object({
  id: Id,
  canteenId: Id,
  itemId: Id,
  quantity: z.number(),
  supplier: z.string().optional(),
  at: z.string(),
});
export type Inbound = z.infer<typeof Inbound>;

export const Outbound = z.object({
  id: Id,
  canteenId: Id,
  itemId: Id,
  quantity: z.number(),
  purpose: z.string().optional(),
  at: z.string(),
});
export type Outbound = z.infer<typeof Outbound>;

// AI Events & Alerts
export const AIEventType = z.enum([
  'NO_MASK',
  'NO_HAT',
  'NO_UNIFORM',
  'NO_GLOVES',
  'PHONE_CALL',
  'SMOKING',
  'FIRE',
  'RODENT',
]);
export const AIEvent = z.object({
  id: Id,
  canteenId: Id,
  cameraId: Id.optional(),
  type: AIEventType,
  snapshotUrl: z.string().url().optional(),
  detectedAt: z.string(),
  handledBy: Id.optional(),
  measure: z.string().optional(),
});
export type AIEvent = z.infer<typeof AIEvent>;

export const AlertLevel = z.enum(['INFO', 'WARN', 'CRITICAL']);
export const AlertStatus = z.enum(['OPEN', 'ACK', 'CLOSED']);
export const Alert = z.object({
  id: Id,
  type: z.string(),
  level: AlertLevel,
  status: AlertStatus,
  relatedId: Id.optional(),
  createdAt: z.string(),
});
export type Alert = z.infer<typeof Alert>;

export const Models = {
  School,
  Canteen,
  User,
  InventoryItem,
  Inbound,
  Outbound,
  AIEvent,
  Alert,
};

