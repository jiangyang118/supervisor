import { Injectable, MessageEvent, BadRequestException } from '@nestjs/common';
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

  categories: Category[] = [];
  products: Product[] = [];
  suppliers: Supplier[] = [];
  warehouses: Warehouse[] = [];
  inbound: Inbound[] = [];
  outbound: Outbound[] = [];
  tickets: Ticket[] = [];
  additives: Additive[] = [];

  constructor() {
    this.seed();
  }

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
  listCategories() {
    return this.categories;
  }
  createCategory(body: { name: string }) {
    if (!body?.name) throw new BadRequestException('name required');
    const c = { id: this.id('CAT'), name: body.name };
    this.categories.push(c);
    return c;
  }

  // Products
  listProducts() {
    return this.products;
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
    this.products.unshift(p);
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
  listSuppliers(params?: {
    q?: string;
    enabled?: 'true' | 'false';
    page?: number | string;
    pageSize?: number | string;
  }) {
    let arr = this.suppliers.filter((s) => !s.deleted);
    if (params?.q) {
      const q = params.q.toLowerCase();
      arr = arr.filter(
        (s) =>
          (s.name || '').toLowerCase().includes(q) ||
          (s.phone || '').includes(q) ||
          (s.license || '').includes(q),
      );
    }
    if (params?.enabled) {
      const en = params.enabled === 'true';
      arr = arr.filter((s) => (s.enabled ?? true) === en);
    }
    let p = Math.max(1, parseInt(String(params?.page ?? 1), 10) || 1);
    const ps = Math.max(1, parseInt(String(params?.pageSize ?? 20), 10) || 20);
    const total = arr.length;
    const maxPage = Math.max(1, Math.ceil(total / ps) || 1);
    if (p > maxPage) p = maxPage;
    const items = arr
      .slice((p - 1) * ps, p * ps)
      .map((s) => ({ ...s, expired: this.isExpired(s.licenseExpireAt) }));
    return { items, total, page: p, pageSize: ps };
  }
  private isExpired(dateISO?: string) {
    if (!dateISO) return false;
    const t = Date.parse(dateISO);
    return Number.isFinite(t) ? t < Date.now() : false;
  }
  private assertUnique(b: Partial<Supplier>, ignoreId?: string) {
    if (b.phone) {
      const hit = this.suppliers.find((s) => s.phone === b.phone && s.id !== ignoreId);
      if (hit) throw new BadRequestException('phone already exists');
    }
    if (b.license) {
      const hit = this.suppliers.find((s) => s.license === b.license && s.id !== ignoreId);
      if (hit) throw new BadRequestException('license already exists');
    }
  }
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
    this.suppliers.unshift(s);
    return s;
  }
  getSupplier(id: string) {
    const s = this.suppliers.find((x) => x.id === id);
    if (!s) throw new BadRequestException('not found');
    return s;
  }
  updateSupplier(id: string, b: Partial<Omit<Supplier, 'id'>>) {
    const idx = this.suppliers.findIndex((x) => x.id === id);
    if (idx === -1) throw new BadRequestException('not found');
    this.assertUnique(b, id);
    this.assertValid(b);
    const next = { ...this.suppliers[idx], ...b };
    if (next.rating && (next.rating < 1 || next.rating > 5))
      next.rating = Math.min(5, Math.max(1, next.rating));
    this.suppliers[idx] = next;
    return this.suppliers[idx];
  }
  deleteSupplier(id: string) {
    const idx = this.suppliers.findIndex((s) => s.id === id);
    if (idx === -1) return { ok: false };
    this.suppliers[idx].deleted = true;
    return { ok: true };
  }

  batchEnable(ids: string[], enabled: boolean) {
    let count = 0;
    for (const id of ids || []) {
      const s = this.suppliers.find((x) => x.id === id);
      if (!s) continue;
      s.enabled = !!enabled;
      count++;
    }
    return { count };
  }

  // Warehouses
  listWarehouses() {
    return this.warehouses.filter((w) => !w.deleted);
  }
  createWarehouse(b: { name: string; location?: string; capacity?: number }) {
    if (!b?.name) throw new BadRequestException('name required');
    const w = { id: this.id('WH'), ...b };
    this.warehouses.unshift(w);
    return w;
  }
  updateWarehouse(id: string, b: Partial<Omit<Warehouse, 'id'>>) {
    const idx = this.warehouses.findIndex((w) => w.id === id && !w.deleted);
    if (idx === -1) throw new BadRequestException('not found');
    const next = { ...this.warehouses[idx], ...b } as Warehouse;
    this.warehouses[idx] = next;
    return next;
  }
  deleteWarehouse(id: string) {
    const idx = this.warehouses.findIndex((w) => w.id === id && !w.deleted);
    if (idx === -1) return { ok: false };
    this.warehouses[idx].deleted = true;
    return { ok: true };
  }

  // Inbound / Outbound
  listInbound() {
    return this.inbound.sort((a, b) => (a.at < b.at ? 1 : -1));
  }
  listOutbound() {
    return this.outbound.sort((a, b) => (a.at < b.at ? 1 : -1));
  }
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
    this.inbound.unshift(r);
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
    this.outbound.unshift(r);
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
  getStock(): Stock[] {
    const map = new Map<string, number>();
    for (const i of this.inbound) map.set(i.productId, (map.get(i.productId) || 0) + i.qty);
    for (const o of this.outbound) map.set(o.productId, (map.get(o.productId) || 0) - o.qty);
    const res: Stock[] = [];
    for (const [productId, qty] of map) res.push({ productId, qty, updatedAt: this.now() });
    return res;
  }
  stocktake(adj: { productId: string; qty: number }) {
    const current = this.getStock().find((s) => s.productId === adj.productId)?.qty || 0;
    const diff = adj.qty - current;
    if (diff === 0) return { ok: true };
    if (diff > 0) this.createInbound({ productId: adj.productId, qty: diff });
    else this.createOutbound({ productId: adj.productId, qty: -diff });
    return { ok: true };
  }

  // Tickets
  listTickets() {
    return this.tickets.sort((a, b) => (a.at < b.at ? 1 : -1));
  }
  createTicket(b: { productId: string; type: string; imageUrl?: string }) {
    if (!b?.productId || !b?.type) throw new BadRequestException('productId/type required');
    const t = { id: this.id('TK'), ...b, at: this.now() };
    this.tickets.unshift(t as any);
    return t;
  }

  // Additives
  listAdditives() {
    return this.additives.sort((a, b) => (a.at < b.at ? 1 : -1));
  }
  createAdditive(b: { name: string; amount: number; dish?: string; by?: string }) {
    if (!b?.name) throw new BadRequestException('name required');
    if (!b?.amount || Number(b.amount) <= 0) throw new BadRequestException('amount>0');
    const a = { id: this.id('AD'), ...b, at: this.now() };
    this.additives.unshift(a as any);
    return a;
  }

  stream(): Observable<MessageEvent> {
    setTimeout(() => this.events$.next({ type: 'hello', data: { ok: true } }), 0);
    return this.events$.asObservable();
  }

  private seed() {
    const catMain = this.createCategory({ name: '主食' });
    const catVeg = this.createCategory({ name: '蔬菜' });
    const rice = this.createProduct({ name: '大米', unit: 'kg', categoryId: catMain.id });
    const egg = this.createProduct({ name: '鸡蛋', unit: '枚', categoryId: catMain.id });
    const cucumber = this.createProduct({ name: '黄瓜', unit: 'kg', categoryId: catVeg.id });
    const sup = this.createSupplier({
      name: '示例供应商',
      phone: '13800000000',
      license: 'LIC-123456',
    });
    const wh = this.createWarehouse({ name: '主仓库', location: '食堂东侧', capacity: 100 });
    this.createInbound({
      productId: rice.id,
      qty: 100,
      supplierId: sup.id,
      warehouseId: wh.id,
      imageUrl: '',
    });
    this.createOutbound({
      productId: rice.id,
      qty: 10,
      purpose: '午餐',
      by: '张三',
      warehouseId: wh.id,
    });
    this.createTicket({ productId: rice.id, type: '合格证' });
    this.createAdditive({ name: '食盐', amount: 10, dish: '青菜', by: '后厨' });
  }
}
