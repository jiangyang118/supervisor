import { Injectable, MessageEvent, BadRequestException, ConflictException } from '@nestjs/common';
import { InventoryRepository } from './inventory.repository';
import { Observable, Subject } from 'rxjs';

export type Category = { id: number; name: string };
export type Product = { id: number; name: string; unit: string; categoryId?: number };
export type ProductV2 = { id: number; schoolId: number; name: string; unit: string; category?: string; spec?: string; lastPrice?: number };
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

  // Products: removed (商品管理下线)
  async listProductsV2(schoolId?: number | string): Promise<ProductV2[]> { return this.repo!.listProducts(schoolId) as any; }
  async createProductV2(body: { schoolId?: number | string; name: string; unit: string; category?: string; spec?: string; lastPrice?: number }) {
    if (!body?.name) throw new BadRequestException('name required');
    if (!body?.unit) throw new BadRequestException('unit required');
    const sid = body.schoolId !== undefined && body.schoolId !== null && String(body.schoolId).trim() !== '' ? Number(body.schoolId) : 1;
    const id = await (this.repo as any).insertProductV2({ schoolId: sid, name: body.name, unit: body.unit, category: body.category, spec: body.spec, lastPrice: body.lastPrice });
    return { id };
  }
  importFromCloudV2() {
    const fixedCats = ['主食','肉类','蛋类','鱼虾蟹贝类','奶类及奶制品','豆类及豆制品','蔬菜','油脂','淀粉类','菌藻类','坚果种子类','小吃甜品','速食食品','含酒精饮料','蜜饯类','调味品','饮料'];
    const sample = [
      { name: '大米', unit: 'kg', category: '主食', spec: '25kg/袋' },
      { name: '猪肉', unit: 'kg', category: '肉类', spec: '散装' },
      { name: '鸡蛋', unit: '枚', category: '蛋类', spec: '30枚/板' },
      { name: '生菜', unit: 'kg', category: '蔬菜', spec: '散装' },
    ];
    return { fixedCategories: fixedCats, items: sample };
  }
  async importFromTemplateV2(schoolId: number | string | undefined, items: Array<{ name: string; unit: string; category?: string; spec?: string; lastPrice?: number }>) {
    const sid = schoolId !== undefined && schoolId !== null && String(schoolId).trim() !== '' ? Number(schoolId) : 1;
    let count = 0;
    for (const it of items || []) {
      if (!it?.name || !it?.unit) continue;
      await (this.repo as any).insertProductV2({ schoolId: sid, name: it.name, unit: it.unit, category: it.category, spec: it.spec, lastPrice: it.lastPrice });
      count++;
    }
    return { count };
  }
  async updateProductV2(id: number | string, patch: Partial<{ name: string; unit: string; category?: string; spec?: string; lastPrice?: number }>) {
    if (!id || !Number.isFinite(Number(id))) throw new BadRequestException('id required');
    const p: any = {};
    if (patch.name !== undefined) p.name = patch.name;
    if (patch.unit !== undefined) p.unit = patch.unit;
    if (patch.category !== undefined) p.category = patch.category;
    if (patch.spec !== undefined) p.spec = patch.spec ?? '';
    if (patch.lastPrice !== undefined) p.lastPrice = Number.isFinite(Number(patch.lastPrice)) ? Number(patch.lastPrice) : null;
    await (this.repo as any).updateProduct(Number(id), p);
    return { ok: true } as any;
  }
  async deleteProductV2(id: number | string) {
    if (!id || !Number.isFinite(Number(id))) throw new BadRequestException('id required');
    await (this.repo as any).softDelete(Number(id));
    return { ok: true } as any;
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
    const items = res.items.map((s: any) => ({
      ...s,
      licenseExpireAt: s.licenseExpireAt ? this.fmtDay(s.licenseExpireAt) : undefined,
      foodLicenseExpireAt: s.foodLicenseExpireAt ? this.fmtDay(s.foodLicenseExpireAt) : undefined,
      qcExpireAt: s.qcExpireAt ? this.fmtDay(s.qcExpireAt) : undefined,
      animalExpireAt: s.animalExpireAt ? this.fmtDay(s.animalExpireAt) : undefined,
      expired: this.isExpired(s.licenseExpireAt),
    }));
    return { ...res, items };
  }
  private isExpired(dateISO?: string) {
    if (!dateISO) return false;
    const t = Date.parse(dateISO);
    return Number.isFinite(t) ? t < Date.now() : false;
  }
  private async assertUnique(b: Partial<Supplier>, schoolId: number, ignoreId?: number | string) {
    const name = String(b.name || '').trim();
    if (!name) return;
    const exists = await this.repo!.existsSupplierName(schoolId, name, ignoreId);
    if (exists) throw new ConflictException('供应商名称已存在');
  }
  private assertValid(b: Partial<Supplier>) {
    if (b.phone !== undefined && b.phone !== null) {
      const p = String(b.phone).trim();
      if (p) {
        const ok = /^[+]?[\d\s\-()]{6,25}$/.test(p);
        if (!ok) throw new BadRequestException('invalid phone');
      }
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
  async createSupplier(b: {
    schoolId?: number | string;
    name: string;
    phone?: string;
    address?: string;
    contact?: string;
    email?: string;
    enabled?: boolean;
    rating?: number;
    categories?: string[];
    // optional legacy license fields kept for backward compatibility
    license?: string;
    licenseExpireAt?: string;
    licenseImageUrl?: string;
    // certificate from modal
    certType?: string;
    certNumber?: string;
    certAuthority?: string;
    certExpireAt?: string;
    certImageUrl?: string;
  }) {
    if (!b?.name || !String(b.name).trim()) throw new BadRequestException('name required');
    b.name = String(b.name).trim();
    if (b.address !== undefined && b.address !== null) b.address = String(b.address).trim();
    if (b.contact !== undefined && b.contact !== null) b.contact = String(b.contact).trim();
    if (b.phone !== undefined && b.phone !== null) b.phone = String(b.phone).trim();
    const sid = b.schoolId !== undefined && b.schoolId !== null && String(b.schoolId).trim() !== '' ? Number(b.schoolId) : 1;
    await this.assertUnique(b, sid);
    this.assertValid(b);
    const payload = { schoolId: sid, ...b } as any;
    if (payload.rating && (payload.rating < 1 || payload.rating > 5)) payload.rating = Math.min(5, Math.max(1, payload.rating));
    return this.repo!.insertSupplier(payload).then(async (id) => {
      // Insert certificate if provided; ignore if cert table not migrated yet
      try {
        if (b.certType || b.certNumber || b.certExpireAt || b.certImageUrl) {
          await this.repo!.insertSupplierCertificate({
            supplierId: Number(id),
            type: b.certType || '营业执照',
            number: b.certNumber,
            authority: b.certAuthority,
            expireAt: b.certExpireAt || b.licenseExpireAt,
            imageUrl: b.certImageUrl || b.licenseImageUrl,
          });
        }
      } catch {}
      return { id, enabled: payload.enabled ?? true, ...b } as any;
    });
  }
  async getSupplier(id: number | string) {
    const s = await this.repo!.getSupplierById(id);
    if (!s) throw new BadRequestException('not found');
    // Attach certificates summary
    let certs: Array<{ type: string; number?: string; authority?: string; expireAt?: string; imageUrl?: string }> = [];
    try { certs = await this.repo!.listSupplierCertificates(id); } catch { certs = []; }
    const byType = (t: string) => certs.filter((c) => c.type === t);
    const latest = (arr: any[]) => (arr && arr.length ? arr[0] : undefined);
    const biz = latest(byType('营业执照')) || (s.license || s.licenseExpireAt || s.licenseImageUrl ? { number: s.license, expireAt: s.licenseExpireAt, imageUrl: s.licenseImageUrl } : undefined);
    const qc = latest(byType('质检报告'));
    const animal = latest(byType('动物检疫合格证'));
    return { ...s, businessLicense: biz || null, qcReport: qc || null, animalCert: animal || null };
  }
  async updateSupplier(id: number | string, b: Partial<Omit<Supplier, 'id'>> & { certType?: string; certNumber?: string; certAuthority?: string; certExpireAt?: string; certImageUrl?: string }) {
    this.assertValid(b);
    const next = { ...b } as any;
    if (next.rating && (next.rating < 1 || next.rating > 5))
      next.rating = Math.min(5, Math.max(1, next.rating));
    if (next.name !== undefined) {
      next.name = String(next.name).trim();
      if (next.name) {
        const cur = await this.repo!.getSupplierById(id);
        if (cur) await this.assertUnique({ name: next.name }, Number(cur.schoolId), id);
      }
    }
    await this.repo!.updateSupplier(id, next);
    try {
      if ((b as any)?.certType || (b as any)?.certNumber || (b as any)?.certExpireAt || (b as any)?.certImageUrl) {
        await this.repo!.insertSupplierCertificate({
          supplierId: Number(id),
          type: (b as any).certType || '营业执照',
          number: (b as any).certNumber,
          authority: (b as any).certAuthority,
          expireAt: (b as any).certExpireAt || (b as any).licenseExpireAt,
          imageUrl: (b as any).certImageUrl || (b as any).licenseImageUrl,
        });
      }
    } catch {}
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

  async addSupplierCertificate(id: number | string, b: { type: string; number?: string; authority?: string; expireAt?: string; imageUrl?: string }) {
    if (!b?.type) throw new BadRequestException('type required');
    const allowed = new Set(['营业执照', '食品生产许可证', '食品经营许可证', '质检报告', '动物检疫合格证']);
    if (!allowed.has(b.type)) throw new BadRequestException('invalid certificate type');
    if (b.number !== undefined && b.number !== null) {
      const n = String(b.number).trim();
      if (n && !/^[A-Za-z0-9\-_/]{3,64}$/.test(n)) throw new BadRequestException('invalid certificate number');
      b.number = n;
    }
    if (b.authority !== undefined && b.authority !== null) b.authority = String(b.authority).trim();
    if (b.expireAt !== undefined && b.expireAt !== null) {
      const t = Date.parse(String(b.expireAt));
      if (!Number.isFinite(t)) throw new BadRequestException('invalid expireAt');
    }
    try {
      await this.repo!.insertSupplierCertificate({
        supplierId: Number(id),
        type: b.type,
        number: b.number,
        authority: b.authority,
        expireAt: b.expireAt,
        imageUrl: b.imageUrl,
      });
    } catch (e) {
      // Fallback for older schema: write to legacy columns for business license
      if (b.type === '营业执照') {
        await this.repo!.updateSupplier(id, {
          license: b.number,
          licenseExpireAt: b.expireAt,
          licenseImageUrl: b.imageUrl,
        } as any);
        return { ok: true, fallback: true } as any;
      }
      throw new BadRequestException('cannot add certificate');
    }
    return { ok: true };
  }

  async supplierSummary(id: number | string) {
    const [products, inbound] = await Promise.all([
      this.repo!.listSupplierProducts(id),
      this.repo!.listInboundBySupplier(id),
    ]);
    return { products, inbound };
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
  async listInboundDocs(schoolId?: number | string) { return this.repo!.listInboundDocs(schoolId); }
  async getInboundDocDetail(docNo: string) { return this.repo!.getInboundDocDetail(docNo); }
  async listOutbound(schoolId?: number | string) { return this.repo!.listOutbound(schoolId); }
  async listOutboundBatches(params: { schoolId: number | string; productId: number | string; canteenId?: number | string }) {
    if (!params?.schoolId || !params?.productId) throw new BadRequestException('schoolId/productId required');
    return this.repo!.listInboundFifoBatches(params);
  }
  async clearOutbound(schoolId?: number | string) {
    const deleted = await this.repo!.clearOutbound(schoolId);
    return { deleted } as any;
  }
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
  async createInboundDoc(b: { schoolId?: number | string; canteenId?: number; supplierId?: number | string; date: string; operator?: string; items: Array<{ productId: string; qty: number; unitPrice?: number; prodDate?: string; shelfLifeDays?: number }>; tickets: Array<{ type: 'ticket_quarantine'|'ticket_invoice'|'ticket_receipt'; imageUrl: string }>; images?: string[] }) {
    if (!b?.date) throw new BadRequestException('date required');
    if (!Array.isArray(b?.items) || !b.items.length) throw new BadRequestException('items required');
    const sid = b.schoolId !== undefined && b.schoolId !== null && String(b.schoolId).trim() !== '' ? Number(b.schoolId) : 1;
    const docNo = `IN-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    // Require tickets: quarantine + invoice/receipt at least one each
    const types = new Set((b.tickets || []).map((t) => t.type));
    if (!types.has('ticket_quarantine') || !(types.has('ticket_invoice') || types.has('ticket_receipt'))) {
      throw new BadRequestException('tickets required: quarantine and invoice/receipt');
    }
    await this.repo!.insertInboundDoc({
      schoolId: sid,
      docNo,
      canteenId: b.canteenId,
      supplierId: b.supplierId,
      date: b.date,
      operator: b.operator,
      items: b.items.map((it) => ({ productId: it.productId, qty: Number(it.qty || 0), unitPrice: it.unitPrice, prodDate: it.prodDate, shelfLifeDays: it.shelfLifeDays })),
      tickets: b.tickets,
      images: b.images || [],
    });
    return { ok: true, docNo };
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
    receiver?: string;
    canteenId?: number;
    date?: string;
    warehouseId?: string;
  }) {
    if (!b?.productId) throw new BadRequestException('productId required');
    if (!b?.qty || Number(b.qty) <= 0) throw new BadRequestException('qty must be > 0');
    const sid = b.schoolId !== undefined && b.schoolId !== null && String(b.schoolId).trim() !== '' ? Number(b.schoolId) : 1;
    // Normalize date to YYYY-MM-DD (date-only)
    const at = (() => {
      if (b.date) {
        const d = new Date(b.date);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    })();
    const r: Outbound = {
      id: 0 as any,
      productId: b.productId,
      qty: Number(b.qty),
      purpose: b.purpose,
      by: b.by,
      warehouseId: b.warehouseId,
      at: at,
      source: 'manual',
    };
    // Server-side guard: ensure enough stock remains (FIFO-based)
    return this.listOutboundBatches({ schoolId: sid, productId: b.productId, canteenId: b.canteenId }).then((batches) => {
      const totalRemain = (batches as any[]).reduce((s, it) => s + Number(it.remain || 0), 0);
      if (r.qty > totalRemain) throw new BadRequestException('insufficient stock');
      return this.repo!.insertOutbound({ schoolId: sid, canteenId: b.canteenId, receiver: b.receiver, ...r }).then((insertId) => {
        const rec = { ...r, id: insertId };
        this.emit('out-created', rec);
        return rec;
      });
    });
  }
  scaleOutbound(b: {
    schoolId?: number | string;
    productId: string;
    weight: number;
    purpose?: string;
    by?: string;
    receiver?: string;
    canteenId?: number;
    warehouseId?: string;
  }) {
    return this.createOutbound({
      schoolId: b.schoolId,
      productId: b.productId,
      qty: b.weight,
      purpose: b.purpose,
      by: b.by,
      receiver: b.receiver,
      canteenId: b.canteenId,
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
  private fmtDay(d?: Date | string | null) {
    if (!d) return '';
    const dt = typeof d === 'string' ? new Date(d) : d;
    const pad = (n: number) => String(n).padStart(2, '0');
    return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate());
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

  // Batch-level stock listing with status and expiry
  private addDays(dateISO?: string, days?: number) {
    if (!dateISO || !Number.isFinite(Number(days))) return undefined as any;
    const d = new Date(dateISO);
    d.setDate(d.getDate() + Number(days));
    return d;
  }
  private statusByExpire(expireAt?: Date) {
    if (!expireAt) return '正常';
    const today = new Date();
    today.setHours(0,0,0,0);
    const diffDays = Math.ceil((expireAt.getTime() - today.getTime())/86400000);
    if (diffDays < 0) return '过期';
    if (diffDays <= 7) return '临期';
    return '正常';
  }
  async listBatchStock(params: { schoolId: number | string; near?: 'true'|'false' }) {
    const sid = params.schoolId !== undefined && params.schoolId !== null && String(params.schoolId).trim() !== '' ? Number(params.schoolId) : 1;
    const list = await this.repo!.listBatchStock(sid);
    const mapped = list.map((r: any) => {
      const expireDate = this.addDays(r.prodDate ? String(r.prodDate) : undefined, r.shelfLifeDays ?? undefined);
      const expire = expireDate ? this.fmtDay(expireDate) : undefined;
      const status = this.statusByExpire(expireDate as any);
      return {
        productId: r.productId,
        productName: r.productName,
        unit: r.unit || '',
        batchNo: r.docNo || `IN-${r.inboundId}`,
        inboundId: r.inboundId,
        qty: Number(r.qty || 0),
        prodDate: r.prodDate ? this.fmtDay(r.prodDate) : undefined,
        expireAt: expire,
        status,
      };
    });
    const filtered = params.near === 'true' ? mapped.filter((x: any) => x.status === '临期') : mapped;
    return filtered;
  }
  async stocktakeBatch(b: { schoolId?: number | string; inboundId: number | string; actualQty: number; operator?: string }) {
    if (!b?.inboundId || !Number.isFinite(Number(b.inboundId))) throw new BadRequestException('inboundId required');
    const inbound = await this.repo!.getInboundById(b.inboundId);
    if (!inbound) throw new BadRequestException('batch not found');
    const sid = b.schoolId !== undefined && b.schoolId !== null && String(b.schoolId).trim() !== '' ? Number(b.schoolId) : Number(inbound.schoolId || 1);
    // Compute current remain for this inbound via FIFO
    const fifo = await this.repo!.listInboundFifoBatches({ schoolId: sid, productId: inbound.productId });
    const found = (fifo as any[]).find((x) => Number(x.inboundId) === Number(b.inboundId));
    const prevRemain = Number(found?.remain || 0);
    const actual = Number(b.actualQty);
    const diff = actual - prevRemain;
    if (diff === 0) return { ok: true, unchanged: true } as any;
    const newQty = Number(inbound.qty || 0) + diff;
    if (newQty < 0) throw new BadRequestException('invalid stocktake adjustment');
    await this.repo!.updateInboundQty(b.inboundId, newQty);
    await this.repo!.insertStocktake({ schoolId: sid, inboundId: Number(b.inboundId), productId: Number(inbound.productId), prevQty: prevRemain, actualQty: actual, diff, operator: b.operator });
    return { ok: true, diff } as any;
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
