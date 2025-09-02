import { Injectable } from '@nestjs/common';
import { DbService } from '../modules/db.service';

@Injectable()
export class InventoryRepository {
  constructor(private readonly db: DbService) {}

  // Categories
  async insertCategory(id: string, name: string) {
    await this.db.query('insert ignore into inv_categories(id, name) values(?,?)', [id, name]);
  }
  async listCategories() {
    const { rows } = await this.db.query<any>('select id, name from inv_categories order by name');
    return rows as Array<{ id: string; name: string }>;
  }

  // Products
  async insertProduct(id: string, name: string, unit: string, categoryId?: string) {
    await this.db.query(
      'insert ignore into inv_products(id, name, unit, category_id) values(?,?,?,?)',
      [id, name, unit, categoryId || null],
    );
  }
  async listProducts() {
    const { rows } = await this.db.query<any>(
      'select id, name, unit, category_id as categoryId from inv_products order by id desc',
    );
    return rows as Array<{ id: string; name: string; unit: string; categoryId?: string }>;
  }

  // Suppliers
  async insertSupplier(s: {
    id: string; name: string; phone?: string; license?: string; address?: string; contact?: string; email?: string;
    enabled?: boolean; rating?: number; categories?: string[]; licenseExpireAt?: string; licenseImageUrl?: string; deleted?: boolean;
  }) {
    await this.db.query(
      `insert ignore into inv_suppliers(id, name, phone, license, address, contact, email, enabled, rating, categories, license_expire_at, license_image_url, deleted)
       values(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        s.id, s.name, s.phone || null, s.license || null, s.address || null, s.contact || null, s.email || null,
        s.enabled ?? true, s.rating ?? null, JSON.stringify(s.categories || []), s.licenseExpireAt || null, s.licenseImageUrl || null,
        s.deleted ? 1 : 0,
      ],
    );
  }
  async updateSupplier(id: string, patch: Partial<Record<string, any>>) {
    const fields: string[] = [];
    const values: any[] = [];
    const map: Record<string, string> = {
      name: 'name', phone: 'phone', license: 'license', address: 'address', contact: 'contact', email: 'email', enabled: 'enabled', rating: 'rating',
      categories: 'categories', licenseExpireAt: 'license_expire_at', licenseImageUrl: 'license_image_url', deleted: 'deleted',
    };
    for (const k of Object.keys(patch)) {
      const col = map[k]; if (!col) continue;
      fields.push(`${col} = ?`);
      let v: any = (patch as any)[k];
      if (k === 'categories') v = JSON.stringify(v || []);
      if (k === 'deleted') v = v ? 1 : 0;
      values.push(v);
    }
    if (!fields.length) return;
    values.push(id);
    await this.db.query(`update inv_suppliers set ${fields.join(', ')} where id = ?`, values);
  }
  async getSupplierById(id: string) {
    const { rows } = await this.db.query<any>(
      `select id, name, phone, license, address, contact, email, enabled, rating, categories, license_expire_at as licenseExpireAt, license_image_url as licenseImageUrl, deleted
       from inv_suppliers where id = ? limit 1`,
      [id],
    );
    if (!rows[0]) return null;
    const r = rows[0];
    if (typeof r.categories === 'string') {
      try { r.categories = JSON.parse(r.categories); } catch { r.categories = []; }
    }
    return r;
  }
  async listSuppliers(filters: { q?: string; enabled?: boolean; page: number; pageSize: number }) {
    const where: string[] = ['deleted = 0'];
    const values: any[] = [];
    if (typeof filters.enabled === 'boolean') { where.push('enabled = ?'); values.push(filters.enabled ? 1 : 0); }
    if (filters.q) {
      where.push('(name like ? or phone like ? or license like ?)');
      const like = `%${filters.q}%`;
      values.push(like, like, like);
    }
    const base = `from inv_suppliers where ${where.join(' and ')}`;
    const totalRows = await this.db.query<any>(`select count(1) as c ${base}`, values);
    const total = Number(totalRows.rows[0]?.c || 0);
    const rows = await this.db.query<any>(
      `select id, name, phone, license, address, contact, email, enabled, rating, categories, license_expire_at as licenseExpireAt, license_image_url as licenseImageUrl, deleted ${base}
       order by id desc limit ? offset ?`,
      [...values, filters.pageSize, (filters.page - 1) * filters.pageSize],
    );
    const items = rows.rows.map((r: any) => ({
      ...r,
      categories: (() => { try { return JSON.parse(r.categories || '[]'); } catch { return []; } })(),
    }));
    return { items, total, page: filters.page, pageSize: filters.pageSize };
  }
  async batchEnableSuppliers(ids: string[], enabled: boolean) {
    if (!ids.length) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const { rows } = await this.db.query<any>(
      `update inv_suppliers set enabled = ? where id in (${placeholders})`,
      [enabled ? 1 : 0, ...ids],
    );
    return (rows as any).affectedRows ?? 0;
  }

  // Warehouses
  async insertWarehouse(w: { id: string; name: string; location?: string; capacity?: number; deleted?: boolean }) {
    await this.db.query(
      'insert ignore into inv_warehouses(id, name, location, capacity, deleted) values(?,?,?,?,?)',
      [w.id, w.name, w.location || null, w.capacity ?? null, w.deleted ? 1 : 0],
    );
  }
  async updateWarehouse(id: string, patch: Partial<Record<string, any>>) {
    const fields: string[] = [];
    const values: any[] = [];
    const map: Record<string, string> = { name: 'name', location: 'location', capacity: 'capacity', deleted: 'deleted' };
    for (const k of Object.keys(patch)) {
      const col = map[k]; if (!col) continue;
      fields.push(`${col} = ?`);
      let v: any = (patch as any)[k];
      if (k === 'deleted') v = v ? 1 : 0;
      values.push(v);
    }
    if (!fields.length) return;
    values.push(id);
    await this.db.query(`update inv_warehouses set ${fields.join(', ')} where id = ?`, values);
  }
  async listWarehouses() {
    const { rows } = await this.db.query<any>(
      'select id, name, location, capacity, deleted from inv_warehouses where deleted = 0 order by id desc',
    );
    return rows as Array<{ id: string; name: string; location?: string; capacity?: number; deleted?: number }>;
  }

  // Inbound/Outbound
  async insertInbound(r: { id: string; productId: string; qty: number; supplierId?: string; warehouseId?: string; imageUrl?: string; at: string; source: string }) {
    await this.db.query(
      'insert ignore into inv_inbound(id, product_id, qty, supplier_id, warehouse_id, image_url, at, source) values(?,?,?,?,?,?,?,?)',
      [r.id, r.productId, r.qty, r.supplierId || null, r.warehouseId || null, r.imageUrl || null, new Date(r.at), r.source],
    );
  }
  async insertOutbound(r: { id: string; productId: string; qty: number; purpose?: string; by?: string; warehouseId?: string; at: string; source: string }) {
    await this.db.query(
      'insert ignore into inv_outbound(id, product_id, qty, purpose, by_who, warehouse_id, at, source) values(?,?,?,?,?,?,?,?)',
      [r.id, r.productId, r.qty, r.purpose || null, r.by || null, r.warehouseId || null, new Date(r.at), r.source],
    );
  }
  async listInbound() {
    const { rows } = await this.db.query<any>(
      `select id, product_id as productId, qty, supplier_id as supplierId, warehouse_id as warehouseId, image_url as imageUrl, at, source
       from inv_inbound order by at desc`,
    );
    return rows;
  }
  async listOutbound() {
    const { rows } = await this.db.query<any>(
      `select id, product_id as productId, qty, purpose, by_who as \`by\`, warehouse_id as warehouseId, at, source
       from inv_outbound order by at desc`,
    );
    return rows;
  }
  async getStock() {
    const inbound = await this.db.query<any>(
      'select product_id as productId, sum(qty) as qty from inv_inbound group by product_id',
    );
    const outbound = await this.db.query<any>(
      'select product_id as productId, sum(qty) as qty from inv_outbound group by product_id',
    );
    const map = new Map<string, number>();
    for (const r of inbound.rows) map.set(r.productId, (map.get(r.productId) || 0) + Number(r.qty || 0));
    for (const r of outbound.rows) map.set(r.productId, (map.get(r.productId) || 0) - Number(r.qty || 0));
    return Array.from(map.entries()).map(([productId, qty]) => ({ productId, qty }));
  }

  // Tickets
  async insertTicket(t: { id: string; productId: string; type: string; imageUrl?: string; at: string }) {
    await this.db.query('insert ignore into inv_tickets(id, product_id, type, image_url, at) values(?,?,?,?,?)', [
      t.id, t.productId, t.type, t.imageUrl || null, new Date(t.at),
    ]);
  }
  async listTickets() {
    const { rows } = await this.db.query<any>(
      'select id, product_id as productId, type, image_url as imageUrl, at from inv_tickets order by at desc',
    );
    return rows;
  }

  // Additives
  async insertAdditive(a: { id: string; name: string; amount: number; dish?: string; by?: string; at: string }) {
    await this.db.query('insert ignore into inv_additives(id, name, amount, dish, by_who, at) values(?,?,?,?,?,?)', [
      a.id, a.name, a.amount, a.dish || null, a.by || null, new Date(a.at),
    ]);
  }
  async listAdditives() {
    const { rows } = await this.db.query<any>(
      'select id, name, amount, dish, by_who as \`by\`, at from inv_additives order by at desc',
    );
    return rows;
  }
}
