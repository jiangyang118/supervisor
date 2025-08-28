import { Injectable } from '@nestjs/common';

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
  private cfg: PublicConfig = {
    schoolId: 'sch-001',
    live: true,
    rating: true,
    orgCert: true,
    staffCert: true,
    level: true,
    trace: true,
    menu: true,
    updatedAt: new Date().toISOString(),
  };
  private audit: Array<{
    id: string;
    by: string;
    at: string;
    changes: Partial<PublicConfig>;
  }> = [];

  get(schoolId?: string) {
    return { ...this.cfg, schoolId: schoolId || this.cfg.schoolId };
  }

  update(partial: Partial<Omit<PublicConfig, 'updatedAt' | 'schoolId'>>, updatedBy?: string) {
    const before = { ...this.cfg };
    this.cfg = { ...this.cfg, ...partial, updatedAt: new Date().toISOString() };
    this.audit.unshift({
      id: `CFG-${this.audit.length + 1}`,
      by: updatedBy || 'unknown',
      at: this.cfg.updatedAt,
      changes: partial,
    });
    return this.cfg;
  }

  listAudit() {
    return this.audit;
  }
}
