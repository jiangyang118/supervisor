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

  private items: Certificate[] = [];

  list(params?: { owner?: string; type?: string; status?: '有效' | '过期' }) {
    let arr = this.items.filter((x) => !x.deleted);
    if (params?.owner) arr = arr.filter((x) => x.owner.includes(params.owner!));
    if (params?.type) arr = arr.filter((x) => x.type === params.type);
    if (params?.status)
      arr = arr.filter((x) => (this.isExpired(x.expireAt) ? '过期' : '有效') === params.status);
    return arr.map((x) => ({ ...x, status: this.isExpired(x.expireAt) ? '过期' : '有效' }));
  }

  create(b: { owner: string; type: string; number: string; expireAt: string }) {
    if (!b?.owner || !b?.type || !b?.number || !b?.expireAt)
      throw new BadRequestException('owner/type/number/expireAt required');
    const id = this.id('CF');
    const rec: Certificate = { id, ...b };
    this.items.unshift(rec);
    this.repo?.insert(rec).catch(() => void 0);
    return { ...rec, status: this.isExpired(rec.expireAt) ? '过期' : '有效' };
  }

  update(id: string, b: Partial<Omit<Certificate, 'id'>>) {
    const idx = this.items.findIndex((x) => x.id === id && !x.deleted);
    if (idx === -1) throw new BadRequestException('not found');
    const next = { ...this.items[idx], ...b } as Certificate;
    this.items[idx] = next;
    this.repo?.update(id, next).catch(() => void 0);
    return { ...next, status: this.isExpired(next.expireAt) ? '过期' : '有效' };
  }

  delete(id: string) {
    const idx = this.items.findIndex((x) => x.id === id && !x.deleted);
    if (idx === -1) return { ok: false };
    this.items[idx].deleted = true;
    this.repo?.update(id, { deleted: true }).catch(() => void 0);
    return { ok: true };
  }
}
