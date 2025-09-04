import { Injectable, BadRequestException } from '@nestjs/common';
import { StaffRepository } from './repositories/staff.repository';
import { UsersRepository } from './repositories/users.repository';

export type Attachment = { id: string; name: string; url: string };
export type Announcement = {
  id: string;
  title: string;
  content: string;
  at: string;
  attachments?: Attachment[];
};
export type CanteenInfo = {
  name: string;
  manager?: string;
  phone?: string;
  address?: string;
  updatedAt: string;
};
export type LinkStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type Linkage = {
  id: string;
  org: string;
  contact?: string;
  remark?: string;
  status: LinkStatus;
  at: string;
  decidedBy?: string;
  decidedAt?: string;
  comment?: string;
};
export type AppInfo = { platform: 'Android' | 'iOS'; version: string; url: string };
export type MealItem = {
  name: '早餐' | '午餐' | '晚餐' | string;
  start: string;
  end: string;
  enabled: boolean;
};
export type User = {
  id: string;
  username: string;
  displayName: string;
  roles: string[];
  enabled: boolean;
};
export type Role = { name: string; permissions: string[] };
export type PermissionNode = { key?: string; label: string; children?: PermissionNode[] };
export type News = {
  id: string;
  title: string;
  content: string;
  enabled: boolean;
  pinned: boolean;
  at: string;
};
export type RegulatorInfo = {
  name: string;
  contact?: string;
  phone?: string;
  address?: string;
  updatedAt: string;
};

@Injectable()
export class SystemService {
  constructor(private readonly staffRepo: StaffRepository, private readonly usersRepo: UsersRepository) {}
  private seq = 1;
  private id(p: string) {
    return `${p}-${String(this.seq++).padStart(4, '0')}`;
  }
  private now() {
    return new Date().toISOString();
  }

  announcements: Announcement[] = [];
  canteen: CanteenInfo = {
    name: '1号食堂',
    manager: '王主管',
    phone: '1380000',
    address: '校园内',
    updatedAt: this.now(),
  };
  linkages: Linkage[] = [];
  news: News[] = [];
  regulator: RegulatorInfo = {
    name: '示例市市场监管局',
    contact: '李监管',
    phone: '010-123456',
    address: '示例市XX路100号',
    updatedAt: this.now(),
  };
  apps: AppInfo[] = [
    { platform: 'Android', version: '0.1.0', url: 'https://example.com/app-school-android.apk' },
    { platform: 'iOS', version: '0.1.0', url: 'https://apps.apple.com/app/idxxxxxxxx' },
  ];
  meals: MealItem[] = [
    { name: '早餐', start: '07:00', end: '08:00', enabled: true },
    { name: '午餐', start: '11:30', end: '12:30', enabled: true },
    { name: '晚餐', start: '17:30', end: '18:30', enabled: false },
  ];
  users: User[] = [
    {
      id: this.id('USR'),
      username: 'principal@school.cn',
      displayName: '校长',
      roles: ['SCHOOL', 'ADMIN'],
      enabled: true,
    },
    {
      id: this.id('USR'),
      username: 'canteen@school.cn',
      displayName: '食堂管理员',
      roles: ['SCHOOL'],
      enabled: true,
    },
  ];
  roles: Role[] = [
    { name: 'ADMIN', permissions: ['users.manage', 'announcements.publish', 'meals.edit'] },
    { name: 'SCHOOL', permissions: ['announcements.read', 'reports.view'] },
  ];
  permissionsTree: PermissionNode[] = [
    {
      label: '系统管理',
      children: [
        { key: 'users.manage', label: '用户管理' },
        { key: 'announcements.publish', label: '公告发布' },
        { key: 'meals.edit', label: '餐次设置' },
      ],
    },
    {
      label: '查看权限',
      children: [
        { key: 'announcements.read', label: '公告阅读' },
        { key: 'reports.view', label: '报表查看' },
      ],
    },
  ];

  // Announcements
  listAnnouncements(params?: { page?: number | string; pageSize?: number | string }) {
    const page = Math.max(1, parseInt(String(params?.page ?? 1), 10) || 1);
    const pageSize = Math.max(1, parseInt(String(params?.pageSize ?? 20), 10) || 20);
    const total = this.announcements.length;
    const items = this.announcements.slice((page - 1) * pageSize, page * pageSize);
    return { items, total, page, pageSize };
  }
  createAnnouncement(b: { title: string; content: string }) {
    if (!b?.title) throw new BadRequestException('title required');
    const it: Announcement = {
      id: this.id('AN'),
      title: b.title,
      content: b.content || '',
      at: this.now(),
      attachments: [],
    };
    this.announcements.unshift(it);
    return it;
  }
  addAnnouncementAttachment(id: string, att: { name: string; url: string }) {
    const a = this.announcements.find((x) => x.id === id);
    if (!a) throw new BadRequestException('not found');
    const item = { id: this.id('ATT'), name: att.name, url: att.url };
    (a.attachments ||= []).push(item);
    return item;
  }
  getAnnouncement(id: string) {
    const a = this.announcements.find((x) => x.id === id);
    if (!a) throw new BadRequestException('not found');
    return a;
  }

