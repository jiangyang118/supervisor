import { Injectable } from '@nestjs/common';
import { DbService } from '../modules/db.service';

@Injectable()
export class InventoryRepository {
  constructor(private readonly db: DbService) {}

  // Categories
  async insertCategory(schoolId: number, name: string) {
    const res = await this.db.query('insert into inv_categories(school_id, name) values(?,?)', [schoolId, name]);
    return res.insertId || 0;
  }
  async listCategories(schoolId?: number | string) {
    const where = schoolId ? 'where school_id = ?' : '';
    const params = schoolId ? [schoolId] : [];
    const { rows } = await this.db.query<any>(`select id, name from inv_categories ${where} order by name`, params);
    return rows as Array<{ id: number; name: string }>;
  }

  // Products
  async insertProduct(schoolId: number, name: string, unit: string, categoryId?: number) {
    const res = await this.db.query(
      'insert into inv_products(school_id, name, unit, category_id) values(?,?,?,?)',
      [schoolId, name, unit, categoryId || null],
    );
    return res.insertId || 0;
  }
  async listProducts(schoolId?: number | string) {
    const where = schoolId ? 'where school_id = ?' : '';
    const params = schoolId ? [schoolId] : [];
    const { rows } = await this.db.query<any>(
      `select id, name, unit, category_id as categoryId from inv_products ${where} order by id desc`,
      params,
    );
    return rows as Array<{ id: number; name: string; unit: string; categoryId?: number }>;
  }

  // Suppliers
  async insertSupplier(s: {
    schoolId: number; name: string; phone?: string; license?: string; address?: string; contact?: string; email?: string;
    enabled?: boolean; rating?: number; categories?: string[]; licenseExpireAt?: string; licenseImageUrl?: string; deleted?: boolean;
  }) {
    const res = await this.db.query(
      `insert into inv_suppliers(school_id, name, phone, license, address, contact, email, enabled, rating, categories, license_expire_at, license_image_url, deleted)
       values(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        s.schoolId, s.name, s.phone || null, s.license || null, s.address || null, s.contact || null, s.email || null,
        s.enabled ?? true, s.rating ?? null, JSON.stringify(s.categories || []), s.licenseExpireAt || null, s.licenseImageUrl || null,
        s.deleted ? 1 : 0,
      ],
    );
    return res.insertId || 0;
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
  async getSupplierById(id: number | string) {
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
  async listSuppliers(filters: { schoolId?: number | string; q?: string; enabled?: boolean; page: number; pageSize: number }) {
    const where: string[] = ['deleted = 0'];
    const values: any[] = [];
    if (filters.schoolId !== undefined && filters.schoolId !== null) { where.push('school_id = ?'); values.push(filters.schoolId); }
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
  async batchEnableSuppliers(ids: Array<number | string>, enabled: boolean) {
    if (!ids.length) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const { rows } = await this.db.query<any>(
      `update inv_suppliers set enabled = ? where id in (${placeholders})`,
      [enabled ? 1 : 0, ...ids],
    );
    return (rows as any).affectedRows ?? 0;
  }

  // Warehouses
  async insertWarehouse(w: { schoolId: number; name: string; location?: string; capacity?: number; deleted?: boolean }) {
    const res = await this.db.query(
      'insert into inv_warehouses(school_id, name, location, capacity, deleted) values(?,?,?,?,?)',
      [w.schoolId, w.name, w.location || null, w.capacity ?? null, w.deleted ? 1 : 0],
    );
    return res.insertId || 0;
  }
  async updateWarehouse(id: number | string, patch: Partial<Record<string, any>>) {
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
  async listWarehouses(schoolId?: number | string) {
    const where = schoolId ? 'where deleted = 0 and school_id = ?' : 'where deleted = 0';
    const params = schoolId ? [schoolId] : [];
    const { rows } = await this.db.query<any>(
      `select id, name, location, capacity, deleted from inv_warehouses ${where} order by id desc`,
      params,
    );
    return rows as Array<{ id: number; name: string; location?: string; capacity?: number; deleted?: number }>;
  }

  // Inbound/Outbound
  async insertInbound(r: { schoolId: number; productId: string; qty: number; supplierId?: string; warehouseId?: string; imageUrl?: string; at: string; source: string }) {
    const res = await this.db.query(
      'insert into inv_inbound(school_id, product_id, qty, supplier_id, warehouse_id, image_url, at, source) values(?,?,?,?,?,?,?,?)',
      [r.schoolId, r.productId, r.qty, r.supplierId || null, r.warehouseId || null, r.imageUrl || null, new Date(r.at), r.source],
    );
    return res.insertId || 0;
  }
  async insertOutbound(r: { schoolId: number; productId: string; qty: number; purpose?: string; by?: string; warehouseId?: string; at: string; source: string }) {
    const res = await this.db.query(
      'insert into inv_outbound(school_id, product_id, qty, purpose, by_who, warehouse_id, at, source) values(?,?,?,?,?,?,?,?)',
      [r.schoolId, r.productId, r.qty, r.purpose || null, r.by || null, r.warehouseId || null, new Date(r.at), r.source],
    );
    return res.insertId || 0;
  }
  async listInbound(schoolId?: number | string) {
    const where = schoolId ? 'where school_id = ?' : '';
    const params = schoolId ? [schoolId] : [];
    const { rows } = await this.db.query<any>(
      `select id, product_id as productId, qty, supplier_id as supplierId, warehouse_id as warehouseId, image_url as imageUrl, at, source
       from inv_inbound ${where} order by at desc`,
      params,
    );
    return rows;
  }
  async listOutbound(schoolId?: number | string) {
    const where = schoolId ? 'where school_id = ?' : '';
    const params = schoolId ? [schoolId] : [];
    const { rows } = await this.db.query<any>(
      `select id, product_id as productId, qty, purpose, by_who as \`by\`, warehouse_id as warehouseId, at, source
       from inv_outbound ${where} order by at desc`,
      params,
    );
    return rows;
  }
  async getStock(schoolId?: number | string) {
    const whereIn = schoolId ? 'where school_id = ?' : '';
    const params = schoolId ? [schoolId] : [];
    const inbound = await this.db.query<any>(
      `select product_id as productId, sum(qty) as qty, max(at) as latest from inv_inbound ${whereIn} group by product_id`,
      params,
    );
    const outbound = await this.db.query<any>(
      `select product_id as productId, sum(qty) as qty, max(at) as latest from inv_outbound ${whereIn} group by product_id`,
      params,
    );
    const qtyMap = new Map<string, number>();
    const timeMap = new Map<string, Date | string>();
    for (const r of inbound.rows) {
      qtyMap.set(r.productId, (qtyMap.get(r.productId) || 0) + Number(r.qty || 0));
      const t = r.latest as Date;
      const prev = timeMap.get(r.productId) as Date | undefined;
      if (!prev || (t && new Date(t).getTime() > new Date(prev).getTime())) timeMap.set(r.productId, t);
    }
    for (const r of outbound.rows) {
      qtyMap.set(r.productId, (qtyMap.get(r.productId) || 0) - Number(r.qty || 0));
      const t = r.latest as Date;
      const prev = timeMap.get(r.productId) as Date | undefined;
      if (!prev || (t && new Date(t).getTime() > new Date(prev).getTime())) timeMap.set(r.productId, t);
    }
    return Array.from(qtyMap.entries()).map(([productId, qty]) => ({ productId, qty, updatedAt: timeMap.get(productId) || null }));
  }

