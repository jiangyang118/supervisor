'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.DeviceStatusEnum =
  exports.DeviceTypeEnum =
  exports.Models =
  exports.Alert =
  exports.AlertStatus =
  exports.AlertLevel =
  exports.AIEvent =
  exports.AIEventType =
  exports.Outbound =
  exports.Inbound =
  exports.InventoryItem =
  exports.User =
  exports.RoleEnum =
  exports.Canteen =
  exports.School =
  exports.Id =
    void 0;
const zod_1 = require('zod');
// Core IDs
exports.Id = zod_1.z.string().min(1);
// Tenant & Organization
exports.School = zod_1.z.object({
  id: exports.Id,
  name: zod_1.z.string(),
  district: zod_1.z.string().optional(),
  address: zod_1.z.string().optional(),
});
exports.Canteen = zod_1.z.object({
  id: exports.Id,
  schoolId: exports.Id,
  name: zod_1.z.string(),
});
// Users & Auth
exports.RoleEnum = zod_1.z.enum([
  'ADMIN',
  'REGULATOR',
  'SCHOOL',
  'SUPPLIER',
  'DEVICE_OPS',
  'PARENT',
]);
exports.User = zod_1.z.object({
  id: exports.Id,
  tenantId: exports.Id, // schoolId or orgId
  username: zod_1.z.string(),
  displayName: zod_1.z.string().optional(),
  roles: zod_1.z.array(exports.RoleEnum),
});
// Inventory (minimal)
exports.InventoryItem = zod_1.z.object({
  id: exports.Id,
  name: zod_1.z.string(),
  unit: zod_1.z.string().default('kg'),
});
exports.Inbound = zod_1.z.object({
  id: exports.Id,
  canteenId: exports.Id,
  itemId: exports.Id,
  quantity: zod_1.z.number(),
  supplier: zod_1.z.string().optional(),
  at: zod_1.z.string(),
});
exports.Outbound = zod_1.z.object({
  id: exports.Id,
  canteenId: exports.Id,
  itemId: exports.Id,
  quantity: zod_1.z.number(),
  purpose: zod_1.z.string().optional(),
  at: zod_1.z.string(),
});
// AI Events & Alerts
exports.AIEventType = zod_1.z.enum([
  'NO_MASK',
  'NO_HAT',
  'NO_UNIFORM',
  'NO_GLOVES',
  'PHONE_CALL',
  'SMOKING',
  'FIRE',
  'RODENT',
]);
exports.AIEvent = zod_1.z.object({
  id: exports.Id,
  canteenId: exports.Id,
  cameraId: exports.Id.optional(),
  type: exports.AIEventType,
  snapshotUrl: zod_1.z.string().url().optional(),
  detectedAt: zod_1.z.string(),
  handledBy: exports.Id.optional(),
  measure: zod_1.z.string().optional(),
});
exports.AlertLevel = zod_1.z.enum(['INFO', 'WARN', 'CRITICAL']);
exports.AlertStatus = zod_1.z.enum(['OPEN', 'ACK', 'CLOSED']);
exports.Alert = zod_1.z.object({
  id: exports.Id,
  type: zod_1.z.string(),
  level: exports.AlertLevel,
  status: exports.AlertStatus,
  relatedId: exports.Id.optional(),
  createdAt: zod_1.z.string(),
});
exports.Models = {
  School: exports.School,
  Canteen: exports.Canteen,
  User: exports.User,
  InventoryItem: exports.InventoryItem,
  Inbound: exports.Inbound,
  Outbound: exports.Outbound,
  AIEvent: exports.AIEvent,
  Alert: exports.Alert,
};
// Devices (shared enums)
exports.DeviceTypeEnum = zod_1.z.enum(['GATEWAY', 'CAMERA', 'SCALE', 'SENSOR', 'SMOKE']);
exports.DeviceStatusEnum = zod_1.z.enum(['ONLINE', 'OFFLINE', 'FAULT']);