  // Canteen info
  getCanteen() {
    return this.canteen;
  }
  saveCanteen(b: Partial<Omit<CanteenInfo, 'updatedAt'>>) {
    this.canteen = { ...this.canteen, ...b, updatedAt: this.now() };
    return this.canteen;
  }

  // Linkage
  listLinkage(params?: { status?: LinkStatus }) {
    return params?.status ? this.linkages.filter((l) => l.status === params.status) : this.linkages;
  }
  applyLinkage(b: { org: string; contact?: string; remark?: string }) {
    if (!b?.org) throw new BadRequestException('org required');
    const it: Linkage = {
      id: this.id('LNK'),
      org: b.org,
      contact: b.contact,
      remark: b.remark,
      status: 'PENDING',
      at: this.now(),
    };
    this.linkages.unshift(it);
    return it;
  }
  reviewLinkage(id: string, status: LinkStatus, comment?: string) {
    const i = this.linkages.findIndex((x) => x.id === id);
    if (i === -1) throw new BadRequestException('not found');
    this.linkages[i] = {
      ...this.linkages[i],
      status,
      decidedBy: '管理员',
      decidedAt: this.now(),
      comment,
    };
    return this.linkages[i];
  }

  // Apps
  listApps() {
    return this.apps;
  }

  // Meals
  listMeals() {
    return this.meals;
  }
  saveMeals(items: MealItem[]) {
    if (!Array.isArray(items)) throw new BadRequestException('items required');
    this.meals = items.map((x) => ({ ...x }));
    return { items: this.meals };
  }

  // Users & roles
  async listUsers() {
    try {
      const rows = await this.usersRepo.listUsers();
      return rows.map(r => ({ ...r, enabled: !!r.enabled }));
    } catch {
      return [];
    }
  }
  listRoles() {
    return this.roles;
  }
  listPermissions() {
    return this.permissionsTree;
  }
  async setUserRoles(id: string, roles: string[]) {
    const uid = Number(id);
    if (!Number.isFinite(uid) || uid <= 0) throw new BadRequestException('invalid user id');
    await this.usersRepo.setUserRoles(uid, roles || []);
    return { ok: true } as any;
  }
  async createUser(b: { name: string; phone?: string; roles?: string[]; remark?: string; enabled?: boolean }) {
    if (!b?.name) throw new BadRequestException('name required');
    const displayName = b.name.trim();
    const username = (b.phone && String(b.phone).trim()) || `u${Date.now()}`;
    const insertId = await this.usersRepo.insertOne({ username, displayName, enabled: b.enabled ?? true, phone: b.phone?.trim(), remark: b.remark?.trim(), createdBy: '系统' });
    if ((b.roles || []).length) await this.usersRepo.setUserRoles(insertId, b.roles || []);
    return { id: insertId } as any;
  }

  async updateUser(id: number, patch: { name?: string; phone?: string; remark?: string; enabled?: boolean }) {
    if (!id || !Number.isFinite(Number(id))) throw new BadRequestException('id required');
    const p: any = {};
    if (patch.name !== undefined) p.displayName = patch.name;
    if (patch.phone !== undefined) p.phone = patch.phone;
    if (patch.remark !== undefined) p.remark = patch.remark;
    if (patch.enabled !== undefined) p.enabled = !!patch.enabled;
    await this.usersRepo.updateOne(Number(id), p);
    return { ok: true } as any;
  }

  async deleteUser(id: number) {
    if (!id || !Number.isFinite(Number(id))) throw new BadRequestException('id required');
    await this.usersRepo.removeOne(Number(id));
    return { ok: true } as any;
  }
  setRolePermissions(name: string, perms: string[]) {
    const i = this.roles.findIndex((r) => r.name === name);
    if (i === -1) throw new BadRequestException('not found');
    this.roles[i].permissions = perms || [];
    return this.roles[i];
  }

  createUser(b: { username: string; displayName: string; roles?: string[]; enabled?: boolean }) {
    if (!b?.username) throw new BadRequestException('username required');
    const it: User = {
      id: this.id('USR'),
      username: b.username,
      displayName: b.displayName || b.username,
      roles: b.roles || [],
      enabled: b.enabled ?? true,
    };
    this.users.unshift(it);
    return it;
  }
  updateUser(id: string, patch: Partial<Omit<User, 'id'>>) {
    const i = this.users.findIndex((u) => u.id === id);
    if (i === -1) throw new BadRequestException('not found');
    this.users[i] = { ...this.users[i], ...patch, id: this.users[i].id };
    return this.users[i];
  }
  deleteUser(id: string) {
    const before = this.users.length;
    this.users = this.users.filter((u) => u.id !== id);
    return { ok: this.users.length < before };
  }

