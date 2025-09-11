import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { WasteRepository } from './repositories/waste.repository';

export type WasteCategory = number;

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
    return this.repo.createCategory(trimmed);
  }

  async setCategoryEnabled(id: number, enabled: boolean) {
    await this.repo.setCategoryEnabled(Number(id), !!enabled);
    return { id: Number(id), enabled: !!enabled };
  }

  async deleteCategory(id: number) {
    await this.repo.deleteCategory(Number(id));
    return { id: Number(id) };
  }

  // Records
  async list(params: {
    schoolId?: number | string;
    canteenId?: number | string;
    category?: number;
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
    const canteenId = params.canteenId !== undefined && params.canteenId !== null && String(params.canteenId).trim() !== '' ? Number(params.canteenId) : undefined;
    const total = await this.repo.countRecords({ schoolId, canteenId, category: params.category, start: params.start, end: params.end });
    const items = await this.repo.listRecords({
      schoolId,
      canteenId,
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
    canteenId?: number | string;
    date?: string;
    category: WasteCategory;
    amount: number;
    buyer: string;
    person: string;
  }) {
    const schoolId = Number(body.schoolId ?? 0) || 0;
    const canteenId = body.canteenId !== undefined && body.canteenId !== null && String(body.canteenId).trim() !== '' ? Number(body.canteenId) : undefined;
    const createdAt = new Date().toISOString();
    const insertId = await this.repo.insertRecord({
      schoolId,
      canteenId: canteenId ?? null,
      date: body.date || todayStr(),
      category: (body.category as any) || 1,
      amount: Number(body.amount) || 0,
      buyer: body.buyer || '',
      person: body.person || '',
      createdAt,
    });
    const rec: WasteRecord = {
      id: insertId,
      schoolId,
      date: body.date || todayStr(),
      category: (body.category as any) || 1,
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

  async remove(id: number) {
    const affected = await this.repo.deleteRecord(Number(id));
    if (!affected) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }
    return { id: Number(id) };
  }
}
