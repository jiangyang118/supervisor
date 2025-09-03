import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { WasteRepository } from './repositories/waste.repository';

export type WasteCategory = string;

export interface WasteRecord {
  id: number;
  schoolId: number;
  date: string; // YYYY-MM-DD
  category: WasteCategory;
  amount: number; // kg
  buyer: string;
  person: string;
  createdAt: string;
}

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

@Injectable()
export class WasteService {
  constructor(private readonly repo: WasteRepository) {}

  private genStringId(prefix: string) {
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}${rand}`;
  }
  // id 由数据库自增生成

  // Categories
  async listCategories() {
    return this.repo.listCategories(true);
  }

  async createCategory(name: string) {
    const trimmed = (name || '').trim();
    if (!trimmed) throw new HttpException('Invalid name', HttpStatus.BAD_REQUEST);
    const id = `wc-${this.genStringId('')}`.toLowerCase();
    return this.repo.createCategory(id, trimmed);
  }

  async setCategoryEnabled(id: string, enabled: boolean) {
    await this.repo.setCategoryEnabled(id, !!enabled);
    return { id, enabled: !!enabled };
  }

  async deleteCategory(id: string) {
    await this.repo.deleteCategory(id);
    return { id };
  }

  // Records
  async list(params: {
    schoolId?: number | string;
    category?: string;
    start?: string;
    end?: string;
    page?: string;
    pageSize?: string;
  }) {
    const page = Math.max(parseInt(params.page || '1', 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(params.pageSize || '20', 10) || 20, 1), 200);
    const schoolIdNum =
      params.schoolId !== undefined && params.schoolId !== null
        ? Number(params.schoolId)
        : undefined;
    const schoolId =
      schoolIdNum !== undefined && Number.isFinite(schoolIdNum) && Number.isInteger(schoolIdNum)
        ? schoolIdNum
        : (params.schoolId !== undefined ? -1 : undefined);
    const total = await this.repo.countRecords({
      schoolId,
      category: params.category,
      start: params.start,
      end: params.end,
    });
    const items = await this.repo.listRecords({
      schoolId,
      category: params.category,
      start: params.start,
      end: params.end,
      page,
      pageSize,
    });
    return { items, total, page, pageSize };
  }

  async create(body: {
    schoolId?: number | string;
    date?: string;
    category: WasteCategory;
    amount: number;
    buyer: string;
    person: string;
  }) {
    const schoolId = Number(body.schoolId ?? 0) || 0;
    const createdAt = new Date().toISOString();
    const insertId = await this.repo.insertRecord({
      schoolId,
      date: body.date || todayStr(),
      category: body.category || '餐厨垃圾',
      amount: Number(body.amount) || 0,
      buyer: body.buyer || '',
      person: body.person || '',
      createdAt,
    });
    const rec: WasteRecord = {
      id: insertId,
      schoolId,
      date: body.date || todayStr(),
      category: body.category || '餐厨垃圾',
      amount: Number(body.amount) || 0,
      buyer: body.buyer || '',
      person: body.person || '',
      createdAt,
    };
    return rec;
  }

  async getById(id: number) {
    const rec = await this.repo.getRecordById(id);
    if (!rec) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }
    return rec;
  }
}
