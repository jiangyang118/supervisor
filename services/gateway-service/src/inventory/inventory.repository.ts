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
  private async ensureSupplierCertificatesTable() {
    try {
      await this.db.query(
        `create table if not exists supplier_certificates (
           id int primary key auto_increment,
           supplier_id int not null,
           type varchar(64) not null,
           number varchar(128) null,
           authority varchar(255) null,
           expire_at datetime null,
           image_url varchar(255) null,
           created_at datetime not null default current_timestamp,
           key idx_sup_cert_supplier (supplier_id),
           key idx_sup_cert_type (type),
           key idx_sup_cert_expire (expire_at)
         )`,
      );
    } catch {}
  }

  async insertSupplierCertificate(c: { supplierId: number; type: string; number?: string; authority?: string; expireAt?: string; imageUrl?: string }) {
    await this.ensureSupplierCertificatesTable();
    await this.db.query(
      `insert into supplier_certificates(supplier_id, type, number, authority, expire_at, image_url)
       values(?,?,?,?,?,?)`,
      [c.supplierId, c.type, c.number || null, c.authority || null, c.expireAt ? new Date(c.expireAt) : null, c.imageUrl || null],
    );
  }

  async listInboundBySupplier(supplierId: number | string) {
    const { rows } = await this.db.query<any>(
      `select id, product_id as productId, qty, at, source from inv_inbound where supplier_id = ? order by at desc limit 200`,
      [supplierId],
    );
    return rows as Array<{ id: number; productId: number; qty: number; at: string; source: string }>;
  }

  async listSupplierProducts(supplierId: number | string) {
    const { rows } = await this.db.query<any>(
      `select distinct p.id, p.name, p.unit
         from inv_inbound i join inv_products p on p.id = i.product_id
        where i.supplier_id = ?
        order by p.name asc limit 200`,
      [supplierId],
    );
    return rows as Array<{ id: number; name: string; unit: string }>;
  }

  async listSupplierCertificates(supplierId: number | string) {
    await this.ensureSupplierCertificatesTable();
    const { rows } = await this.db.query<any>(
      `select type, number, authority, expire_at as expireAt, image_url as imageUrl
         from supplier_certificates where supplier_id = ?
        order by coalesce(expire_at, '1970-01-01') desc, id desc`,
      [supplierId],
    );
    return rows as Array<{ type: string; number?: string; authority?: string; expireAt?: string; imageUrl?: string }>;
  }
  async listCategories(schoolId?: number | string) {
    const where = schoolId ? 'where school_id = ?' : '';
    const params = schoolId ? [schoolId] : [];
    const { rows } = await this.db.query<any>(`select id, name from inv_categories ${where} order by name`, params);
    return rows as Array<{ id: number; name: string }>;
  }

  // Products
  async insertProduct(schoolId: number, name: string, unit: string, categoryId?: number) {
    // legacy signature kept for compatibility (categoryId is unused after schema change)
    const res = await this.db.query(
      'insert into inv_products(school_id, name, unit) values(?,?,?)',
      [schoolId, name, unit],
    );
    return res.insertId || 0;
  }
  async listProducts(schoolId?: number | string) {
    const where = schoolId ? 'where school_id = ?' : '';
    const params = schoolId ? [schoolId] : [];
    const { rows } = await this.db.query<any>(
      `select id, school_id as schoolId, name, unit, category, spec, last_price as lastPrice from inv_products ${where} ${where ? 'and' : 'where'} deleted = 0 order by id desc`,
      params,
    );
    return rows as Array<{ id: number; schoolId: number; name: string; unit: string; category?: string; spec?: string; lastPrice?: number }>;
  }
  async insertProductV2(row: { schoolId: number; name: string; unit: string; category?: string; spec?: string; lastPrice?: number }) {
    const res = await this.db.query(
      `insert into inv_products(school_id, name, unit, category, spec, last_price) values(?,?,?,?,?,?)`,
      [row.schoolId, row.name, row.unit, row.category || null, row.spec || null, row.lastPrice ?? null],
    );
    return res.insertId || 0;
  }
  async updateProduct(id: number, patch: Partial<{ name: string; unit: string; category?: string; spec?: string; lastPrice?: number }>) {
    const sets: string[] = [];
    const args: any[] = [];
    const map: Record<string, string> = { name: 'name', unit: 'unit', category: 'category', spec: 'spec', lastPrice: 'last_price' };
    for (const k of Object.keys(patch)) {
      const col = map[k]; if (!col) continue; sets.push(`${col} = ?`); args.push((patch as any)[k]);
    }
    if (!sets.length) return { ok: true } as any;
    args.push(id);
    await this.db.query(`update inv_products set ${sets.join(', ')} where id = ?`, args);
    return { ok: true } as any;
  }
  async softDelete(id: number) { await this.db.query('update inv_products set deleted = 1 where id = ?', [id]); return { ok: true } as any; }

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
  async updateSupplier(id: string | number, patch: Partial<Record<string, any>>) {
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
      `select id, school_id as schoolId, name, phone, license, address, contact, email, enabled, rating, categories, license_expire_at as licenseExpireAt, license_image_url as licenseImageUrl, deleted
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
  async existsSupplierName(schoolId: number | string, name: string, excludeId?: number | string) {
    const where: string[] = ['deleted = 0', 'school_id = ?', 'name = ?'];
    const args: any[] = [schoolId, name];
    if (excludeId !== undefined && excludeId !== null) { where.push('id <> ?'); args.push(excludeId); }
    const { rows } = await this.db.query<any>(`select count(1) as c from inv_suppliers where ${where.join(' and ')}`, args);
    return Number(rows?.[0]?.c || 0) > 0;
  }
  async listSuppliers(filters: { schoolId?: number | string; q?: string; enabled?: boolean; expired?: boolean; expireStart?: string; expireEnd?: string; page: number; pageSize: number }) {
    const where: string[] = ['deleted = 0'];
    const values: any[] = [];
    if (filters.schoolId !== undefined && filters.schoolId !== null) { where.push('school_id = ?'); values.push(filters.schoolId); }
    if (typeof filters.enabled === 'boolean') { where.push('enabled = ?'); values.push(filters.enabled ? 1 : 0); }
    if (filters.q) {
      where.push('(name like ? or phone like ? or license like ?)');
      const like = `%${filters.q}%`;
      values.push(like, like, like);
    }
    if (filters.expired === true) { where.push('license_expire_at is not null and license_expire_at < now()'); }
    if (filters.expired === false) { where.push('(license_expire_at is null or license_expire_at >= now())'); }
    if (filters.expireStart) { where.push('license_expire_at >= ?'); values.push(new Date(filters.expireStart)); }
    if (filters.expireEnd) { where.push('license_expire_at <= ?'); values.push(new Date(filters.expireEnd)); }
    // Prefer joined view with supplier_certificates; fallback gracefully if table is missing
    try {
      const base = `from (
          select s.*,
                 coalesce(bl.number, s.license) as license_joined,
                 coalesce(bl.expire_at, s.license_expire_at) as license_expire_joined,
                 fd.number as food_license_joined,
                 fd.expire_at as food_expire_joined,
                 qc.number as qc_number,
                 qc.expire_at as qc_expire,
                 an.number as animal_number,
                 an.expire_at as animal_expire
            from inv_suppliers s
            left join (
              select sc1.supplier_id, sc1.number, sc1.expire_at
                from supplier_certificates sc1
                join (
                  select supplier_id, max(expire_at) as max_expire
                    from supplier_certificates
                   where type = '营业执照'
                   group by supplier_id
                ) mx on mx.supplier_id = sc1.supplier_id and sc1.expire_at = mx.max_expire
                join (
                  select supplier_id, expire_at, min(id) as min_id
                    from supplier_certificates
                   where type = '营业执照'
                   group by supplier_id, expire_at
                ) pick on pick.supplier_id = sc1.supplier_id and pick.expire_at = sc1.expire_at and pick.min_id = sc1.id
               where sc1.type = '营业执照'
            ) bl on bl.supplier_id = s.id
            left join (
              select sc2.supplier_id, sc2.number, sc2.expire_at
                from supplier_certificates sc2
                join (
                  select supplier_id, max(expire_at) as max_expire
                    from supplier_certificates
                   where type in ('食品生产许可证','食品经营许可证')
                   group by supplier_id
                ) mx2 on mx2.supplier_id = sc2.supplier_id and sc2.expire_at = mx2.max_expire
                join (
                  select supplier_id, expire_at, min(id) as min_id
                    from supplier_certificates
                   where type in ('食品生产许可证','食品经营许可证')
                   group by supplier_id, expire_at
                ) pick2 on pick2.supplier_id = sc2.supplier_id and pick2.expire_at = sc2.expire_at and pick2.min_id = sc2.id
               where sc2.type in ('食品生产许可证','食品经营许可证')
            ) fd on fd.supplier_id = s.id
            left join (
              select sc3.supplier_id, sc3.number, sc3.expire_at
                from supplier_certificates sc3
                join (
                  select supplier_id, max(expire_at) as max_expire
                    from supplier_certificates
                   where type = '质检报告'
                   group by supplier_id
                ) mx3 on mx3.supplier_id = sc3.supplier_id and sc3.expire_at = mx3.max_expire
                join (
                  select supplier_id, expire_at, min(id) as min_id
                    from supplier_certificates
                   where type = '质检报告'
                   group by supplier_id, expire_at
                ) pick3 on pick3.supplier_id = sc3.supplier_id and pick3.expire_at = sc3.expire_at and pick3.min_id = sc3.id
               where sc3.type = '质检报告'
            ) qc on qc.supplier_id = s.id
            left join (
              select sc4.supplier_id, sc4.number, sc4.expire_at
                from supplier_certificates sc4
                join (
                  select supplier_id, max(expire_at) as max_expire
                    from supplier_certificates
                   where type = '动物检疫合格证'
                   group by supplier_id
                ) mx4 on mx4.supplier_id = sc4.supplier_id and sc4.expire_at = mx4.max_expire
                join (
                  select supplier_id, expire_at, min(id) as min_id
                    from supplier_certificates
                   where type = '动物检疫合格证'
                   group by supplier_id, expire_at
                ) pick4 on pick4.supplier_id = sc4.supplier_id and pick4.expire_at = sc4.expire_at and pick4.min_id = sc4.id
               where sc4.type = '动物检疫合格证'
            ) an on an.supplier_id = s.id
        ) inv
        where ${where.map(w => w.replace(/\b(license|license_expire_at)\b/g, (m)=> m==='license'?'license_joined':'license_expire_joined')).join(' and ')}`;
      const totalRows = await this.db.query<any>(`select count(1) as c ${base}`, values);
      const total = Number(totalRows.rows[0]?.c || 0);
      const rows = await this.db.query<any>(
        `select id, name, phone, license_joined as license, address, contact, email, enabled, rating, categories, license_expire_joined as licenseExpireAt, license_image_url as licenseImageUrl, deleted,
                food_license_joined as foodLicense, food_expire_joined as foodLicenseExpireAt,
                qc_number as qcNumber, qc_expire as qcExpireAt,
                animal_number as animalNumber, animal_expire as animalExpireAt ${base}
         order by id desc limit ? offset ?`,
        [...values, filters.pageSize, (filters.page - 1) * filters.pageSize],
      );
      const items = rows.rows.map((r: any) => ({
        ...r,
        categories: (() => { try { return JSON.parse(r.categories || '[]'); } catch { return []; } })(),
      }));
      return { items, total, page: filters.page, pageSize: filters.pageSize };
    } catch (e) {
      // Fallback to original schema (no certificates table)
      const legacyBase = `from inv_suppliers where ${where.join(' and ')}`;
      const totalRows = await this.db.query<any>(`select count(1) as c ${legacyBase}`, values);
      const total = Number(totalRows.rows[0]?.c || 0);
      const rows = await this.db.query<any>(
        `select id, name, phone, license, address, contact, email, enabled, rating, categories, license_expire_at as licenseExpireAt, license_image_url as licenseImageUrl, deleted,
                null as foodLicense, null as foodLicenseExpireAt,
                null as qcNumber, null as qcExpireAt,
                null as animalNumber, null as animalExpireAt ${legacyBase}
         order by id desc limit ? offset ?`,
        [...values, filters.pageSize, (filters.page - 1) * filters.pageSize],
      );
      const items = rows.rows.map((r: any) => ({
        ...r,
        categories: (() => { try { return JSON.parse(r.categories || '[]'); } catch { return []; } })(),
      }));
      return { items, total, page: filters.page, pageSize: filters.pageSize };
    }
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
