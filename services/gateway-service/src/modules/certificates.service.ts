import { Injectable, BadRequestException } from '@nestjs/common';
import { CertificatesRepository } from './repositories/certificates.repository';

export type Certificate = {
  id: string;
  owner: string; // 主体
  type: string; // 证件类型
  number: string; // 证件号
  expireAt: string; // YYYY-MM-DD or ISO
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

  async list(params?: { owner?: string; type?: string; status?: '有效' | '过期' }) {
    const rows = await this.repo.list({ owner: params?.owner, type: params?.type, includeDeleted: false });
    const items = rows.map((r) => ({
      id: r.id,
      owner: r.owner,
      type: r.type,
      number: r.number,
      expireAt: r.expireAt,
      deleted: !!r.deleted,
    }));
    const filtered = params?.status
      ? items.filter((x) => (this.isExpired(x.expireAt) ? '过期' : '有效') === params!.status)
      : items;
    return filtered.map((x) => ({ ...x, status: this.isExpired(x.expireAt) ? '过期' : '有效' }));
  }

  async create(b: { owner: string; type: string; number: string; expireAt: string }) {
    if (!b?.owner || !b?.type || !b?.number || !b?.expireAt)
      throw new BadRequestException('owner/type/number/expireAt required');
    const id = this.id('CF');
    const rec: Certificate = { id, ...b };
    await this.repo.insert(rec);
    return { ...rec, status: this.isExpired(rec.expireAt) ? '过期' : '有效' };
  }

  async update(id: string, b: Partial<Omit<Certificate, 'id'>>) {
    await this.repo.update(id, b);
    const next = { id, ...(b as any) } as Certificate;
    return { ...next, status: next.expireAt ? (this.isExpired(next.expireAt) ? '过期' : '有效') : undefined };
  }

  async delete(id: string) {
    await this.repo.update(id, { deleted: true });
    return { ok: true };
  }
}
