import { Injectable, MessageEvent, BadRequestException } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export type EntityType = 'canteen' | 'worker' | 'supplier';

export type Canteen = { id: string; name: string; address?: string; licenseExpireAt: string };
export type Worker = { id: string; name: string; role?: string; healthCertExpireAt: string };
export type CredSupplier = { id: string; name: string; phone?: string; licenseExpireAt: string };

export type ExceptionRecord = {
  id: string;
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

  constructor() { this.seed(); }

  private id(prefix: string){ return `${prefix}-${String(this.seq++).padStart(4,'0')}`; }
  private now(){ return new Date().toISOString(); }
  private emit(type: string, data: any){ this.events$.next({ type, data }); }

  private isExpired(dateISO: string){ try { return new Date(dateISO).getTime() < Date.now(); } catch { return false; } }

  private upsertException(e: ExceptionRecord){
    const idx = this.exceptions.findIndex(x => x.type===e.type && x.entityId===e.entityId);
    if (idx === -1) this.exceptions.unshift(e); else this.exceptions[idx] = { ...this.exceptions[idx], ...e };
  }

  private removeException(type: EntityType, entityId: string){
    this.exceptions = this.exceptions.filter(x => !(x.type===type && x.entityId===entityId));
  }

  private recomputeExceptions(){
    for (const c of this.canteens){
      if (this.isExpired(c.licenseExpireAt)){
        this.upsertException({ id: this.id('EX'), type: 'canteen', entityId: c.id, entityName: c.name, certificateType: '食堂许可证', expireAt: c.licenseExpireAt, createdAt: this.now() });
      } else this.removeException('canteen', c.id);
    }
    for (const w of this.workers){
      if (this.isExpired(w.healthCertExpireAt)){
        this.upsertException({ id: this.id('EX'), type: 'worker', entityId: w.id, entityName: w.name, certificateType: '健康证', expireAt: w.healthCertExpireAt, createdAt: this.now() });
      } else this.removeException('worker', w.id);
    }
    for (const s of this.suppliers){
      if (this.isExpired(s.licenseExpireAt)){
        this.upsertException({ id: this.id('EX'), type: 'supplier', entityId: s.id, entityName: s.name, certificateType: '营业执照', expireAt: s.licenseExpireAt, createdAt: this.now() });
      } else this.removeException('supplier', s.id);
    }
  }

  listCanteens(){ this.recomputeExceptions(); return this.canteens; }
  createCanteen(b: { name: string; address?: string; licenseExpireAt: string }){
    if (!b?.name) throw new BadRequestException('name required');
    if (!b?.licenseExpireAt) throw new BadRequestException('licenseExpireAt required');
    const rec: Canteen = { id: this.id('CT'), ...b };
    this.canteens.unshift(rec); this.recomputeExceptions(); this.emit('canteen-created', rec); return rec;
  }

  listWorkers(){ this.recomputeExceptions(); return this.workers; }
  createWorker(b: { name: string; role?: string; healthCertExpireAt: string }){
    if (!b?.name) throw new BadRequestException('name required');
    if (!b?.healthCertExpireAt) throw new BadRequestException('healthCertExpireAt required');
    const rec: Worker = { id: this.id('WK'), ...b };
    this.workers.unshift(rec); this.recomputeExceptions(); this.emit('worker-created', rec); return rec;
  }

  listSuppliers(){ this.recomputeExceptions(); return this.suppliers; }
  createSupplier(b: { name: string; phone?: string; licenseExpireAt: string }){
    if (!b?.name) throw new BadRequestException('name required');
    if (!b?.licenseExpireAt) throw new BadRequestException('licenseExpireAt required');
    const rec: CredSupplier = { id: this.id('CSUP'), ...b };
    this.suppliers.unshift(rec); this.recomputeExceptions(); this.emit('supplier-created', rec); return rec;
  }

  listExceptions(params?: { type?: EntityType }){
    this.recomputeExceptions();
    const t = params?.type; return t ? this.exceptions.filter(e => e.type === t) : this.exceptions;
  }

  setMeasure(id: string, measure: string){
    const idx = this.exceptions.findIndex(e => e.id === id);
    if (idx === -1) return { ok: false };
    this.exceptions[idx].measure = measure; this.emit('exception-updated', this.exceptions[idx]);
    return { ok: true, record: this.exceptions[idx] };
  }

  stream(): Observable<MessageEvent> { setTimeout(()=>this.events$.next({ type: 'hello', data: { ok: true }}),0); return this.events$.asObservable(); }

  private seed(){
    const days = (n:number)=> new Date(Date.now() + n*86400000).toISOString().slice(0,10);
    this.createCanteen({ name: '示例一中食堂', address: '教学楼东侧', licenseExpireAt: days(-5) });
    this.createCanteen({ name: '示例二小食堂', address: '操场北侧', licenseExpireAt: days(30) });
    this.createWorker({ name: '张三', role: '后厨', healthCertExpireAt: days(-2) });
    this.createWorker({ name: '李四', role: '配菜', healthCertExpireAt: days(60) });
    this.createSupplier({ name: '示例供应商A', phone: '13800000000', licenseExpireAt: days(-1) });
    this.createSupplier({ name: '示例供应商B', phone: '13800000001', licenseExpireAt: days(90) });
  }
}

