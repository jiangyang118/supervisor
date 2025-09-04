import { Injectable, BadRequestException } from '@nestjs/common';
import { CertificatesRepository } from './repositories/certificates.repository';

export type Certificate = {
  id: number;
  schoolId: number;
  owner: string; // 主体
  type: string; // 证件类型
  number: string; // 证件号
  expireAt: string; // YYYY-MM-DD HH:mm:ss
  deleted?: boolean;
};

@Injectable()
export class CertificatesService {
  constructor(private readonly repo: CertificatesRepository) {}
  private seq = 1;
  private id(prefix: string) {
    return `${prefix}-${String(this.seq++).padStart(4, '0')}`;
  }
  private isExpired(dateISO: string) {
    const t = Date.parse(dateISO);
    return Number.isFinite(t) ? t < Date.now() : false;
  }

  private fmtSeconds(dateISO: string) {
    try {
      const d = new Date(dateISO);
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    } catch {
      return dateISO;
    }
  }

  async list(params?: { schoolId?: number | string; owner?: string; type?: string; status?: '有效' | '过期' }) {
    const rows = await this.repo.list({ schoolId: params?.schoolId, owner: params?.owner, type: params?.type, includeDeleted: false });
    const items = rows.map((r) => ({
      id: Number(r.id),
      schoolId: Number((params?.schoolId as any) ?? 1),
      owner: r.owner,
      type: r.type,
      number: r.number,
      expireAt: this.fmtSeconds(r.expireAt),
      deleted: !!r.deleted,
    }));
    const filtered = params?.status
      ? items.filter((x) => (this.isExpired(x.expireAt) ? '过期' : '有效') === params!.status)
      : items;
    return filtered.map((x) => ({ ...x, status: this.isExpired(x.expireAt) ? '过期' : '有效' }));
  }

  async create(b: { schoolId?: number | string; owner: string; type: string; number: string; expireAt: string }) {
    if (!b?.owner || !b?.type || !b?.number || !b?.expireAt)
      throw new BadRequestException('owner/type/number/expireAt required');
    const sid = b.schoolId !== undefined && b.schoolId !== null && String(b.schoolId).trim() !== '' ? Number(b.schoolId) : 1;
    const insertId = await this.repo.insert({ schoolId: sid, owner: b.owner, type: b.type, number: b.number, expireAt: b.expireAt });
    const rec: Certificate = { id: insertId, schoolId: sid, owner: b.owner, type: b.type, number: b.number, expireAt: this.fmtSeconds(b.expireAt) } as any;
    return { ...rec, status: this.isExpired(rec.expireAt) ? '过期' : '有效' };
  }

  async update(id: number | string, b: Partial<Omit<Certificate, 'id' | 'schoolId'>>) {
    await this.repo.update(id, b);
    const next = { id: Number(id), ...(b as any) } as Certificate;
    const exp = next.expireAt ? this.fmtSeconds(next.expireAt) : undefined;
    return { ...next, expireAt: exp, status: exp ? (this.isExpired(exp) ? '过期' : '有效') : undefined } as any;
  }

  async delete(id: number | string) {
    await this.repo.update(id, { deleted: true });
    return { ok: true };
  }
}
