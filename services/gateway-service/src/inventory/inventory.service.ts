import { Injectable, MessageEvent, BadRequestException } from '@nestjs/common';
import { InventoryRepository } from './inventory.repository';
import { Observable, Subject } from 'rxjs';

export type Category = { id: string; name: string };
export type Product = { id: string; name: string; unit: string; categoryId?: string };
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
  id: string;
  productId: string;
  qty: number;
  supplierId?: string;
  warehouseId?: string;
  imageUrl?: string;
  at: string;
  source: 'manual' | 'scale';
};
export type Outbound = {
  id: string;
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
  async listCategories() {
    return this.repo!.listCategories();
  }
  createCategory(body: { name: string }) {
    if (!body?.name) throw new BadRequestException('name required');
    const c = { id: this.id('CAT'), name: body.name };
    this.repo?.insertCategory(c.id, c.name).catch(() => void 0);
    return c;
  }

  // Products
  async listProducts() {
    return this.repo!.listProducts();
  }
  createProduct(body: { name: string; unit: string; categoryId?: string }) {
    if (!body?.name) throw new BadRequestException('name required');
    if (!body?.unit) throw new BadRequestException('unit required');
    const p: Product = {
      id: this.id('PRD'),
      name: body.name,
      unit: body.unit,
      categoryId: body.categoryId,
    };
    this.repo?.insertProduct(p.id, p.name, p.unit, p.categoryId).catch(() => void 0);
    return p;
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
    q?: string;
    enabled?: 'true' | 'false';
    page?: number | string;
    pageSize?: number | string;
  }) {
    const p = Math.max(1, parseInt(String(params?.page ?? 1), 10) || 1);
    const ps = Math.max(1, parseInt(String(params?.pageSize ?? 20), 10) || 20);
    const enabled = params?.enabled ? params.enabled === 'true' : undefined;
    const res = await this.repo!.listSuppliers({ q: params?.q, enabled, page: p, pageSize: ps });
    const items = res.items.map((s: any) => ({ ...s, expired: this.isExpired(s.licenseExpireAt) }));
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
    const s: Supplier = { id: this.id('SUP'), enabled: true, ...b };
    if (s.rating && (s.rating < 1 || s.rating > 5)) s.rating = Math.min(5, Math.max(1, s.rating));
    this.repo?.insertSupplier(s).catch(() => void 0);
    return s;
  }
  async getSupplier(id: string) {
    const s = await this.repo!.getSupplierById(id);
    if (!s) throw new BadRequestException('not found');
    return s;
  }
  async updateSupplier(id: string, b: Partial<Omit<Supplier, 'id'>>) {
    this.assertValid(b);
    const next = { ...b } as any;
    if (next.rating && (next.rating < 1 || next.rating > 5))
      next.rating = Math.min(5, Math.max(1, next.rating));
    await this.repo!.updateSupplier(id, next);
    return { id, ...next };
  }
  async deleteSupplier(id: string) {
    await this.repo!.updateSupplier(id, { deleted: true });
    return { ok: true };
  }

  async batchEnable(ids: string[], enabled: boolean) {
    const count = await this.repo!.batchEnableSuppliers(ids || [], !!enabled);
    return { count };
  }

  // Warehouses
  async listWarehouses() {
    return this.repo!.listWarehouses();
  }
  createWarehouse(b: { name: string; location?: string; capacity?: number }) {
    if (!b?.name) throw new BadRequestException('name required');
    const w = { id: this.id('WH'), ...b };
    this.repo?.insertWarehouse(w).catch(() => void 0);
    return w;
  }
  async updateWarehouse(id: string, b: Partial<Omit<Warehouse, 'id'>>) {
    await this.repo!.updateWarehouse(id, b as any);
    return { id, ...(b as any) };
  }
  async deleteWarehouse(id: string) {
    await this.repo!.updateWarehouse(id, { deleted: true });
    return { ok: true };
  }

  // Inbound / Outbound
  async listInbound() { return this.repo!.listInbound(); }
  async listOutbound() { return this.repo!.listOutbound(); }
  createInbound(b: {
    productId: string;
    qty: number;
    supplierId?: string;
    warehouseId?: string;
    imageUrl?: string;
  }) {
    if (!b?.productId) throw new BadRequestException('productId required');
    if (!b?.qty || Number(b.qty) <= 0) throw new BadRequestException('qty must be > 0');
    const r: Inbound = {
      id: this.id('IN'),
      productId: b.productId,
      qty: Number(b.qty),
      supplierId: b.supplierId,
      warehouseId: b.warehouseId,
      imageUrl: b.imageUrl,
      at: this.now(),
      source: 'manual',
    };
    this.repo?.insertInbound(r).catch(() => void 0);
    this.emit('in-created', r);
    return r;
  }
  scaleInbound(b: {
    productId: string;
    weight: number;
    supplierId?: string;
    warehouseId?: string;
    imageUrl?: string;
  }) {
    return this.createInbound({
      productId: b.productId,
      qty: b.weight,
      supplierId: b.supplierId,
      warehouseId: b.warehouseId,
      imageUrl: b.imageUrl,
    });
  }
  createOutbound(b: {
    productId: string;
    qty: number;
    purpose?: string;
    by?: string;
    warehouseId?: string;
  }) {
    if (!b?.productId) throw new BadRequestException('productId required');
    if (!b?.qty || Number(b.qty) <= 0) throw new BadRequestException('qty must be > 0');
    const r: Outbound = {
      id: this.id('OUT'),
      productId: b.productId,
      qty: Number(b.qty),
      purpose: b.purpose,
      by: b.by,
      warehouseId: b.warehouseId,
      at: this.now(),
      source: 'manual',
    };
    this.repo?.insertOutbound(r).catch(() => void 0);
    this.emit('out-created', r);
    return r;
  }
  scaleOutbound(b: {
    productId: string;
    weight: number;
    purpose?: string;
    by?: string;
    warehouseId?: string;
  }) {
    return this.createOutbound({
      productId: b.productId,
      qty: b.weight,
      purpose: b.purpose,
      by: b.by,
      warehouseId: b.warehouseId,
    });
  }

  // Stock
  async getStock(): Promise<Stock[]> {
    const list = await this.repo!.getStock();
    return list.map((s) => ({ productId: s.productId, qty: Number(s.qty || 0), updatedAt: this.now() }));
  }
  async stocktake(adj: { productId: string; qty: number }) {
    const current = (await this.getStock()).find((s) => s.productId === adj.productId)?.qty || 0;
    const diff = adj.qty - current;
    if (diff === 0) return { ok: true };
    if (diff > 0) await this.createInbound({ productId: adj.productId, qty: diff });
    else await this.createOutbound({ productId: adj.productId, qty: -diff });
    return { ok: true };
  }

  // Tickets
  async listTickets() { return this.repo!.listTickets(); }
  createTicket(b: { productId: string; type: string; imageUrl?: string }) {
    if (!b?.productId || !b?.type) throw new BadRequestException('productId/type required');
    const t = { id: this.id('TK'), ...b, at: this.now() };
    this.repo?.insertTicket(t as any).catch(() => void 0);
    return t;
  }

  // Additives
  async listAdditives() { return this.repo!.listAdditives(); }
  createAdditive(b: { name: string; amount: number; dish?: string; by?: string }) {
    if (!b?.name) throw new BadRequestException('name required');
    if (!b?.amount || Number(b.amount) <= 0) throw new BadRequestException('amount>0');
    const a = { id: this.id('AD'), ...b, at: this.now() };
    this.repo?.insertAdditive(a as any).catch(() => void 0);
    return a;
  }

  stream(): Observable<MessageEvent> {
    setTimeout(() => this.events$.next({ type: 'hello', data: { ok: true } }), 0);
    return this.events$.asObservable();
  }

  private seed() {}
}
