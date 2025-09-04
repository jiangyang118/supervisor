import { Injectable, BadRequestException } from '@nestjs/common';
import { StaffCertsRepository } from './repositories/staff-certs.repository';

@Injectable()
export class StaffCertsService {
  constructor(private readonly repo: StaffCertsRepository) {}

  async list(params: { schoolId?: number | string; staffId?: number | string; q?: string; page?: number | string; pageSize?: number | string }) {
    const sid = Number(params.schoolId ?? 1) || 1;
    const staffId = params.staffId !== undefined && params.staffId !== null && String(params.staffId).trim() !== '' ? Number(params.staffId) : undefined;
    const p = Math.max(1, parseInt(String(params.page ?? 1), 10) || 1);
    const ps = Math.max(1, parseInt(String(params.pageSize ?? 20), 10) || 20);
    return this.repo.list({ schoolId: sid, staffId, q: params.q, page: p, pageSize: ps });
  }

  async create(b: { schoolId?: number | string; staffId?: number | string; certNo?: string; startAt?: string; endAt?: string; imageUrl?: string }) {
    const sid = Number(b.schoolId ?? 1) || 1;
    const staffId = Number(b.staffId);
    if (!Number.isFinite(staffId) || staffId <= 0) throw new BadRequestException('staffId required');
    const id = await this.repo.insertOne({ schoolId: sid, staffId, certNo: b.certNo, startAt: b.startAt, endAt: b.endAt, imageUrl: b.imageUrl, createdAt: '' } as any);
    return { id };
  }

  async update(id: number | string, patch: Partial<{ certNo: string; startAt: string; endAt: string; imageUrl: string }>) {
    if (!id || !Number.isFinite(Number(id))) throw new BadRequestException('id required');
    await this.repo.update(Number(id), patch);
    return { ok: true };
  }

  async delete(id: number | string) {
    if (!id || !Number.isFinite(Number(id))) throw new BadRequestException('id required');
    await this.repo.remove(Number(id));
    return { ok: true };
  }
}