  // Tickets
  async insertTicket(t: { schoolId: number; productId: string; type: string; imageUrl?: string; at: string }) {
    const res = await this.db.query('insert into inv_tickets(school_id, product_id, type, image_url, at) values(?,?,?,?,?)', [
      t.schoolId, t.productId, t.type, t.imageUrl || null, new Date(t.at),
    ]);
    return res.insertId || 0;
  }
  async listTickets(schoolId?: number | string) {
    const where = schoolId ? 'where school_id = ?' : '';
    const params = schoolId ? [schoolId] : [];
    const { rows } = await this.db.query<any>(
      `select id, product_id as productId, type, image_url as imageUrl, at from inv_tickets ${where} order by at desc`,
      params,
    );
    return rows;
  }

  // Additives
  async insertAdditive(a: { schoolId: number; name: string; amount: number; dish?: string; by?: string; at: string }) {
    const res = await this.db.query('insert into inv_additives(school_id, name, amount, dish, by_who, at) values(?,?,?,?,?,?)', [
      a.schoolId, a.name, a.amount, a.dish || null, a.by || null, new Date(a.at),
    ]);
    return res.insertId || 0;
  }
  async listAdditives(schoolId?: number | string) {
    const where = schoolId ? 'where school_id = ?' : '';
    const params = schoolId ? [schoolId] : [];
    const { rows } = await this.db.query<any>(
      `select id, name, amount, dish, by_who as \`by\`, at from inv_additives ${where} order by at desc`,
      params,
    );
    return rows;
  }
}
