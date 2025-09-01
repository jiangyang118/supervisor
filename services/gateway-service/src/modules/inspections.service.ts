import { Injectable, BadRequestException } from '@nestjs/common';

export type InspectType = '日常' | '专项' | '双随机';
export type InspectStatus = '待处理' | '进行中' | '已完成' | '已取消';

export type InspectTask = {
  id: string;
  type: InspectType;
  schoolId: string;
  schoolName?: string;
  assignee?: string; // 检查人
  grid?: string; // 网格/小组
  content: string; // 检查事项/内容
  status: InspectStatus;
  createdAt: string;
  completedAt?: string;
  result?: {
    passed: boolean;
    items: Array<{ item: string; ok: boolean; remark?: string; penaltyType?: string }>;
    summary?: string;
  };
};

export type Inspector = {
  id: string;
  name: string;
  region?: string;
  mobile?: string;
  grids?: string[];
};

@Injectable()
export class InspectionsService {
  private seq = 1;
  private id(p: string) {
    return `${p}-${String(this.seq++).padStart(4, '0')}`;
  }
  private now() {
    return new Date().toISOString();
  }

  tasks: InspectTask[] = [];
  inspectors: Inspector[] = [];
  grids: Array<{ id: string; name: string; schools: string[]; inspectorIds: string[] }> = [];
  config = {
    items: ['环境卫生', '从业规范', '食品留样', '餐具消毒'],
    penalties: ['责令整改', '警告', '罚款', '停业整顿'],
    publications: ['校内公告栏', '网站公示', '公众号公示'],
  };

  listTasks(params?: {
    type?: InspectType;
    status?: InspectStatus;
    schoolId?: string;
    assignee?: string;
    start?: string;
    end?: string;
    page?: number | string;
    pageSize?: number | string;
  }) {
    let arr = this.tasks.slice();
    if (params?.type) arr = arr.filter((t) => t.type === params.type);
    if (params?.status) arr = arr.filter((t) => t.status === params.status);
    if (params?.schoolId) arr = arr.filter((t) => t.schoolId === params.schoolId);
    if (params?.assignee) arr = arr.filter((t) => (t.assignee || '').includes(params.assignee!));
    if (params?.start)
      arr = arr.filter((t) => Date.parse(t.createdAt) >= Date.parse(params.start!));
    if (params?.end) arr = arr.filter((t) => Date.parse(t.createdAt) <= Date.parse(params.end!));
    arr.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const p = Math.max(1, parseInt(String(params?.page ?? 1), 10) || 1);
    const ps = Math.max(1, parseInt(String(params?.pageSize ?? 50), 10) || 50);
    const total = arr.length;
    const items = arr.slice((p - 1) * ps, p * ps);
    return { items, total, page: p, pageSize: ps };
  }

  createTask(b: {
    type: InspectType;
    schoolId: string;
    schoolName?: string;
    assignee?: string;
    grid?: string;
    content: string;
  }) {
    if (!b?.type || !b?.schoolId || !b?.content)
      throw new BadRequestException('type/schoolId/content required');
    const t: InspectTask = {
      id: this.id('CHK'),
      type: b.type,
      schoolId: b.schoolId,
      schoolName: b.schoolName,
      assignee: b.assignee,
      grid: b.grid,
      content: b.content,
      status: '待处理',
      createdAt: this.now(),
    };
    this.tasks.unshift(t);
    return t;
  }

