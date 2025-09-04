import { Injectable, MessageEvent, BadRequestException } from '@nestjs/common';
import { DbService } from './db.service';
import { CanteensRepository } from './repositories/canteens.repository';
import { Observable, Subject } from 'rxjs';

export type EntityType = 'canteen' | 'worker' | 'supplier';

export type Canteen = {
  id: string;
  schoolId: string;
  name: string;
  address?: string;
  licenseExpireAt: string;
};
export type Worker = {
  id: string;
  schoolId: string;
  name: string;
  role?: string;
  healthCertExpireAt: string;
};
export type CredSupplier = {
  id: string;
  schoolId: string;
  name: string;
  phone?: string;
  licenseExpireAt: string;
};

export type ExceptionRecord = {
  id: string;
  schoolId: string;
  type: EntityType;
  entityId: string;
  entityName: string;
  certificateType: string;
  expireAt: string;
  measure?: string;
  createdAt: string;
};

@Injectable()
export class CredentialsService {
  private seq = 1;
  private events$ = new Subject<MessageEvent>();

  canteens: Canteen[] = [];
  workers: Worker[] = [];
  suppliers: CredSupplier[] = [];
  exceptions: ExceptionRecord[] = [];

  constructor(private readonly db: DbService, private readonly canteensRepo: CanteensRepository) {}

  private id(prefix: string) {
    return `${prefix}-${String(this.seq++).padStart(4, '0')}`;
  }
  private now() {
    return new Date().toISOString();
  }
  private emit(type: string, data: any) {
    this.events$.next({ type, data });
  }

  private isExpired(dateISO: string) {
    try {
      return new Date(dateISO).getTime() < Date.now();
    } catch {
      return false;
    }
  }

  private upsertException(e: ExceptionRecord) {
    const idx = this.exceptions.findIndex((x) => x.type === e.type && x.entityId === e.entityId);
    if (idx === -1) this.exceptions.unshift(e);
    else this.exceptions[idx] = { ...this.exceptions[idx], ...e };
  }

  private removeException(type: EntityType, entityId: string) {
    this.exceptions = this.exceptions.filter((x) => !(x.type === type && x.entityId === entityId));
  }

  private recomputeExceptions() {
    for (const c of this.canteens) {
      if (this.isExpired(c.licenseExpireAt)) {
        this.upsertException({
          id: this.id('EX'),
          schoolId: c.schoolId,
          type: 'canteen',
          entityId: c.id,
          entityName: c.name,
          certificateType: '食堂许可证',
          expireAt: c.licenseExpireAt,
          createdAt: this.now(),
        });
      } else this.removeException('canteen', c.id);
    }
    for (const w of this.workers) {
      if (this.isExpired(w.healthCertExpireAt)) {
        this.upsertException({
          id: this.id('EX'),
          schoolId: w.schoolId,
          type: 'worker',
          entityId: w.id,
          entityName: w.name,
          certificateType: '健康证',
          expireAt: w.healthCertExpireAt,
          createdAt: this.now(),
        });
      } else this.removeException('worker', w.id);
    }
    for (const s of this.suppliers) {
      if (this.isExpired(s.licenseExpireAt)) {
        this.upsertException({
          id: this.id('EX'),
          schoolId: s.schoolId,
          type: 'supplier',
          entityId: s.id,
          entityName: s.name,
          certificateType: '营业执照',
          expireAt: s.licenseExpireAt,
          createdAt: this.now(),
        });
      } else this.removeException('supplier', s.id);
    }
  }

