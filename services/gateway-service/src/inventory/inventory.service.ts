import { Injectable, MessageEvent, BadRequestException } from '@nestjs/common';
import { InventoryRepository } from './inventory.repository';
import { Observable, Subject } from 'rxjs';

export type Category = { id: number; name: string };
export type Product = { id: number; name: string; unit: string; categoryId?: number };
export type Supplier = {
  id: string;
  name: string;
  phone?: string;
  license?: string;
  address?: string;
  contact?: string;
  email?: string;
  enabled?: boolean;
  rating?: number; // 1-5
  categories?: string[]; // 供货品类
  licenseExpireAt?: string; // ISO date
  licenseImageUrl?: string;
  deleted?: boolean;
};
export type Warehouse = {
  id: string;
  name: string;
  location?: string;
  capacity?: number;
  deleted?: boolean;
};
export type Inbound = {
  id: number;
  productId: string;
  qty: number;
  supplierId?: string;
  warehouseId?: string;
  imageUrl?: string;
  at: string;
  source: 'manual' | 'scale';
};
export type Outbound = {
  id: number;
  productId: string;
  qty: number;
  purpose?: string;
  by?: string;
  warehouseId?: string;
  at: string;
  source: 'manual' | 'scale';
};
export type Stock = { productId: string; qty: number; updatedAt: string };
export type Ticket = { id: string; productId: string; type: string; imageUrl?: string; at: string };
export type Additive = {
  id: string;
  name: string;
  amount: number;
  dish?: string;
  by?: string;
  at: string;
};

@Injectable()
export class InventoryService {
  private seq = 1;
  private events$ = new Subject<MessageEvent>();

  constructor(private readonly repo?: InventoryRepository) {}

  private id(prefix: string) {
    return `${prefix}-${String(this.seq++).padStart(4, '0')}`;
  }
  private now() {
    return new Date().toISOString();
  }
  private emit(type: string, data: any) {
    this.events$.next({ type, data });
  }

  // Categories
  async listCategories(schoolId?: number | string) {
    return this.repo!.listCategories(schoolId);
  }
  createCategory(body: { schoolId?: number | string; name: string }) {
    if (!body?.name) throw new BadRequestException('name required');
    const sid = body.schoolId !== undefined && body.schoolId !== null && String(body.schoolId).trim() !== '' ? Number(body.schoolId) : 1;
    return this.repo!.insertCategory(sid, body.name).then((id) => ({ id, name: body.name }));
  }

  // Products
  async listProducts(schoolId?: number | string) {
    return this.repo!.listProducts(schoolId);
  }
  createProduct(body: { schoolId?: number | string; name: string; unit: string; categoryId?: number | string }) {
    if (!body?.name) throw new BadRequestException('name required');
    if (!body?.unit) throw new BadRequestException('unit required');
    const sid = body.schoolId !== undefined && body.schoolId !== null && String(body.schoolId).trim() !== '' ? Number(body.schoolId) : 1;
    const categoryId = body.categoryId !== undefined && body.categoryId !== null && String(body.categoryId).trim() !== '' ? Number(body.categoryId) : undefined;
    return this.repo!.insertProduct(sid, body.name, body.unit, categoryId).then((id) => ({ id, name: body.name, unit: body.unit, categoryId } as Product));
  }
  importFromCloud() {
    const list = [
      { name: '大米', unit: 'kg' },
      { name: '面粉', unit: 'kg' },
      { name: '鸡蛋', unit: '枚' },
    ];
    const created = list.map((i) => this.createProduct(i as any));
    return { count: created.length, items: created };
  }
  importFromTemplate(body: { items: { name: string; unit: string; categoryId?: string }[] }) {
    if (!Array.isArray(body?.items)) throw new BadRequestException('items required');
    const created = body.items.map((i) => this.createProduct(i));
    return { count: created.length };
  }

