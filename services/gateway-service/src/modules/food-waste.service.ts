import { Injectable, BadRequestException } from '@nestjs/common';
import { FoodWasteRepository } from './repositories/food-waste.repository';

export type WasteSource = '库存损耗' | '加工制作损耗' | '剩菜剩饭损耗';
export type ItemType = '食材' | '菜品';
export type Meal = '早餐' | '午餐' | '晚餐';

export type FoodWasteRecord = {
  id: string;
  schoolId: string;
  date: string; // ISO string
  source: WasteSource;
  itemType: ItemType;
  itemName: string;
  weightKg: number;
  amountYuan: number;
  reason?: string;
  meal?: Meal;
};

@Injectable()
export class FoodWasteService {
  private seq = 1;
  private id(p: string) {
    return `${p}-${String(this.seq++).padStart(4, '0')}`;
  }
  private now() {
    return new Date().toISOString();
  }

  private records: FoodWasteRecord[] = [];
  private reasons: { id: string; name: string; enabled: boolean }[] = [
    { id: 'fr-001', name: '存储不当变质', enabled: true },
    { id: 'fr-002', name: '切配与烹饪损耗', enabled: true },
    { id: 'fr-003', name: '学生剩饭', enabled: true },
    { id: 'fr-004', name: '供餐过量', enabled: true },
  ];

  listReasons() {
    return this.reasons.filter((r) => r.enabled);
  }
  createReason(name: string) {
    const n = (name || '').trim();
    if (!n) throw new BadRequestException('name required');
    const exist = this.reasons.find((r) => r.name === n);
    if (exist) return exist;
    const id = `fr-${String(this.reasons.length + 1).padStart(3, '0')}`;
    const item = { id, name: n, enabled: true };
    this.reasons.push(item);
    this.repo?.insertReason(item.id, item.name, item.enabled).catch(() => void 0);
    return item;
  }
  setReasonEnabled(id: string, enabled: boolean) {
    const it = this.reasons.find((r) => r.id === id);
    if (!it) throw new BadRequestException('not found');
    it.enabled = !!enabled;
    this.repo?.setReasonEnabled(id, it.enabled).catch(() => void 0);
    return it;
  }
  deleteReason(id: string) {
    const before = this.reasons.length;
    this.reasons = this.reasons.filter((r) => r.id !== id);
    this.repo?.deleteReason(id).catch(() => void 0);
    return { ok: this.reasons.length < before };
  }

  listRecords(params?: {
    schoolId?: string;
    source?: WasteSource;
    start?: string;
    end?: string;
    page?: string | number;
    pageSize?: string | number;
  }) {
    let arr = this.records.slice();
    if (params?.schoolId) arr = arr.filter((r) => r.schoolId === params.schoolId);
    if (params?.source) arr = arr.filter((r) => r.source === params.source);
    if (params?.start)
      arr = arr.filter((r) => new Date(r.date).getTime() >= Date.parse(params.start!));
    if (params?.end) arr = arr.filter((r) => new Date(r.date).getTime() <= Date.parse(params.end!));
    arr.sort((a, b) => (a.date < b.date ? 1 : -1));
    const page = Math.max(1, parseInt(String(params?.page ?? 1), 10) || 1);
    const pageSize = Math.max(1, parseInt(String(params?.pageSize ?? 50), 10) || 50);
    const total = arr.length;
    const items = arr.slice((page - 1) * pageSize, page * pageSize);
    return { items, total, page, pageSize };
  }

  createRecord(b: {
    schoolId?: string;
    date?: string;
    source: WasteSource;
    itemType: ItemType;
    itemName: string;
    weightKg: number;
    amountYuan: number;
    reason?: string;
    meal?: Meal;
  }) {
    if (!b?.source || !b?.itemType || !b?.itemName)
      throw new BadRequestException('source/itemType/itemName required');
    const rec: FoodWasteRecord = {
      id: this.id('FW'),
      schoolId: b.schoolId || 'sch-001',
      date: b.date || this.now(),
      source: b.source,
      itemType: b.itemType,
      itemName: b.itemName,
      weightKg: Number(b.weightKg) || 0,
      amountYuan: Number(b.amountYuan) || 0,
      reason: b.reason,
      meal: b.meal,
    };
    this.records.unshift(rec);
    this.repo?.insertRecord(rec).catch(() => void 0);
    return rec;
  }

  summary(params?: { schoolId?: string; start?: string; end?: string }) {
    const { items } = this.listRecords({ ...params, page: 1, pageSize: 100000 });
    const bySource = new Map<
      WasteSource,
      { source: WasteSource; weightKg: number; amountYuan: number }
    >();
    const byReason = new Map<string, { reason: string; weightKg: number; amountYuan: number }>();
    const byMeal = new Map<Meal, { meal: Meal; weightKg: number; amountYuan: number }>();
    const byItemType = new Map<
      ItemType,
      { itemType: ItemType; weightKg: number; amountYuan: number }
    >();
    let totalWeight = 0;
    let totalAmount = 0;
    for (const r of items) {
      totalWeight += r.weightKg;
      totalAmount += r.amountYuan;
      const s = bySource.get(r.source) || { source: r.source, weightKg: 0, amountYuan: 0 };
      s.weightKg += r.weightKg;
      s.amountYuan += r.amountYuan;
      bySource.set(r.source, s);
      if (r.reason) {
        const m = byReason.get(r.reason) || { reason: r.reason, weightKg: 0, amountYuan: 0 };
        m.weightKg += r.weightKg;
        m.amountYuan += r.amountYuan;
        byReason.set(r.reason, m);
      }
      if (r.meal) {
        const m = byMeal.get(r.meal) || { meal: r.meal, weightKg: 0, amountYuan: 0 };
        m.weightKg += r.weightKg;
        m.amountYuan += r.amountYuan;
        byMeal.set(r.meal, m);
      }
      const it = byItemType.get(r.itemType) || { itemType: r.itemType, weightKg: 0, amountYuan: 0 };
      it.weightKg += r.weightKg;
      it.amountYuan += r.amountYuan;
      byItemType.set(r.itemType, it);
    }
    return {
      total: { weightKg: totalWeight, amountYuan: totalAmount },
      bySource: Array.from(bySource.values()),
      byReason: Array.from(byReason.values()),
      byMeal: Array.from(byMeal.values()),
      byItemType: Array.from(byItemType.values()),
    };
  }

  constructor(private readonly repo?: FoodWasteRepository) {
   
  }
}
