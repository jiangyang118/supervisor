import { Injectable } from '@nestjs/common';
import { PublicConfigRepository } from './repositories/public-config.repository';

export type PublicConfig = {
  schoolId: string;
  live: boolean; // 公开直播画面
  rating: boolean; // 公开用户评价
  orgCert: boolean; // 公开机构证件
  staffCert: boolean; // 公开人员证件
  level: boolean; // 公开食安等级
  trace: boolean; // 公开食材溯源信息
  menu: boolean; // 公开营养菜品
  updatedAt: string;
};

@Injectable()
export class PublicConfigService {
  constructor(private readonly repo: PublicConfigRepository) {}

  async get(schoolId?: string) {
    const sid = Number(schoolId ?? 1) || 1;
    await this.repo.ensureDefault(sid);
    const row = await this.repo.get(sid);
    return row || { schoolId: sid, live: true, rating: true, orgCert: true, staffCert: true, level: true, trace: true, menu: true, updatedAt: new Date().toISOString() };
  }

  async update(
    schoolId: string | number | undefined,
    partial: Partial<Omit<PublicConfig, 'updatedAt' | 'schoolId'>>,
    updatedBy?: string,
  ) {
    const sid = Number(schoolId ?? 1) || 1;
    await this.repo.ensureDefault(sid);
    await this.repo.update(sid, partial as any);
    await this.repo.insertAudit(sid, updatedBy, partial);
    return this.get(String(sid));
  }

  async listAudit(schoolId?: string) {
    const sid = Number(schoolId ?? 1) || 1;
    return this.repo.listAudit(sid);
  }
}