  createRandomTasks(b: {
    item: string;
    inspectorCount?: number;
    schoolIds?: string[];
    schoolCount?: number;
    candidates?: { inspectors?: Inspector[]; schools?: Array<{ id: string; name: string }> };
  }) {
    const inspectors =
      b.candidates?.inspectors && b.candidates!.inspectors!.length
        ? b.candidates!.inspectors!
        : this.inspectors;
    const schoolsList =
      b.candidates?.schools && b.candidates!.schools!.length ? b.candidates!.schools! : [];
    if (!inspectors.length) throw new BadRequestException('no inspectors configured');
    if (!b.item) throw new BadRequestException('item required');
    // pick inspectors
    const insCount = Math.max(1, b.inspectorCount || 1);
    const pickedIns = this.pickRandom(inspectors, insCount);
    // pick schools
    const targetSchools =
      b.schoolIds && b.schoolIds.length
        ? b.schoolIds.map((id) => ({ id, name: schoolsList.find((s) => s.id === id)?.name || id }))
        : schoolsList.length
          ? this.pickRandom(schoolsList, Math.max(1, b.schoolCount || 1))
          : [];
    if (targetSchools.length === 0) throw new BadRequestException('no schools provided');
    const created: InspectTask[] = [];
    for (const s of targetSchools) {
      const ins = pickedIns[Math.floor(Math.random() * pickedIns.length)];
      created.push(
        this.createTask({
          type: '双随机',
          schoolId: s.id,
          schoolName: s.name,
          assignee: ins.name,
          content: b.item,
        }),
      );
    }
    return { count: created.length, items: created };
  }

  updateTask(
    id: string,
    patch: Partial<Pick<InspectTask, 'assignee' | 'grid' | 'status' | 'content'>>,
  ) {
    const idx = this.tasks.findIndex((t) => t.id === id);
    if (idx === -1) throw new BadRequestException('task not found');
    this.tasks[idx] = { ...this.tasks[idx], ...patch };
    return this.tasks[idx];
  }

  submitResult(
    id: string,
    body: {
      passed: boolean;
      items: Array<{ item: string; ok: boolean; remark?: string; penaltyType?: string }>;
      summary?: string;
    },
  ) {
    const idx = this.tasks.findIndex((t) => t.id === id);
    if (idx === -1) throw new BadRequestException('task not found');
    const now = this.now();
    this.tasks[idx] = {
      ...this.tasks[idx],
      status: '已完成',
      completedAt: now,
      result: { passed: body.passed, items: body.items || [], summary: body.summary },
    };
    return this.tasks[idx];
  }

  listInspectors() {
    return this.inspectors.slice();
  }
  createInspector(b: { name: string; region?: string; mobile?: string; grids?: string[] }) {
    if (!b?.name) throw new BadRequestException('name required');
    const it: Inspector = {
      id: this.id('USR'),
      name: b.name,
      region: b.region,
      mobile: b.mobile,
      grids: b.grids || [],
    };
    this.inspectors.push(it);
    return it;
  }
  updateInspector(id: string, patch: Partial<Inspector>) {
    const idx = this.inspectors.findIndex((i) => i.id === id);
    if (idx === -1) throw new BadRequestException('inspector not found');
    this.inspectors[idx] = { ...this.inspectors[idx], ...patch, id: this.inspectors[idx].id };
    return this.inspectors[idx];
  }
  deleteInspector(id: string) {
    const before = this.inspectors.length;
    this.inspectors = this.inspectors.filter((i) => i.id !== id);
    return { ok: this.inspectors.length < before };
  }
  setInspectors(list: Inspector[]) {
    this.inspectors = list || [];
    return { count: this.inspectors.length };
  }

  listConfig() {
    return this.config;
  }
  addConfigItem(type: 'items' | 'penalties' | 'publications', name: string) {
    const n = (name || '').trim();
    if (!n) throw new BadRequestException('name required');
    if (!this.config[type].includes(n)) this.config[type].push(n);
    return this.config;
  }
  removeConfigItem(type: 'items' | 'penalties' | 'publications', name: string) {
    this.config[type] = this.config[type].filter((x) => x !== name);
    return this.config;
  }

  private pickRandom<T>(arr: T[], count: number) {
    const a = arr.slice();
    const out: T[] = [];
    for (let i = 0; i < count && a.length; i++) {
      const idx = Math.floor(Math.random() * a.length);
      out.push(a.splice(idx, 1)[0]);
    }
    return out;
  }

  constructor() {
    // seed inspectors
    this.createInspector({ name: '王五', region: '一区' });
    this.createInspector({ name: '李四', region: '二区' });
  }
}
