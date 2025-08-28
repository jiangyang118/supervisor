import { Injectable, BadRequestException, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export type DutyGroup = { id: string; name: string; members: string[]; oncall: string };
export type Plan = { id: string; title: string; flow: string; law?: string; actions?: string[] };
export type AlertType = '事件' | '演练';
export type Alert = {
  id: string;
  type: AlertType;
  title: string;
  level: '一般' | '较大' | '重大';
  at: string;
  status: '待接警' | '已接警' | '已消警';
};
export type Event = {
  id: string;
  type: AlertType;
  title: string;
  at: string;
  status: '未接警' | '已接警' | '已消警';
  planId?: string;
};
export type Meeting = {
  id: string;
  scene: AlertType;
  title: string;
  micOn: boolean;
  camOn: boolean;
  sharing?: boolean;
  participants?: string[];
  startedAt: string;
};
export type Task = {
  id: string;
  scene: AlertType;
  title: string;
  assignees: string[];
  status: '待办' | '进行中' | '已完成';
  createdAt: string;
};
export type Camera = { id: string; name: string };
export type Resource = {
  id: string;
  type: '图片' | '视频' | 'Word' | 'Excel' | 'PPT';
  name: string;
  category?: string;
  createdAt: string;
};

@Injectable()
export class EmergencyService {
  private seq = 1;
  private events$ = new Subject<MessageEvent>();
  private id(p: string) {
    return `${p}-${String(this.seq++).padStart(4, '0')}`;
  }
  private now() {
    return new Date().toISOString();
  }
  stream(): Observable<MessageEvent> {
    setTimeout(() => this.events$.next({ type: 'hello', data: { ok: true } }), 0);
    return this.events$.asObservable();
  }

  duty: DutyGroup[] = [];
  plans: Plan[] = [];
  alerts: Alert[] = [];
  events: Event[] = [];
  meetings: Meeting[] = [];
  tasks: Task[] = [];
  cameras: Camera[] = [];
  resources: Resource[] = [];

  constructor() {
    this.seed();
  }

  // Overview
  overview() {
    const totalEvents = this.events.filter((e) => e.type === '事件').length;
    const totalDrills = this.events.filter((e) => e.type === '演练').length;
    const openMeetings = this.meetings.length;
    const duty = this.duty;
    const recentAlerts = this.alerts.slice(0, 10);
    return { totalEvents, totalDrills, openMeetings, duty, recentAlerts };
  }

  // Alerts and events
  listEvents(params?: { type?: AlertType; status?: Event['status'] }) {
    let arr = this.events.slice();
    if (params?.type) arr = arr.filter((e) => e.type === params.type);
    if (params?.status) arr = arr.filter((e) => e.status === params.status);
    return arr.sort((a, b) => (a.at < b.at ? 1 : -1));
  }
  raiseAlert(b: { type: AlertType; title: string; level: Alert['level'] }) {
    if (!b?.type || !b?.title) throw new BadRequestException('type/title required');
    const al: Alert = {
      id: this.id('ALT'),
      type: b.type,
      title: b.title,
      level: b.level || '一般',
      at: this.now(),
      status: '待接警',
    };
    this.alerts.unshift(al);
    this.events$.next({ type: 'emergency-alert', data: al });
    // also create an event in 未接警状态
    const ev: Event = {
      id: this.id(b.type === '事件' ? 'EV' : 'DL'),
      type: b.type,
      title: b.title,
      at: al.at,
      status: '未接警',
    };
    this.events.unshift(ev);
    return { alert: al, event: ev };
  }
  accept(id: string) {
    const ev = this.events.find((e) => e.id === id);
    if (!ev) throw new BadRequestException('event not found');
    ev.status = '已接警';
    const al = this.alerts.find((a) => a.title === ev.title && a.at === ev.at);
    if (al) al.status = '已接警';
    this.events$.next({ type: 'emergency-accepted', data: ev });
    return ev;
  }
  clear(id: string) {
    const ev = this.events.find((e) => e.id === id);
    if (!ev) throw new BadRequestException('event not found');
    ev.status = '已消警';
    const al = this.alerts.find((a) => a.title === ev.title && a.at === ev.at);
    if (al) al.status = '已消警';
    this.events$.next({ type: 'emergency-cleared', data: ev });
    return ev;
  }
  startPlan(id: string, planId: string) {
    const ev = this.events.find((e) => e.id === id);
    if (!ev) throw new BadRequestException('event not found');
    if (!this.plans.find((p) => p.id === planId)) throw new BadRequestException('plan not found');
    ev.planId = planId;
    this.events$.next({ type: 'plan-started', data: { id, planId } });
    return ev;
  }

  // Plans
  listPlans() {
    return this.plans;
  }
  createPlan(b: { title: string; flow: string; law?: string; actions?: string[] }) {
    if (!b?.title) throw new BadRequestException('title required');
    const p: Plan = {
      id: this.id('PLAN'),
      title: b.title,
      flow: b.flow || '',
      law: b.law,
      actions: b.actions || [],
    };
    this.plans.unshift(p);
    return p;
  }

  // Duty
  listDuty() {
    return this.duty;
  }
  saveDuty(b: { id?: string; name: string; members: string[]; oncall: string }) {
    if (b.id) {
      const i = this.duty.findIndex((x) => x.id === b.id);
      if (i === -1) throw new BadRequestException('not found');
      this.duty[i] = { id: b.id, name: b.name, members: b.members, oncall: b.oncall };
      return this.duty[i];
    }
    const g: DutyGroup = { id: this.id('DTY'), name: b.name, members: b.members, oncall: b.oncall };
    this.duty.unshift(g);
    return g;
  }

  // Command: meeting and tasks
  createMeeting(b: { scene: AlertType; title: string; micOn?: boolean; camOn?: boolean }) {
    if (!b?.title) throw new BadRequestException('title required');
    const m: Meeting = {
      id: this.id('MEET'),
      scene: b.scene || '事件',
      title: b.title,
      micOn: !!b.micOn,
      camOn: !!b.camOn,
      sharing: false,
      participants: [],
      startedAt: this.now(),
    };
    this.meetings.unshift(m);
    this.events$.next({ type: 'meeting-started', data: m });
    return m;
  }
  listMeetings() {
    return this.meetings;
  }
  setMeetingState(id: string, patch: { micOn?: boolean; camOn?: boolean; sharing?: boolean }) {
    const i = this.meetings.findIndex((m) => m.id === id);
    if (i === -1) throw new BadRequestException('meeting not found');
    this.meetings[i] = { ...this.meetings[i], ...patch };
    return this.meetings[i];
  }
  inviteParticipant(id: string, who: string) {
    const i = this.meetings.findIndex((m) => m.id === id);
    if (i === -1) throw new BadRequestException('meeting not found');
    const list = this.meetings[i].participants || [];
    if (who && !list.includes(who)) list.push(who);
    this.meetings[i].participants = list;
    return this.meetings[i];
  }
  listTasks(params?: { scene?: AlertType }) {
    return params?.scene ? this.tasks.filter((t) => t.scene === params.scene) : this.tasks;
  }
  createTask(b: { scene: AlertType; title: string; assignees: string[] }) {
    const t: Task = {
      id: this.id('TSK'),
      scene: b.scene || '事件',
      title: b.title,
      assignees: b.assignees || [],
      status: '待办',
      createdAt: this.now(),
    };
    this.tasks.unshift(t);
    this.events$.next({ type: 'task-created', data: t });
    return t;
  }
  setTaskStatus(id: string, status: Task['status']) {
    const i = this.tasks.findIndex((t) => t.id === id);
    if (i === -1) throw new BadRequestException('not found');
    this.tasks[i].status = status;
    return this.tasks[i];
  }

  // Cameras & resources
  listCameras() {
    return this.cameras;
  }
  listResources() {
    return this.resources;
  }

  // Notifications (simulate)
  notify(b: { scene: AlertType; to: string; via: 'sms' | 'voice' | 'app'; content: string }) {
    // simulation only
    return { ok: true, sentAt: this.now(), ...b };
  }

  private seed() {
    // Duty
    this.duty = [
      { id: this.id('DTY'), name: '一组', members: ['张三', '李四'], oncall: '本周' },
      { id: this.id('DTY'), name: '二组', members: ['王五', '赵六'], oncall: '下周' },
    ];
    // Plans
    this.createPlan({
      title: '食品中毒应急预案',
      flow: '上报-处置-复盘',
      law: '食品安全法',
      actions: ['启动视频会议', '下发任务'],
    });
    // Alerts & events
    this.raiseAlert({ type: '事件', title: '后厨燃气报警', level: '重大' });
    this.raiseAlert({ type: '演练', title: '消防通道演练', level: '一般' });
    // Cameras
    this.cameras = [
      { id: 'S-CH-001', name: '后厨-操作台' },
      { id: 'S-CH-002', name: '后厨-清洗间' },
    ];
    // Resources
    this.resources = [
      {
        id: this.id('RES'),
        type: '视频',
        name: '操作规范',
        category: '培训',
        createdAt: this.now(),
      },
    ];
    // Tasks sample
    this.createTask({ scene: '事件', title: '疏散人员', assignees: ['张三'] });
  }
}
