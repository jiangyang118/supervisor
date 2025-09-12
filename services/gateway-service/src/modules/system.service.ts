import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersRepository } from './repositories/users.repository';
import { RolesRepository } from './repositories/roles.repository';
import { PermissionsRepository } from './repositories/permissions.repository';
import { SchoolUsersRepository } from './repositories/school-users.repository';

export type Attachment = { id: string; name: string; url: string };
export type Announcement = {
  id: string;
  schoolId: number;
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
  constructor(
    
    private readonly usersRepo: UsersRepository,
    private readonly schoolUsers: SchoolUsersRepository,
    private readonly rolesRepo: RolesRepository,
    private readonly permsRepo: PermissionsRepository,
  ) {}
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
    // ADMIN 作为演示超管，放开所有权限
    { name: 'ADMIN', permissions: ['*:*'] },
    // SCHOOL 演示用户拥有基础只读权限
    { name: 'SCHOOL', permissions: ['report:R', 'food_safety:R', 'inventory:R', 'stream:R'] },
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
  listAnnouncements(params?: { page?: number | string; pageSize?: number | string; schoolId?: number }) {
    const page = Math.max(1, parseInt(String(params?.page ?? 1), 10) || 1);
    const pageSize = Math.max(1, parseInt(String(params?.pageSize ?? 20), 10) || 20);
    const sid = params?.schoolId && Number.isFinite(Number(params.schoolId)) ? Number(params.schoolId) : undefined;
    const rows = sid ? this.announcements.filter((a) => a.schoolId === sid) : this.announcements;
    const total = rows.length;
    const items = rows.slice((page - 1) * pageSize, page * pageSize);
    return { items, total, page, pageSize };
  }
  createAnnouncement(b: { title: string; content: string }, schoolId: number) {
    if (!b?.title) throw new BadRequestException('title required');
    if (!Number.isFinite(Number(schoolId))) throw new BadRequestException('schoolId required');
    const it: Announcement = {
      id: this.id('AN'),
      schoolId: Number(schoolId),
      title: b.title,
      content: b.content || '',
      at: this.now(),
      attachments: [],
    };
    this.announcements.unshift(it);
    return it;
  }
  addAnnouncementAttachment(id: string, att: { name: string; url: string }, schoolId?: number) {
    const a = this.announcements.find((x) => x.id === id && (schoolId === undefined || x.schoolId === Number(schoolId)));
    if (!a) throw new BadRequestException('not found');
    const item = { id: this.id('ATT'), name: att.name, url: att.url };
    (a.attachments ||= []).push(item);
    return item;
  }
  getAnnouncement(id: string, schoolId?: number) {
    const a = this.announcements.find((x) => x.id === id && (schoolId === undefined || x.schoolId === Number(schoolId)));
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
  async listRoles() {
    try {
      const rows = await this.rolesRepo.listRoles();
      return rows;
    } catch {
      return this.roles;
    }
  }
  async listPermissions() {
    try {
      const flat = await this.permsRepo.list();
      // group by resource (split by ':' preferred, fallback '.')
      const groups = new Map<string, Array<{ key: string; label: string }>>();
      for (const p of flat) {
        const key = p.key as string;
        const idx = key.includes(':') ? key.indexOf(':') : key.indexOf('.');
        const res = idx > 0 ? key.slice(0, idx) : key;
        if (!groups.has(res)) groups.set(res, []);
        groups.get(res)!.push(p);
      }
      const tree = Array.from(groups.entries()).map(([res, items]) => ({
        label: res,
        children: items.map((it) => ({ key: it.key, label: it.label })),
      }));
      return tree;
    } catch {
      return this.permissionsTree;
    }
  }
  async setUserRoles(id: string, roles: string[]) {
    const uid = Number(id);
    if (!Number.isFinite(uid) || uid <= 0) throw new BadRequestException('invalid user id');
    await this.usersRepo.setUserRoles(uid, roles || []);
    return { ok: true } as any;
  }
  async createUser(b: { name?: string; phone?: string; roles?: string[]; remark?: string; enabled?: boolean; password?: string; createdBy?: string } | { username: string; displayName?: string; roles?: string[]; enabled?: boolean; password?: string; createdBy?: string }) {
    // Support both shapes:
    // - School-side: { name, phone?, roles?, remark?, enabled? }
    // - Regulator-side: { username, displayName?, roles?, enabled? }
    const asAny = b as any;
    if (asAny.username) {
      const username = String(asAny.username).trim();
      if (!username) throw new BadRequestException('username required');
      const displayName = (asAny.displayName || username).trim();
      const insertId = await this.usersRepo.insertOne({ username, displayName, enabled: asAny.enabled ?? true, createdBy: asAny.createdBy });
      if (asAny.password && String(asAny.password).trim()) {
        await this.usersRepo.setCredential(insertId, String(asAny.password).trim());
      }
      if ((asAny.roles || []).length) await this.usersRepo.setUserRoles(insertId, asAny.roles || []);
      return { id: insertId } as any;
    }
    if (!asAny?.name) throw new BadRequestException('name required');
    const displayName = String(asAny.name).trim();
    const username = (asAny.phone && String(asAny.phone).trim()) || `u${Date.now()}`;
    const insertId = await this.usersRepo.insertOne({ username, displayName, enabled: asAny.enabled ?? true, phone: asAny.phone?.trim(), remark: asAny.remark?.trim(), createdBy: asAny.createdBy || '系统' });
    if (asAny.password && String(asAny.password).trim()) {
      await this.usersRepo.setCredential(insertId, String(asAny.password).trim());
    }
    if ((asAny.roles || []).length) await this.usersRepo.setUserRoles(insertId, asAny.roles || []);
    return { id: insertId } as any;
  }

  async createSchoolAccount(params: { schoolId: number; username: string; displayName?: string; phone?: string; password?: string; roles?: string[] }) {
    if (!params?.schoolId || !Number.isFinite(Number(params.schoolId))) throw new BadRequestException('schoolId required');
    if (!params?.username) throw new BadRequestException('username required');
    if (!params?.password || String(params.password).trim() === '') throw new BadRequestException('password required');
    const username = params.username.trim();
    const displayName = (params.displayName || username).trim();
    // create user
    const uid = await this.usersRepo.insertOne({ username, displayName, enabled: true, phone: params.phone?.trim(), createdBy: 'regulator' });
    // set credential (password now required)
    const raw = String(params.password).trim();
    await this.usersRepo.setCredential(uid, raw);
    // set role: default ADMIN for school-side super admin
    const roles = params.roles && params.roles.length ? params.roles : ['ADMIN'];
    await this.usersRepo.setUserRoles(uid, roles);
    // bind to school
    await this.schoolUsers.bind(uid, Number(params.schoolId));
    return { id: uid, username, initialPassword: raw } as any;
  }

  async listSchoolAccounts(params: { schoolId?: number; q?: string }) {
    return this.schoolUsers.listAccounts({ schoolId: params.schoolId, q: params.q });
  }

  async updateSchoolAccount(id: number, patch: { displayName?: string; phone?: string; enabled?: boolean; roles?: string[]; schoolId?: number }) {
    const uid = Number(id);
    if (!Number.isFinite(uid) || uid <= 0) throw new BadRequestException('invalid user id');
    const pu: any = {};
    if (patch.displayName !== undefined) pu.displayName = patch.displayName;
    if (patch.phone !== undefined) pu.phone = patch.phone;
    if (patch.enabled !== undefined) pu.enabled = !!patch.enabled;
    if (Object.keys(pu).length) await this.usersRepo.updateOne(uid, pu);
    if (patch.roles) await this.usersRepo.setUserRoles(uid, patch.roles);
    if (patch.schoolId && Number.isFinite(Number(patch.schoolId))) {
      await this.schoolUsers.unbindAll(uid);
      await this.schoolUsers.bind(uid, Number(patch.schoolId));
    }
    return { ok: true } as any;
  }

  async deleteSchoolAccount(id: number, actor?: { id?: number | string; username?: string }) {
    return this.deleteUser(id, actor);
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

  async deleteUser(id: number, actor?: { id?: number | string; username?: string }) {
    const targetId = Number(id);
    if (!targetId || !Number.isFinite(targetId)) throw new BadRequestException('id required');
    // Protect super
    try {
      const target = await this.usersRepo.findById(targetId);
      if (target?.username === 'super') throw new BadRequestException('不可删除 super 账号');
    } catch {}
    // Protect self
    const actorIdNum = actor?.id !== undefined ? Number(actor.id) : NaN;
    if (Number.isFinite(actorIdNum) && actorIdNum === targetId) throw new BadRequestException('不可删除自身账号');
    await this.usersRepo.removeOne(targetId);
    return { ok: true } as any;
  }
  setRolePermissions(name: string, perms: string[]) {
    const i = this.roles.findIndex((r) => r.name === name);
    if (i === -1) throw new BadRequestException('not found');
    this.roles[i].permissions = perms || [];
    return this.roles[i];
  }

  // Removed legacy in-memory create/update/delete to avoid overriding DB-backed methods

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

  // Staff (personnel) module removed
}