  async listCanteens(params?: { schoolId?: string }) {
    const sid = params?.schoolId;
    if (this.db.isReady) {
      const schoolId = sid ? Number(sid) : undefined;
      const rows = await this.canteensRepo.list(schoolId);
      const items: Canteen[] = rows.map((r) => ({
        id: String(r.id),
        schoolId: String(r.schoolId),
        name: r.name,
        address: r.address || undefined,
        licenseExpireAt: r.licenseExpireAt || new Date().toISOString(),
      }));
      // compute exceptions from DB
      this.canteens = items;
      this.recomputeExceptions();
      return sid ? items.filter((c) => c.schoolId === sid) : items;
    }
    this.recomputeExceptions();
    return sid ? this.canteens.filter((c) => c.schoolId === sid) : this.canteens;
  }
  async createCanteen(b: { schoolId?: string; name: string; address?: string; licenseExpireAt: string }) {
    if (!b?.name) throw new BadRequestException('name required');
    if (!b?.licenseExpireAt) throw new BadRequestException('licenseExpireAt required');
    const schoolId = b.schoolId && Number.isFinite(Number(b.schoolId)) ? Number(b.schoolId) : 1;
    if (this.db.isReady) {
      const newId = await this.canteensRepo.create({
        schoolId,
        name: b.name,
        address: b.address,
        licenseExpireAt: b.licenseExpireAt,
      });
      const rec: Canteen = {
        id: String(newId),
        schoolId: String(schoolId),
        name: b.name,
        address: b.address,
        licenseExpireAt: b.licenseExpireAt,
      };
      this.canteens.unshift(rec);
      this.recomputeExceptions();
      this.emit('canteen-created', rec);
      return rec;
    }
    // fallback in-memory
    const rec: Canteen = {
      id: this.id('CT'),
      schoolId: b.schoolId || 'sch-001',
      name: b.name,
      address: b.address,
      licenseExpireAt: b.licenseExpireAt,
    };
    this.canteens.unshift(rec);
    this.recomputeExceptions();
    this.emit('canteen-created', rec);
    return rec;
  }

  listWorkers(params?: { schoolId?: string }) {
    this.recomputeExceptions();
    const sid = params?.schoolId;
    return sid ? this.workers.filter((w) => w.schoolId === sid) : this.workers;
  }
  createWorker(b: { schoolId?: string; name: string; role?: string; healthCertExpireAt: string }) {
    if (!b?.name) throw new BadRequestException('name required');
    if (!b?.healthCertExpireAt) throw new BadRequestException('healthCertExpireAt required');
    const rec: Worker = {
      id: this.id('WK'),
      schoolId: b.schoolId || 'sch-001',
      name: b.name,
      role: b.role,
      healthCertExpireAt: b.healthCertExpireAt,
    };
    this.workers.unshift(rec);
    this.recomputeExceptions();
    this.emit('worker-created', rec);
    return rec;
  }

  listSuppliers(params?: { schoolId?: string }) {
    this.recomputeExceptions();
    const sid = params?.schoolId;
    return sid ? this.suppliers.filter((s) => s.schoolId === sid) : this.suppliers;
  }
  createSupplier(b: { schoolId?: string; name: string; phone?: string; licenseExpireAt: string }) {
    if (!b?.name) throw new BadRequestException('name required');
    if (!b?.licenseExpireAt) throw new BadRequestException('licenseExpireAt required');
    const rec: CredSupplier = {
      id: this.id('CSUP'),
      schoolId: b.schoolId || 'sch-001',
      name: b.name,
      phone: b.phone,
      licenseExpireAt: b.licenseExpireAt,
    };
    this.suppliers.unshift(rec);
    this.recomputeExceptions();
    this.emit('supplier-created', rec);
    return rec;
  }

  listExceptions(params?: { type?: EntityType; schoolId?: string }) {
    this.recomputeExceptions();
    const t = params?.type;
    const sid = params?.schoolId;
    let arr = t ? this.exceptions.filter((e) => e.type === t) : [...this.exceptions];
    if (sid) arr = arr.filter((e) => e.schoolId === sid);
    return arr;
  }

  setMeasure(id: string, measure: string) {
    const idx = this.exceptions.findIndex((e) => e.id === id);
    if (idx === -1) return { ok: false };
    this.exceptions[idx].measure = measure;
    this.emit('exception-updated', this.exceptions[idx]);
    return { ok: true, record: this.exceptions[idx] };
  }

  stream(): Observable<MessageEvent> {
    setTimeout(() => this.events$.next({ type: 'hello', data: { ok: true } }), 0);
    return this.events$.asObservable();
  }


}
