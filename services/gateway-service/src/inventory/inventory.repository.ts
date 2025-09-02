import { Injectable } from '@nestjs/common';
import { DbService } from '../modules/db.service';

@Injectable()
export class InventoryRepository {
  constructor(private readonly db: DbService) {}

  // Categories
  async insertCategory(id: string, name: string) {
    await this.db.query('insert ignore into inv_categories(id, name) values(?,?)', [id, name]);
  }

  // Products
  async insertProduct(id: string, name: string, unit: string, categoryId?: string) {
    await this.db.query(
      'insert ignore into inv_products(id, name, unit, category_id) values(?,?,?,?)',
      [id, name, unit, categoryId || null],
    );
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

  // Tickets
  async insertTicket(t: { id: string; productId: string; type: string; imageUrl?: string; at: string }) {
    await this.db.query('insert ignore into inv_tickets(id, product_id, type, image_url, at) values(?,?,?,?,?)', [
      t.id, t.productId, t.type, t.imageUrl || null, new Date(t.at),
    ]);
  }

  // Additives
  async insertAdditive(a: { id: string; name: string; amount: number; dish?: string; by?: string; at: string }) {
    await this.db.query('insert ignore into inv_additives(id, name, amount, dish, by_who, at) values(?,?,?,?,?,?)', [
      a.id, a.name, a.amount, a.dish || null, a.by || null, new Date(a.at),
    ]);
  }
}