  // News
  listNews(params?: {
    page?: number | string;
    pageSize?: number | string;
    enabled?: 'true' | 'false';
  }) {
    let arr = this.news.slice();
    if (params?.enabled) arr = arr.filter((n) => String(n.enabled) === params!.enabled);
    arr.sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1) || (a.at < b.at ? 1 : -1));
    const p = Math.max(1, parseInt(String(params?.page ?? 1), 10) || 1);
    const ps = Math.max(1, parseInt(String(params?.pageSize ?? 20), 10) || 20);
    const total = arr.length;
    const items = arr.slice((p - 1) * ps, p * ps);
    return { items, total, page: p, pageSize: ps };
  }
  createNews(b: { title: string; content?: string; enabled?: boolean; pinned?: boolean }) {
    if (!b?.title) throw new BadRequestException('title required');
    const it: News = {
      id: this.id('NEWS'),
      title: b.title,
      content: b.content || '',
      enabled: b.enabled ?? true,
      pinned: !!b.pinned,
      at: this.now(),
    };
    this.news.unshift(it);
    return it;
  }
  updateNews(id: string, patch: Partial<Omit<News, 'id' | 'at'>>) {
    const i = this.news.findIndex((n) => n.id === id);
    if (i === -1) throw new BadRequestException('not found');
    this.news[i] = { ...this.news[i], ...patch };
    return this.news[i];
  }
  deleteNews(id: string) {
    const before = this.news.length;
    this.news = this.news.filter((n) => n.id !== id);
    return { ok: this.news.length < before };
  }
  getNews(id: string) {
    const it = this.news.find((n) => n.id === id);
    if (!it) throw new BadRequestException('not found');
    return it;
  }

  // Regulator info
  getRegulator() {
    return this.regulator;
  }
  saveRegulator(b: Partial<Omit<RegulatorInfo, 'updatedAt'>>) {
    this.regulator = { ...this.regulator, ...b, updatedAt: this.now() };
    return this.regulator;
  }

  // Staff (personnel)
  async staffSearch(params: {
    schoolId: number;
    q?: string;
    page?: number | string;
    pageSize?: number | string;
  }) {
    const p = Math.max(1, parseInt(String(params.page ?? 1), 10) || 1);
    const ps = Math.max(1, parseInt(String(params.pageSize ?? 20), 10) || 20);
    const res = await this.staffRepo.search({ schoolId: params.schoolId, q: params.q, page: p, pageSize: ps });
    return {
      ...res,
      items: res.items.map((r: any) => ({ ...r, enabled: !!r.enabled })),
    };
  }

  async staffCreate(b: {
    schoolId?: number;
    name: string;
    jobTitle?: string;
    phone?: string;
    healthCertNo?: string;
    enabled?: boolean;
  }) {
    if (!b?.name) throw new BadRequestException('name required');
    const schoolId = b.schoolId && Number.isFinite(Number(b.schoolId)) ? Number(b.schoolId) : 1;
    const insertId = await this.staffRepo.insertOne({
      schoolId,
      name: b.name,
      jobTitle: b.jobTitle,
      phone: b.phone,
      healthCertNo: b.healthCertNo,
      enabled: b.enabled ? 1 : 0,
    } as any);
    return { id: insertId } as any;
  }

  async staffImport(
    schoolId: number | undefined,
    items: Array<{ name: string; jobTitle?: string; phone?: string; healthCertNo?: string; enabled?: boolean }>,
  ) {
    const sid = schoolId && Number.isFinite(Number(schoolId)) ? Number(schoolId) : 1;
    const rows = (items || []).filter((x) => x && x.name).map((x) => ({
      schoolId: sid,
      name: x.name,
      jobTitle: x.jobTitle,
      phone: x.phone,
      healthCertNo: x.healthCertNo,
      enabled: x.enabled ? 1 : 0,
    })) as any[];
    const affected = await this.staffRepo.bulkInsert(rows as any);
    return { ok: true, inserted: affected } as any;
  }

  async staffUpdate(id: number, patch: any) {
    if (!id || !Number.isFinite(Number(id))) throw new BadRequestException('id required');
    await this.staffRepo.update(Number(id), patch || {});
    return { ok: true } as any;
  }

  async staffDelete(id: number) {
    if (!id || !Number.isFinite(Number(id))) throw new BadRequestException('id required');
    await this.staffRepo.remove(Number(id));
    return { ok: true } as any;
  }
}