  // Suppliers
  async listSuppliers(params?: {
    schoolId?: number | string;
    q?: string;
    enabled?: 'true' | 'false';
    expired?: 'true' | 'false';
    expireStart?: string;
    expireEnd?: string;
    page?: number | string;
    pageSize?: number | string;
  }) {
    const p = Math.max(1, parseInt(String(params?.page ?? 1), 10) || 1);
    const ps = Math.max(1, parseInt(String(params?.pageSize ?? 20), 10) || 20);
    const enabled = params?.enabled ? params.enabled === 'true' : undefined;
    const expired = params?.expired === 'true' ? true : params?.expired === 'false' ? false : undefined;
    const res = await this.repo!.listSuppliers({ schoolId: params?.schoolId, q: params?.q, enabled, expired, expireStart: params?.expireStart, expireEnd: params?.expireEnd, page: p, pageSize: ps });
    const items = res.items.map((s: any) => ({ ...s, licenseExpireAt: s.licenseExpireAt ? this.fmtSeconds(s.licenseExpireAt) : undefined, expired: this.isExpired(s.licenseExpireAt) }));
    return { ...res, items };
  }
  private isExpired(dateISO?: string) {
    if (!dateISO) return false;
    const t = Date.parse(dateISO);
    return Number.isFinite(t) ? t < Date.now() : false;
  }
  private assertUnique(_b: Partial<Supplier>, _ignoreId?: string) {}
  private assertValid(b: Partial<Supplier>) {
    if (b.phone) {
      const ok = /^\+?\d{7,20}$/.test(b.phone);
      if (!ok) throw new BadRequestException('invalid phone');
    }
    if (b.email) {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email);
      if (!ok) throw new BadRequestException('invalid email');
    }
    if (b.licenseExpireAt) {
      const t = Date.parse(b.licenseExpireAt);
      if (!Number.isFinite(t)) throw new BadRequestException('invalid licenseExpireAt');
    }
    if (b.rating !== undefined) {
      const n = Number(b.rating);
      if (!Number.isFinite(n) || n < 1 || n > 5) throw new BadRequestException('invalid rating');
    }
  }
  createSupplier(b: {
    schoolId?: number | string;
    name: string;
    phone?: string;
    license?: string;
    address?: string;
    contact?: string;
    email?: string;
    enabled?: boolean;
    rating?: number;
    categories?: string[];
    licenseExpireAt?: string;
    licenseImageUrl?: string;
  }) {
    if (!b?.name) throw new BadRequestException('name required');
    this.assertUnique(b);
    this.assertValid(b);
    const sid = b.schoolId !== undefined && b.schoolId !== null && String(b.schoolId).trim() !== '' ? Number(b.schoolId) : 1;
    const payload = { schoolId: sid, ...b } as any;
    if (payload.rating && (payload.rating < 1 || payload.rating > 5)) payload.rating = Math.min(5, Math.max(1, payload.rating));
    return this.repo!.insertSupplier(payload).then((id) => ({ id, enabled: payload.enabled ?? true, ...b } as any));
  }
  async getSupplier(id: number | string) {
    const s = await this.repo!.getSupplierById(id);
    if (!s) throw new BadRequestException('not found');
    return s;
  }
  async updateSupplier(id: number | string, b: Partial<Omit<Supplier, 'id'>>) {
    this.assertValid(b);
    const next = { ...b } as any;
    if (next.rating && (next.rating < 1 || next.rating > 5))
      next.rating = Math.min(5, Math.max(1, next.rating));
    await this.repo!.updateSupplier(id, next);
    return { id, ...next };
  }
  async deleteSupplier(id: number | string) {
    await this.repo!.updateSupplier(id, { deleted: true });
    return { ok: true };
  }

  async batchEnable(ids: string[], enabled: boolean) {
    const count = await this.repo!.batchEnableSuppliers(ids || [], !!enabled);
    return { count };
  }

  // Warehouses
  async listWarehouses(schoolId?: number | string) {
    return this.repo!.listWarehouses(schoolId);
  }
  createWarehouse(b: { schoolId?: number | string; name: string; location?: string; capacity?: number }) {
    if (!b?.name) throw new BadRequestException('name required');
    const sid = b.schoolId !== undefined && b.schoolId !== null && String(b.schoolId).trim() !== '' ? Number(b.schoolId) : 1;
    return this.repo!.insertWarehouse({ schoolId: sid, name: b.name, location: b.location, capacity: b.capacity }).then((id) => ({ id, ...b } as any));
  }
  async updateWarehouse(id: number | string, b: Partial<Omit<Warehouse, 'id'>>) {
    await this.repo!.updateWarehouse(id, b as any);
    return { id, ...(b as any) };
  }
  async deleteWarehouse(id: number | string) {
    await this.repo!.updateWarehouse(id, { deleted: true });
    return { ok: true };
  }

  // Inbound / Outbound
  async listInbound(schoolId?: number | string) { return this.repo!.listInbound(schoolId); }
  async listOutbound(schoolId?: number | string) { return this.repo!.listOutbound(schoolId); }
  createInbound(b: {
    schoolId?: number | string;
    productId: string;
    qty: number;
    supplierId?: string;
    warehouseId?: string;
    imageUrl?: string;
  }) {
    if (!b?.productId) throw new BadRequestException('productId required');
    if (!b?.qty || Number(b.qty) <= 0) throw new BadRequestException('qty must be > 0');
    const sid = b.schoolId !== undefined && b.schoolId !== null && String(b.schoolId).trim() !== '' ? Number(b.schoolId) : 1;
    const r: Inbound = {
      id: 0 as any,
      productId: b.productId,
      qty: Number(b.qty),
      supplierId: b.supplierId,
      warehouseId: b.warehouseId,
      imageUrl: b.imageUrl,
      at: this.now(),
      source: 'manual',
    };
    return this.repo!.insertInbound({ schoolId: sid, ...r }).then((insertId) => {
      const rec = { ...r, id: insertId };
      this.emit('in-created', rec);
      return rec;
    });
  }
  scaleInbound(b: {
    schoolId?: number | string;
    productId: string;
    weight: number;
    supplierId?: string;
    warehouseId?: string;
    imageUrl?: string;
  }) {
    return this.createInbound({
      schoolId: b.schoolId,
      productId: b.productId,
      qty: b.weight,
      supplierId: b.supplierId,
      warehouseId: b.warehouseId,
      imageUrl: b.imageUrl,
    });
  }
  createOutbound(b: {
    schoolId?: number | string;
    productId: string;
    qty: number;
    purpose?: string;
    by?: string;
    warehouseId?: string;
  }) {
    if (!b?.productId) throw new BadRequestException('productId required');
    if (!b?.qty || Number(b.qty) <= 0) throw new BadRequestException('qty must be > 0');
    const sid = b.schoolId !== undefined && b.schoolId !== null && String(b.schoolId).trim() !== '' ? Number(b.schoolId) : 1;
    const r: Outbound = {
      id: 0 as any,
      productId: b.productId,
      qty: Number(b.qty),
      purpose: b.purpose,
      by: b.by,
      warehouseId: b.warehouseId,
      at: this.now(),
      source: 'manual',
    };
    return this.repo!.insertOutbound({ schoolId: sid, ...r }).then((insertId) => {
      const rec = { ...r, id: insertId };
      this.emit('out-created', rec);
      return rec;
    });
  }
  scaleOutbound(b: {
    schoolId?: number | string;
    productId: string;
    weight: number;
    purpose?: string;
    by?: string;
    warehouseId?: string;
  }) {
    return this.createOutbound({
      schoolId: b.schoolId,
      productId: b.productId,
      qty: b.weight,
      purpose: b.purpose,
      by: b.by,
      warehouseId: b.warehouseId,
    });
  }

  // Stock
  private fmtSeconds(d?: Date | string | null) {
    if (!d) return this.now();
    const dt = typeof d === 'string' ? new Date(d) : d;
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      dt.getFullYear() +
      '-' + pad(dt.getMonth() + 1) +
      '-' + pad(dt.getDate()) +
      ' ' + pad(dt.getHours()) +
      ':' + pad(dt.getMinutes()) +
      ':' + pad(dt.getSeconds())
    );
  }
  async getStock(schoolId?: number | string): Promise<Stock[]> {
    const list = await this.repo!.getStock(schoolId);
    return list.map((s: any) => ({ productId: s.productId, qty: Number(s.qty || 0), updatedAt: this.fmtSeconds(s.updatedAt) }));
  }
  async stocktake(adj: { schoolId?: number | string; productId: string; qty: number }) {
    const current = (await this.getStock(adj.schoolId)).find((s) => s.productId === adj.productId)?.qty || 0;
    const diff = adj.qty - current;
    if (diff === 0) return { ok: true };
    if (diff > 0) await this.createInbound({ schoolId: adj.schoolId, productId: adj.productId, qty: diff });
    else await this.createOutbound({ schoolId: adj.schoolId, productId: adj.productId, qty: -diff });
    return { ok: true };
  }

  // Tickets
  async listTickets(schoolId?: number | string) { return this.repo!.listTickets(schoolId); }
  createTicket(b: { schoolId?: number | string; productId: string; type: string; imageUrl?: string }) {
    if (!b?.productId || !b?.type) throw new BadRequestException('productId/type required');
    const sid = b.schoolId !== undefined && b.schoolId !== null && String(b.schoolId).trim() !== '' ? Number(b.schoolId) : 1;
    const at = this.now();
    return this.repo!.insertTicket({ schoolId: sid, productId: b.productId, type: b.type, imageUrl: b.imageUrl, at }).then((insertId) => ({ id: insertId, productId: b.productId, type: b.type, imageUrl: b.imageUrl, at } as any));
  }

  // Additives
  async listAdditives(schoolId?: number | string) { return this.repo!.listAdditives(schoolId); }
  createAdditive(b: { schoolId?: number | string; name: string; amount: number; dish?: string; by?: string }) {
    if (!b?.name) throw new BadRequestException('name required');
    if (!b?.amount || Number(b.amount) <= 0) throw new BadRequestException('amount>0');
    const sid = b.schoolId !== undefined && b.schoolId !== null && String(b.schoolId).trim() !== '' ? Number(b.schoolId) : 1;
    const at = this.now();
    return this.repo!.insertAdditive({ schoolId: sid, name: b.name, amount: Number(b.amount), dish: b.dish, by: b.by, at }).then((insertId) => ({ id: insertId, name: b.name, amount: Number(b.amount), dish: b.dish, by: b.by, at } as any));
  }

  stream(): Observable<MessageEvent> {
    setTimeout(() => this.events$.next({ type: 'hello', data: { ok: true } }), 0);
    return this.events$.asObservable();
  }

  private seed() {}
}
