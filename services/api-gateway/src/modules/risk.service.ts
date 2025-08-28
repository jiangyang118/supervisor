import { Injectable, BadRequestException } from '@nestjs/common';

export type RiskLevel = '低' | '中' | '高';
export type RiskItem = {
  id: string;
  category?: string;
  title: string;
  level: RiskLevel;
  desc?: string;
  enabled: boolean;
};
export type ReportStatus = '待处理' | '整改中' | '已整改';
export type RiskReport = {
  id: string;
  schoolId: string;
  at: string;
  location: string;
  object: string;
  desc: string;
  images?: string[];
  riskId?: string;
  status: ReportStatus;
  measures?: string;
  rectifiedBy?: string;
  rectifiedAt?: string;
};
export type TaskStatus = '待处理' | '进行中' | '已完成';
export type RiskTask = {
  id: string;
  schoolId: string;
  createdAt: string;
  assignee: string;
  location: string;
  object: string;
  riskId?: string;
  dueAt?: string;
  note?: string;
  status: TaskStatus;
  result?: string;
  resultImages?: string[];
};

@Injectable()
export class RiskService {
  private seq = 1;
  private id(p: string) {
    return `${p}-${String(this.seq++).padStart(4, '0')}`;
  }
  private now() {
    return new Date().toISOString();
  }

  catalog: RiskItem[] = [];
  reports: RiskReport[] = [];
  tasks: RiskTask[] = [];

  constructor() {
    this.seed();
  }

  // Catalog
  listCatalog() {
    return this.catalog.filter((c) => c.enabled);
  }
  createCatalog(b: { category?: string; title: string; level: RiskLevel; desc?: string }) {
    if (!b?.title) throw new BadRequestException('title required');
    const it: RiskItem = { id: this.id('RSK'), enabled: true, ...b };
    this.catalog.unshift(it);
    return it;
  }
  updateCatalog(id: string, b: Partial<Omit<RiskItem, 'id'>>) {
    const i = this.catalog.findIndex((x) => x.id === id);
    if (i === -1) throw new BadRequestException('not found');
    this.catalog[i] = { ...this.catalog[i], ...b } as RiskItem;
    return this.catalog[i];
  }
  deleteCatalog(id: string) {
    const before = this.catalog.length;
    this.catalog = this.catalog.filter((c) => c.id !== id);
    return { ok: this.catalog.length < before };
  }

  // Reports
  getReport(id: string) {
    const r = this.reports.find((x) => x.id === id);
    if (!r) throw new BadRequestException('not found');
    return r;
  }
  listReports(params?: {
    status?: ReportStatus;
    start?: string;
    end?: string;
    location?: string;
    object?: string;
    page?: number | string;
    pageSize?: number | string;
  }) {
    let arr = this.reports.slice();
    if (params?.status) arr = arr.filter((r) => r.status === params.status);
    if (params?.location) arr = arr.filter((r) => r.location.includes(params.location!));
    if (params?.object) arr = arr.filter((r) => r.object.includes(params.object!));
    if (params?.start) arr = arr.filter((r) => Date.parse(r.at) >= Date.parse(params.start!));
    if (params?.end) arr = arr.filter((r) => Date.parse(r.at) <= Date.parse(params.end!));
    arr.sort((a, b) => (a.at < b.at ? 1 : -1));
    const page = Math.max(1, parseInt(String(params?.page ?? 1), 10) || 1);
    const pageSize = Math.max(1, parseInt(String(params?.pageSize ?? 20), 10) || 20);
    const total = arr.length;
    const items = arr.slice((page - 1) * pageSize, page * pageSize);
    return { items, total, page, pageSize };
  }
  createReport(b: {
    schoolId?: string;
    location: string;
    object: string;
    desc: string;
    images?: string[];
    riskId?: string;
  }) {
    if (!b?.location || !b?.object || !b?.desc)
      throw new BadRequestException('location/object/desc required');
    const it: RiskReport = {
      id: this.id('RPT'),
      schoolId: b.schoolId || 'sch-001',
      at: this.now(),
      location: b.location,
      object: b.object,
      desc: b.desc,
      images: b.images,
      riskId: b.riskId,
      status: '待处理',
    };
    this.reports.unshift(it);
    return it;
  }
  setReportStatus(
    id: string,
    status: ReportStatus,
    body?: { measures?: string; rectifiedBy?: string },
  ) {
    const i = this.reports.findIndex((r) => r.id === id);
    if (i === -1) throw new BadRequestException('not found');
    this.reports[i].status = status;
    if (status === '已整改') {
      this.reports[i].measures = body?.measures;
      this.reports[i].rectifiedBy = body?.rectifiedBy || '检查人员';
      this.reports[i].rectifiedAt = this.now();
    }
    return this.reports[i];
  }

  // Tasks
  getTask(id: string) {
    const t = this.tasks.find((x) => x.id === id);
    if (!t) throw new BadRequestException('not found');
    return t;
  }
  listTasks(params?: { assignee?: string; status?: TaskStatus; start?: string; end?: string }) {
    let arr = this.tasks.slice();
    if (params?.assignee) arr = arr.filter((t) => t.assignee === params.assignee);
    if (params?.status) arr = arr.filter((t) => t.status === params.status);
    if (params?.start)
      arr = arr.filter((t) => Date.parse(t.createdAt) >= Date.parse(params.start!));
    if (params?.end) arr = arr.filter((t) => Date.parse(t.createdAt) <= Date.parse(params.end!));
    return arr.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  createTask(b: {
    assignee: string;
    location: string;
    object: string;
    riskId?: string;
    dueAt?: string;
    note?: string;
  }) {
    if (!b?.assignee || !b?.location || !b?.object)
      throw new BadRequestException('assignee/location/object required');
    const t: RiskTask = {
      id: this.id('TSK'),
      schoolId: 'sch-001',
      createdAt: this.now(),
      assignee: b.assignee,
      location: b.location,
      object: b.object,
      riskId: b.riskId,
      dueAt: b.dueAt,
      note: b.note,
      status: '待处理',
    };
    this.tasks.unshift(t);
    return t;
  }
  setTaskStatus(id: string, status: TaskStatus) {
    const i = this.tasks.findIndex((t) => t.id === id);
    if (i === -1) throw new BadRequestException('not found');
    this.tasks[i].status = status;
    return this.tasks[i];
  }
  submitTask(id: string, b: { result: string; images?: string[] }) {
    const i = this.tasks.findIndex((t) => t.id === id);
    if (i === -1) throw new BadRequestException('not found');
    this.tasks[i].result = b.result;
    this.tasks[i].resultImages = b.images;
    this.tasks[i].status = '已完成';
    return this.tasks[i];
  }

  private seed() {
    this.createCatalog({
      category: '冷链',
      title: '冷藏区温度异常',
      level: '高',
      desc: '温度高于8℃',
    });
    this.createCatalog({ category: '加工', title: '操作台不洁', level: '中' });
    this.createReport({
      location: '冷藏间',
      object: '冷柜1号',
      desc: '温度计显示12℃，凝露严重',
      riskId: this.catalog[0].id,
    });
    this.createTask({
      assignee: '检查员A',
      location: '冷藏间',
      object: '冷柜1号',
      riskId: this.catalog[0].id,
      dueAt: new Date(Date.now() + 86400000).toISOString(),
      note: '尽快整改',
    });
  }
}
