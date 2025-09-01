import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

export type WasteCategory = string;

export interface WasteRecord {
  id: string;
  schoolId: string;
  date: string; // YYYY-MM-DD or locale
  category: WasteCategory;
  amount: number; // kg
  buyer: string;
  person: string;
  createdAt: string;
}

function todayStr() {
  return new Date().toLocaleDateString();
}

@Injectable()
export class WasteService {
  private categoriesStore: { id: string; name: string; enabled: boolean }[] = [
    { id: 'wc-001', name: '餐厨垃圾', enabled: true },
    { id: 'wc-002', name: '过期食材', enabled: true },
  ];
  private records: WasteRecord[] = [
    {
      id: 'WS-001',
      schoolId: 'sch-001',
      date: todayStr(),
      category: '餐厨垃圾',
      amount: 20,
      buyer: '示例回收公司',
      person: '王五',
      createdAt: new Date().toISOString(),
    },
  ];

  listCategories() {
    return this.categoriesStore.filter((c) => c.enabled);
  }

  createCategory(name: string) {
    const trimmed = (name || '').trim();
    if (!trimmed) throw new HttpException('Invalid name', HttpStatus.BAD_REQUEST);
    const exists = this.categoriesStore.find((c) => c.name === trimmed);
    if (exists) throw new HttpException('Category already exists', HttpStatus.CONFLICT);
    const id = `wc-${String(this.categoriesStore.length + 1).padStart(3, '0')}`;
    const item = { id, name: trimmed, enabled: true };
    this.categoriesStore.push(item);
    return item;
  }

  setCategoryEnabled(id: string, enabled: boolean) {
    const item = this.categoriesStore.find((c) => c.id === id);
    if (!item) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    item.enabled = !!enabled;
    return item;
  }

  deleteCategory(id: string) {
    const idx = this.categoriesStore.findIndex((c) => c.id === id);
    if (idx === -1) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    const [removed] = this.categoriesStore.splice(idx, 1);
    return removed;
  }

  list(params: {
    schoolId?: string;
    category?: string;
    start?: string;
    end?: string;
    page?: string;
    pageSize?: string;
  }) {
    const page = Math.max(parseInt(params.page || '1', 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(params.pageSize || '20', 10) || 20, 1), 200);
    let items = [...this.records];
    if (params.schoolId) items = items.filter((r) => r.schoolId === params.schoolId);
    if (params.category) items = items.filter((r) => r.category === params.category);
    if (params.start) {
      const s = new Date(params.start).getTime();
      items = items.filter((r) => new Date(r.date).getTime() >= s);
    }
    if (params.end) {
      const e = new Date(params.end).getTime();
      items = items.filter((r) => new Date(r.date).getTime() <= e);
    }
    const total = items.length;
    const startIdx = (page - 1) * pageSize;
    const paged = items.slice(startIdx, startIdx + pageSize);
    return { items: paged, total, page, pageSize };
  }

  create(body: {
    schoolId?: string;
    date?: string;
    category: WasteCategory;
    amount: number;
    buyer: string;
    person: string;
  }) {
    const id = `WS-${String(this.records.length + 1).padStart(3, '0')}`;
    const rec: WasteRecord = {
      id,
      schoolId: body.schoolId || 'sch-001',
      date: body.date || todayStr(),
      category: body.category || '餐厨垃圾',
      amount: Number(body.amount) || 0,
      buyer: body.buyer || '',
      person: body.person || '',
      createdAt: new Date().toISOString(),
    };
    this.records.unshift(rec);
    return rec;
  }
}
